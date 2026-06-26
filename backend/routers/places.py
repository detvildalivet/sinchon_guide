"""Place endpoints.

Place *details* come live from Google Places (no longer stored). The DB keeps a
thin `Place` row per Google place id purely to anchor Visit/Queue foreign keys;
`resolve_place_id` lazily creates that row on first use.
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Place
from schemas import NearbyPlaceOut, PlaceRefOut, PlaceType
from services import google_places
from services.google_places import PlacesConfigError

router = APIRouter(prefix="/places", tags=["places"])


def resolve_place_id(
    db: Session, google_place_id: str, name: Optional[str] = None
) -> int:
    """Return the local int id for a Google place, creating the thin row if needed.

    Used by visits/queues so behavioural data ("who visited where, when") has a
    stable FK target. Caches `name` for display when provided.
    """
    place = (
        db.query(Place).filter(Place.google_place_id == google_place_id).first()
    )
    if place is None:
        place = Place(google_place_id=google_place_id, name=name)
        db.add(place)
        db.commit()
        db.refresh(place)
    elif name and not place.name:
        place.name = name
        db.commit()
    return place.id


@router.get("/nearby", response_model=list[NearbyPlaceOut])
async def nearby_places(
    lat: float = Query(...),
    lng: float = Query(...),
    type: PlaceType = Query(...),
    radius: Optional[int] = Query(default=None, ge=50, le=50000),
):
    """Live venues of a category near (lat, lng), sourced from Google Places."""
    try:
        results = await google_places.nearby_search(lat, lng, type, radius)
    except PlacesConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    return [
        NearbyPlaceOut(
            google_place_id=p.google_place_id,
            name=p.name,
            latitude=p.latitude,
            longitude=p.longitude,
            address=p.address,
            place_type=type,
            rating=p.rating,
        )
        for p in results
    ]


@router.get("/details/{google_place_id}", response_model=NearbyPlaceOut)
async def place_details(google_place_id: str):
    """Live details for a single Google place id."""
    try:
        detail = await google_places.place_details(google_place_id)
    except PlacesConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    if detail is None:
        raise HTTPException(status_code=404, detail="Place not found")
    return NearbyPlaceOut(
        google_place_id=detail.google_place_id,
        name=detail.name,
        latitude=detail.latitude,
        longitude=detail.longitude,
        address=detail.address,
        place_type=detail.place_type or "restaurant",
        rating=detail.rating,
    )


@router.get("/{place_id}", response_model=PlaceRefOut)
def get_place_ref(place_id: int, db: Session = Depends(get_db)):
    """Resolve a local int place id to its thin reference row (used by history)."""
    place = db.query(Place).filter(Place.id == place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    return place
