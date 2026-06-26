from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Place, User, Visit
from routers.places import resolve_place_id
from schemas import VisitEnd, VisitFeedback, VisitOut, VisitStart

router = APIRouter(prefix="/visits", tags=["visits"])


@router.post("", response_model=VisitOut, status_code=status.HTTP_201_CREATED)
def start_visit(
    payload: VisitStart,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    place_id = resolve_place_id(db, payload.google_place_id, payload.name)
    visit = Visit(
        user_id=user.id,
        place_id=place_id,
        arrived_at=payload.arrived_at or datetime.utcnow(),
    )
    db.add(visit)
    db.commit()
    _update_revisited_rate(db, place_id)
    db.commit()
    db.refresh(visit)
    return visit


@router.patch("/{visit_id}/end", response_model=VisitOut)
def end_visit(
    visit_id: int,
    payload: VisitEnd,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    visit = _get_owned_visit(db, visit_id, user.id)
    if visit.left_at is not None:
        raise HTTPException(status_code=400, detail="Visit already ended")
    visit.left_at = payload.left_at or datetime.utcnow()
    db.commit()
    db.refresh(visit)
    return visit


@router.patch("/{visit_id}/feedback", response_model=VisitOut)
def submit_feedback(
    visit_id: int,
    payload: VisitFeedback,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    visit = _get_owned_visit(db, visit_id, user.id)
    if visit.feedback_submitted:
        raise HTTPException(status_code=400, detail="Feedback already submitted")

    if payload.disliked:
        visit.disliked = True
        visit.mood = None
        visit.price = None
    else:
        if payload.mood is None or payload.price is None:
            raise HTTPException(
                status_code=422,
                detail="mood and price required when disliked is False",
            )
        visit.mood = payload.mood
        visit.price = payload.price
        visit.disliked = False

    visit.feedback_submitted = True
    db.commit()
    db.refresh(visit)
    return visit


@router.get("/me", response_model=list[VisitOut])
def list_my_visits(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (
        db.query(Visit)
        .filter(Visit.user_id == user.id)
        .order_by(Visit.arrived_at.desc())
        .all()
    )


@router.get("/me/pending-feedback", response_model=list[VisitOut])
def list_pending_feedback(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Visits that are completed (left_at set) but feedback not yet submitted."""
    return (
        db.query(Visit)
        .filter(
            Visit.user_id == user.id,
            Visit.left_at.isnot(None),
            Visit.feedback_submitted.is_(False),
        )
        .order_by(Visit.left_at.desc())
        .all()
    )


def _update_revisited_rate(db: Session, place_id: int) -> None:
    subq = (
        db.query(Visit.user_id, func.count(Visit.id).label("cnt"))
        .filter(Visit.place_id == place_id)
        .group_by(Visit.user_id)
        .subquery()
    )
    total = db.query(func.count()).select_from(subq).scalar() or 0
    revisitors = (
        db.query(func.count()).select_from(subq).filter(subq.c.cnt >= 2).scalar() or 0
    )
    rate = revisitors / total if total > 0 else 0.0
    db.query(Place).filter(Place.id == place_id).update({"revisited_rate": rate})


def _get_owned_visit(db: Session, visit_id: int, user_id: int) -> Visit:
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    if visit.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your visit")
    return visit
