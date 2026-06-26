"""Server-side wrapper around the Google Places API (New, v1).

The app's DB stores only behavioural data ("who visited where, when" + queues);
all place details (name, coords, address, rating) are fetched live from Google
through these helpers. Calls are billed per request, so responses are cached
in-process for a short TTL.

Requires the **Places API (New)** and **Geocoding API** enabled on the key in
config.GOOGLE_MAPS_API_KEY. Place IDs returned here are stable Google place IDs
and are the identity used by the rest of the backend.
"""
from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Optional

import httpx

import config

_PLACES_BASE = "https://places.googleapis.com/v1"
_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

# App venue category -> Google place "primary types" used for Nearby Search.
_CATEGORY_TYPES: dict[str, list[str]] = {
    "restaurant": ["restaurant"],
    "cafe": ["cafe", "coffee_shop"],
    "bar": ["bar"],
}


@dataclass
class NearbyPlace:
    google_place_id: str
    name: str
    latitude: float
    longitude: float
    address: Optional[str]
    place_type: str
    rating: Optional[float]


class PlacesConfigError(RuntimeError):
    """Raised when the server has no Google Maps key configured."""


# --------------------------- tiny TTL cache ---------------------------

_cache: dict[str, tuple[float, object]] = {}


def _cache_get(key: str):
    hit = _cache.get(key)
    if not hit:
        return None
    expires, value = hit
    if expires < time.monotonic():
        _cache.pop(key, None)
        return None
    return value


def _cache_put(key: str, value: object) -> None:
    _cache[key] = (time.monotonic() + config.PLACES_CACHE_TTL_S, value)


# --------------------------- API calls ---------------------------

def _require_key() -> str:
    if not config.GOOGLE_MAPS_API_KEY:
        raise PlacesConfigError(
            "GOOGLE_MAPS_API_KEY is not set. Add it to backend/.env."
        )
    return config.GOOGLE_MAPS_API_KEY


async def nearby_search(
    latitude: float,
    longitude: float,
    place_type: str,
    radius: Optional[int] = None,
    max_results: int = 20,
) -> list[NearbyPlace]:
    """Return venues of `place_type` near (lat, lng) via Places API (New)."""
    key = _require_key()
    included = _CATEGORY_TYPES.get(place_type, [place_type])
    radius_m = radius or config.PLACES_DEFAULT_RADIUS_M

    cache_key = f"nearby:{latitude:.5f},{longitude:.5f}:{place_type}:{radius_m}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached  # type: ignore[return-value]

    body = {
        "includedTypes": included,
        "maxResultCount": max_results,
        "rankPreference": "DISTANCE",
        "locationRestriction": {
            "circle": {
                "center": {"latitude": latitude, "longitude": longitude},
                "radius": float(radius_m),
            }
        },
    }
    field_mask = (
        "places.id,places.displayName,places.location,"
        "places.formattedAddress,places.rating"
    )
    headers = {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": field_mask,
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"{_PLACES_BASE}/places:searchNearby", json=body, headers=headers
        )
        resp.raise_for_status()
        data = resp.json()

    results: list[NearbyPlace] = []
    for p in data.get("places", []):
        loc = p.get("location") or {}
        results.append(
            NearbyPlace(
                google_place_id=p.get("id", ""),
                name=(p.get("displayName") or {}).get("text", ""),
                latitude=loc.get("latitude", 0.0),
                longitude=loc.get("longitude", 0.0),
                address=p.get("formattedAddress"),
                place_type=place_type,
                rating=p.get("rating"),
            )
        )

    _cache_put(cache_key, results)
    return results


async def place_details(google_place_id: str) -> Optional[NearbyPlace]:
    """Fetch details for a single Google place id."""
    key = _require_key()

    cache_key = f"details:{google_place_id}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached  # type: ignore[return-value]

    field_mask = (
        "id,displayName,location,formattedAddress,rating,primaryType"
    )
    headers = {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": field_mask,
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{_PLACES_BASE}/places/{google_place_id}", headers=headers
        )
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        p = resp.json()

    loc = p.get("location") or {}
    detail = NearbyPlace(
        google_place_id=p.get("id", google_place_id),
        name=(p.get("displayName") or {}).get("text", ""),
        latitude=loc.get("latitude", 0.0),
        longitude=loc.get("longitude", 0.0),
        address=p.get("formattedAddress"),
        place_type=p.get("primaryType", ""),
        rating=p.get("rating"),
    )
    _cache_put(cache_key, detail)
    return detail


async def geocode(address: str) -> Optional[tuple[float, float]]:
    """Geocode a free-text address to (lat, lng) via the Geocoding API."""
    key = _require_key()
    params = {"address": address, "key": key}
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(_GEOCODE_URL, params=params)
        resp.raise_for_status()
        data = resp.json()
    results = data.get("results") or []
    if not results:
        return None
    loc = results[0]["geometry"]["location"]
    return loc["lat"], loc["lng"]
