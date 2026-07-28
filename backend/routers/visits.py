from datetime import datetime

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import HistoryClear, User, Visit
from schemas import VisitCreate, VisitOut

router = APIRouter(prefix="/visits", tags=["visits"])

# Cap on GET /visits — enough for a scrollable history screen without an
# unbounded query as a user's visit count grows over time.
HISTORY_LIMIT = 50


@router.post("", status_code=status.HTTP_201_CREATED)
def create_visit(
    payload: VisitCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Record that the user chose to be guided to a place.

    The recommendation scorer reads these back (grouped by place_id) as a
    personalization tiebreaker; the History screen reads them back too, via
    GET below.
    """
    visit = Visit(
        user_id=user.id,
        place_id=payload.place_id,
        place_name=payload.place_name,
        type=payload.type,
        budget=payload.budget,
    )
    db.add(visit)
    db.commit()
    return {"ok": True}


@router.get("", response_model=list[VisitOut])
def list_visits(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """The user's own visit history, newest first — backs the History screen.

    Visits were write-only from the client's perspective until this endpoint
    existed (read back server-side only, by the scorer); there was no way for
    a user to see their own history in the app.

    If the user has cleared their history (see clear_visits below), rows at
    or before that cutoff are excluded here — but ONLY here. The scorer's
    personalization query in routers/recommendations.py reads Visit directly
    and never consults HistoryClear, so a cleared visit still counts toward
    recommendations; clearing is a visible-history concept only.
    """
    query = db.query(Visit).filter(Visit.user_id == user.id)

    marker = (
        db.query(HistoryClear).filter(HistoryClear.user_id == user.id).first()
    )
    if marker is not None:
        query = query.filter(Visit.created_at > marker.cleared_at)

    return query.order_by(Visit.created_at.desc()).limit(HISTORY_LIMIT).all()


@router.delete("", status_code=status.HTTP_200_OK)
def clear_visits(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Hide the user's visible history up to now (list_visits above).

    Does NOT delete or modify any Visit row — those keep counting toward the
    recommendation scorer's personalization signal forever (see HistoryClear's
    docstring in models.py). Calling this again later just pushes the cutoff
    forward, so visits made after a clear naturally reappear until the next one.
    """
    marker = (
        db.query(HistoryClear).filter(HistoryClear.user_id == user.id).first()
    )
    now = datetime.utcnow()
    if marker is None:
        db.add(HistoryClear(user_id=user.id, cleared_at=now))
    else:
        marker.cleared_at = now
    db.commit()
    return {"ok": True}
