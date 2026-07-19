import os

import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user
from models import User
from schemas import RouteIn, RouteOut

router = APIRouter(prefix="/routes", tags=["routes"])

ROUTES_API_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"
FIELD_MASK = "routes.polyline.encodedPolyline,routes.distanceMeters,routes.duration"


def _api_key() -> str:
    key = os.environ.get("GOOGLE_MAPS_SERVER_KEY")
    if not key:
        raise RuntimeError(
            "GOOGLE_MAPS_SERVER_KEY is not set — required to call Google Routes API"
        )
    return key


@router.post("", response_model=RouteOut)
def compute_route(
    payload: RouteIn,
    _user: User = Depends(get_current_user),
):
    """Stage 4 (Guide): walking route from the user to the chosen place.

    Returns only a polyline + distance for the in-app map preview — real
    turn-by-turn navigation is handed off to the Google Maps app (see
    GuideScreen's "Open in Google Maps" deep link), not built here.
    """
    body = {
        "origin": {
            "location": {
                "latLng": {
                    "latitude": payload.origin.lat,
                    "longitude": payload.origin.lng,
                }
            }
        },
        "destination": {
            "location": {
                "latLng": {
                    "latitude": payload.destination.lat,
                    "longitude": payload.destination.lng,
                }
            }
        },
        "travelMode": "WALK",
    }
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": _api_key(),
        "X-Goog-FieldMask": FIELD_MASK,
    }

    with httpx.Client(timeout=10.0) as client:
        response = client.post(ROUTES_API_URL, json=body, headers=headers)
        response.raise_for_status()
        data = response.json()

    routes = data.get("routes", [])
    if not routes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No walking route found",
        )

    route = routes[0]
    distance_meters = route.get("distanceMeters", 0)
    duration_str = route.get("duration", "0s")  # e.g. "634s"
    duration_seconds = int(duration_str.rstrip("s")) if duration_str.endswith("s") else 0

    return RouteOut(
        polyline=route["polyline"]["encodedPolyline"],
        distance_minutes=max(1, round(duration_seconds / 60)),
        distance_meters=distance_meters,
    )
