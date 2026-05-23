from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Place, User
from schemas import PlaceCreate, PlaceOut, PlaceType

router = APIRouter(prefix="/places", tags=["places"])


@router.get("", response_model=list[PlaceOut])
def list_places(
    place_type: Optional[PlaceType] = Query(default=None),
    db: Session = Depends(get_db),
):
    q = db.query(Place)
    if place_type:
        q = q.filter(Place.place_type == place_type)
    return q.order_by(Place.created_at.desc()).limit(100).all()


@router.get("/search", response_model=list[PlaceOut])
def search_places(
    q: str = Query(min_length=1),
    db: Session = Depends(get_db),
):
    like = f"%{q}%"
    return (
        db.query(Place)
        .filter((Place.name.ilike(like)) | (Place.address.ilike(like)))
        .limit(50)
        .all()
    )


@router.post("", response_model=PlaceOut, status_code=status.HTTP_201_CREATED)
def upsert_place(
    payload: PlaceCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Lazy-insert a place. If google_place_id matches an existing row, return it; otherwise insert."""
    if payload.google_place_id:
        existing = (
            db.query(Place)
            .filter(Place.google_place_id == payload.google_place_id)
            .first()
        )
        if existing:
            return existing

    place = Place(**payload.model_dump())
    db.add(place)
    db.commit()
    db.refresh(place)
    return place


@router.get("/{place_id}", response_model=PlaceOut)
def get_place(place_id: int, db: Session = Depends(get_db)):
    place = db.query(Place).filter(Place.id == place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    return place
