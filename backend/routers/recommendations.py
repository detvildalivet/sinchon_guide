from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from schemas import PlaceType, SoloMenuRecommendationOut
from services.recommendation import recommend_solo

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/solo", response_model=list[SoloMenuRecommendationOut])
def solo_recommendations(
    hour: Optional[int] = Query(default=None, ge=0, le=23),
    limit: int = Query(default=6, ge=1, le=20),
    category: Optional[PlaceType] = Query(default=None),
    db: Session = Depends(get_db),
):
    """Ranked solo-dining menu recommendations.

    `hour` should be the client's local hour (new Date().getHours()) so rankings
    match the frontend; falls back to the server clock if omitted.
    """
    return recommend_solo(db, hour=hour, limit=limit, category=category)
