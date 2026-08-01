import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user
from models import User
from schemas import LatLng, RouteIn, RouteOut
from services.api_errors import request_external_api, require_tmap_key

router = APIRouter(prefix="/routes", tags=["routes"])

PEDESTRIAN_API_URL = "https://apis.openapi.sk.com/tmap/routes/pedestrian"


def tmap_geojson_to_route(data: dict) -> RouteOut:
    """Pure transform: TMAP Pedestrian Route API GeoJSON -> RouteOut.

    TMAP returns a GeoJSON FeatureCollection. Point features (start/end/turn
    markers) carry the route-level `totalDistance`/`totalTime` in their
    properties; LineString features carry the actual walking-path geometry
    as `[lng, lat]` coordinate pairs, in order, one feature per path segment.
    Concatenating every LineString's coordinates (in feature order) gives
    the full path — no re-encoding needed since NaverMapPathOverlay takes
    `{latitude, longitude}` coords directly.
    """
    if not isinstance(data, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Tmap Pedestrian API returned an unexpected response format",
        )

    features = data.get("features", [])
    if not features:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No walking route found",
        )

    total_distance_meters = 0
    total_time_seconds = 0
    coordinates: list[LatLng] = []

    for feature in features:
        if not isinstance(feature, dict):
            continue
        geometry = feature.get("geometry") or {}
        properties = feature.get("properties") or {}

        if "totalDistance" in properties:
            total_distance_meters = properties["totalDistance"]
        if "totalTime" in properties:
            total_time_seconds = properties["totalTime"]

        if geometry.get("type") == "LineString":
            for position in geometry.get("coordinates") or []:
                # A GeoJSON position is legally [lng, lat] or
                # [lng, lat, elevation] — index instead of unpacking so a
                # 3-element position doesn't raise, and skip anything
                # malformed instead of crashing the whole request.
                if not isinstance(position, (list, tuple)) or len(position) < 2:
                    continue
                coordinates.append(LatLng(latitude=position[1], longitude=position[0]))

    if not coordinates:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No walking route found",
        )

    return RouteOut(
        coordinates=coordinates,
        distance_minutes=max(1, round(total_time_seconds / 60)),
        distance_meters=total_distance_meters,
    )


@router.post("", response_model=RouteOut)
def compute_route(
    payload: RouteIn,
    _user: User = Depends(get_current_user),
):
    """Stage 4 (Guide): walking route from the user to the chosen place.

    Returns coordinates + distance for the in-app map preview (rendered via
    NaverMapPathOverlay) — real turn-by-turn navigation is handed off to the
    Naver Map app (see GuideScreen's handoff button), not built here.

    Uses TMAP's Pedestrian Route API rather than Google Routes: South
    Korea's Act on National Spatial Data Infrastructure bars Google's
    (non-Korean) routing servers from computing detailed Korean route
    geometry, so Google Routes reliably 404s for every real Sinchon
    origin/destination pair. TMAP is a Korea-based provider and isn't
    subject to that restriction. See CLAUDE.md for details.
    """
    body = {
        "startX": payload.origin.lng,
        "startY": payload.origin.lat,
        "endX": payload.destination.lng,
        "endY": payload.destination.lat,
        "startName": "출발",
        "endName": "도착",
        "reqCoordType": "WGS84GEO",
        "resCoordType": "WGS84GEO",
        "searchOption": "0",
        "sort": "index",
    }
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "appKey": require_tmap_key(),
    }

    with httpx.Client(timeout=10.0) as client:
        response = request_external_api(
            client,
            "POST",
            f"{PEDESTRIAN_API_URL}?version=1",
            "Tmap Pedestrian API",
            json=body,
            headers=headers,
        )
        try:
            data = response.json()
        except ValueError as exc:
            # request_external_api only guards the HTTP call itself (connection
            # error + non-2xx status) — a 2xx response with a body TMAP's own
            # docs don't predict (e.g. for a degenerate/out-of-service-area
            # request) still needs to fail cleanly here rather than as a raw,
            # undetailed 500.
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Tmap Pedestrian API returned an unreadable response",
            ) from exc

    return tmap_geojson_to_route(data)
