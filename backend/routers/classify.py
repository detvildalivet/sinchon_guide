from fastapi import APIRouter, Depends

from auth import get_current_user
from models import User
from schemas import ClassifyIn, ClassifyOut
from services.classify import classify_need_type

router = APIRouter(prefix="/classify", tags=["classify"])


@router.post("", response_model=ClassifyOut)
def classify(
    payload: ClassifyIn,
    user: User = Depends(get_current_user),
) -> ClassifyOut:
    """Ask -> categorize, stage 2. Turns AskScreen's free-text input into a
    place category via services/classify.py — one of the 4 curated types or
    an open Korean keyword. type is None (not an error) when Claude
    couldn't tell what kind of place the user wants — see that module's
    docstring for the fail-soft contract this endpoint relies on.
    """
    return ClassifyOut(type=classify_need_type(payload.text))
