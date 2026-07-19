from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import User, Visit
from schemas import NeedIn, RecommendationOut
from services.places import search_nearby
from services.recommendation import score_candidates

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.post("", response_model=list[RecommendationOut])
def recommend(
    need: NeedIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Ask -> categorize -> recommend, stage 3.

    Queries Google Places for candidates near the user, then ranks them
    closest-first with rating/budget/history as tiebreakers. See
    services/recommendation.py for the scoring policy.
    """
    candidates = search_nearby(db, need.lat, need.lng, need.type)

    visit_rows = (
        db.query(Visit.google_place_id, func.count(Visit.id))
        .filter(Visit.user_id == user.id)
        .group_by(Visit.google_place_id)
        .all()
    )
    visit_counts_by_place = {row[0]: row[1] for row in visit_rows}

    ranked = score_candidates(
        candidates,
        need_type=need.type,
        budget=need.budget,
        user_lat=need.lat,
        user_lng=need.lng,
        visit_counts_by_place=visit_counts_by_place,
    )
    return ranked
