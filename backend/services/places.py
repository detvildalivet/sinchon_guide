"""Google Places API (New) integration.

This is the app's only source of place breadth — the server does not own a
place catalog. It queries Nearby Search around the user's location and caches
a thin PlaceAnnotation row per result (see models.PlaceAnnotation) so future
personalization signals (curated tags, visit history) have somewhere to live
without mirroring all of Sinchon.

The Google server-side API key lives only here; it is never shipped to the
client. Read lazily (at call time, not import time) so the app still boots
and tests still run without GOOGLE_MAPS_SERVER_KEY configured.
"""
from datetime import datetime
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from models import PlaceAnnotation
from services.google_errors import require_api_key, request_google_api

PLACES_API_URL = "https://places.googleapis.com/v1/places:searchNearby"

SEARCH_RADIUS_METERS = 1200.0

# Need.type -> Places API `includedTypes`.
TYPE_MAP: dict[str, list[str]] = {
    "meal": ["restaurant"],
    "cafe": ["cafe"],
    "drinks": ["bar"],
    "dessert": ["bakery", "dessert_shop", "ice_cream_shop"],
}

# Google's Places (New) priceLevel enum, mapped to an integer 0-4 for scoring.
_PRICE_LEVEL_TO_INT = {
    "PRICE_LEVEL_FREE": 0,
    "PRICE_LEVEL_INEXPENSIVE": 1,
    "PRICE_LEVEL_MODERATE": 2,
    "PRICE_LEVEL_EXPENSIVE": 3,
    "PRICE_LEVEL_VERY_EXPENSIVE": 4,
}

FIELD_MASK = (
    "places.id,places.displayName,places.location,places.rating,"
    "places.priceLevel,places.currentOpeningHours.openNow,places.primaryType"
)


def _matches_need_type(primary_type: Optional[str], need_type: str) -> bool:
    """Nearby Search's `includedTypes` filter matches a place's whole `types`
    list, not just its primaryType — e.g. a McDonald's carries a generic
    "cafe"-ish secondary type alongside "hamburger_restaurant" and slips into
    cafe results even though no one would call it a cafe. Re-check against
    the type Google itself picked as primary before trusting the category.
    """
    return primary_type in TYPE_MAP[need_type]


def search_nearby(db: Session, lat: float, lng: float, need_type: str) -> list[dict]:
    """Query Places API (New) Nearby Search for candidates around (lat, lng).

    Budget is intentionally NOT sent as a request filter — Nearby Search
    (unlike Text Search) does not reliably support a `priceLevels` request
    field. Budget fit is instead scored client-side (services/recommendation.py)
    using the `priceLevel` each result returns.

    Returns a list of plain dicts: {place_id, name, lat, lng, rating,
    price_level, open_now}.
    """
    body = {
        "includedTypes": TYPE_MAP[need_type],
        "maxResultCount": 20,
        "rankPreference": "DISTANCE",
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": SEARCH_RADIUS_METERS,
            }
        },
    }
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": require_api_key(),
        "X-Goog-FieldMask": FIELD_MASK,
    }

    with httpx.Client(timeout=10.0) as client:
        response = request_google_api(
            client, "POST", PLACES_API_URL, "Google Places API", json=body, headers=headers
        )
        data = response.json()

    candidates: list[dict] = []
    for place in data.get("places", []):
        if not _matches_need_type(place.get("primaryType"), need_type):
            continue
        location = place.get("location", {})
        candidate = {
            "place_id": place["id"],
            "name": place.get("displayName", {}).get("text", "이름 없음"),
            "lat": location.get("latitude"),
            "lng": location.get("longitude"),
            "rating": place.get("rating"),
            "price_level": _PRICE_LEVEL_TO_INT.get(place.get("priceLevel", "")),
            "open_now": place.get("currentOpeningHours", {}).get("openNow"),
        }
        candidates.append(candidate)
        _upsert_annotation(db, candidate)

    db.commit()
    return candidates


def _upsert_annotation(db: Session, candidate: dict) -> None:
    row: Optional[PlaceAnnotation] = (
        db.query(PlaceAnnotation)
        .filter(PlaceAnnotation.place_id == candidate["place_id"])
        .first()
    )
    if row is None:
        row = PlaceAnnotation(place_id=candidate["place_id"], curated_tags=[])
        db.add(row)

    row.name = candidate["name"]
    row.lat = candidate["lat"]
    row.lng = candidate["lng"]
    row.rating = candidate["rating"]
    row.price_level = candidate["price_level"]
    row.last_fetched = datetime.utcnow()
