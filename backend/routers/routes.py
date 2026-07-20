import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user
from models import User
from schemas import RouteIn, RouteOut
from services.google_errors import require_api_key, request_google_api

router = APIRouter(prefix="/routes", tags=["routes"])

ROUTES_API_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"
FIELD_MASK = "routes.polyline.encodedPolyline,routes.distanceMeters,routes.duration"


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
        "X-Goog-Api-Key": require_api_key(),
        "X-Goog-FieldMask": FIELD_MASK,
    }

    with httpx.Client(timeout=10.0) as client:
        response = request_google_api(
            client, "POST", ROUTES_API_URL, "Google Routes API", json=body, headers=headers
        )
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
