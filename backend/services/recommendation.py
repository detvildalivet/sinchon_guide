"""Solo-menu recommendation scoring.

Ported verbatim from the frontend `src/logic/soloMenuRecommendation.ts` so backend
and client produce identical rankings. The frontend passes its local `hour`
(new Date().getHours()) to avoid server-timezone drift.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from models import MenuItem
from schemas import SoloMenuRecommendationOut

SLOT_LABELS = {
    "breakfast": "아침",
    "lunch": "점심",
    "snack": "오후",
    "dinner": "저녁",
    "late": "늦은 시간",
}


def get_meal_slot(hour: int) -> str:
    if 7 <= hour < 10:
        return "breakfast"
    if 11 <= hour < 14:
        return "lunch"
    if 14 <= hour < 17:
        return "snack"
    if 17 <= hour < 22:
        return "dinner"
    return "late"


def score_menu(item: MenuItem, hour: int) -> float:
    slot = get_meal_slot(hour)
    score = item.solo_score

    if item.meal_slot == slot:
        score += 18
    elif slot in ("lunch", "dinner") and item.meal_slot in ("lunch", "dinner"):
        score += 8

    score -= item.distance_minutes * 0.6

    tags = item.tags or []
    if "혼밥" in tags:
        score += 6

    if "빠른 식사" in tags and slot in ("lunch", "snack"):
        score += 5

    return round(score * 10) / 10


def build_reason(item: MenuItem, hour: int) -> str:
    slot = get_meal_slot(hour)
    tags = item.tags or []

    if item.meal_slot == slot:
        return f"{SLOT_LABELS[slot]} 시간대에 잘 맞는 혼밥 메뉴예요."
    if "혼밥" in tags:
        return "혼자 먹기 편한 메뉴로 점수가 높아요."
    return "가까운 거리와 메뉴 구성을 기준으로 추천했어요."


def recommend_solo(
    db: Session,
    hour: Optional[int] = None,
    limit: int = 6,
    category: Optional[str] = None,
) -> list[SoloMenuRecommendationOut]:
    if hour is None:
        hour = datetime.now().hour

    q = db.query(MenuItem)
    if category:
        q = q.filter(MenuItem.category == category)
    items = q.all()

    scored = [
        SoloMenuRecommendationOut(
            id=item.code or str(item.id),
            menu_name=item.menu_name,
            venue_name=item.venue_name,
            category=item.category,
            description=item.description,
            distance=item.distance,
            tags=item.tags or [],
            score=score_menu(item, hour),
            reason=build_reason(item, hour),
        )
        for item in items
    ]
    scored.sort(key=lambda r: r.score, reverse=True)
    return scored[:limit]
