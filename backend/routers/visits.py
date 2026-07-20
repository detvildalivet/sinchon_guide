from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import User, Visit
from schemas import VisitCreate

router = APIRouter(prefix="/visits", tags=["visits"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_visit(
    payload: VisitCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Record that the user chose to be guided to a place.

    This is the only write path for Visit rows; the recommendation scorer
    reads them back (grouped by type) as a subtle personalization tiebreaker.
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
