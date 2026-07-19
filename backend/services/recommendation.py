"""Pure scoring/ranking of Places candidates against a user's Need.

Deliberately has no DB/network access — it's a plain function over plain
data (candidate dicts + Need + visit counts), which keeps it trivially
testable (see backend/tests/test_recommendation.py) the same way the old
score_menu() was testable before this rebuild.

Ranking policy (settled during brainstorming): CLOSEST-FIRST. Walking
distance dominates the score; rating, budget-fit, and visit-history
personalization only matter as near-tie breakers. A place that's currently
closed always ranks below one that's open.
"""
import math
from typing import Optional

WALK_METERS_PER_MINUTE = 80.0

# Need.budget -> the price_level bucket (Google's 0-4 scale) it maps to.
_BUDGET_BUCKETS = {
    "cheap": {0, 1},
    "mid": {2},
    "splurge": {3, 4},
}

_CLOSED_PENALTY = 1000.0
_DEFAULT_RATING = 3.5  # used when a candidate has no rating, so it doesn't get unfairly penalized
_MAX_PERSONALIZATION_VISITS = 4
_PERSONALIZATION_WEIGHT = 0.5


def haversine_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371000.0  # Earth radius, meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)
    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    return 2 * r * math.asin(math.sqrt(a))


def _budget_fit(price_level: Optional[int], budget: str) -> float:
    if price_level is None:
        return 0.5  # unknown price — mild neutral score, neither rewarded nor punished
    bucket = _BUDGET_BUCKETS[budget]
    if price_level in bucket:
        return 2.0
    if min(abs(price_level - b) for b in bucket) == 1:
        return 1.0  # one level outside the requested bucket
    return 0.0


def _reason(distance_minutes: int, rating: Optional[float], budget_ok: bool) -> str:
    parts = [f"도보 {distance_minutes}분"]
    if rating is not None:
        parts.append(f"평점 {rating:.1f}")
    if budget_ok:
        parts.append("예산 맞음")
    return " · ".join(parts)


def score_candidates(
    candidates: list[dict],
    need_type: str,
    budget: str,
    user_lat: float,
    user_lng: float,
    visit_counts_by_place: Optional[dict[str, int]] = None,
) -> list[dict]:
    """Score and sort candidates descending. Each output dict adds
    distance_minutes, score, and reason to the input candidate fields.

    visit_counts_by_place is keyed by Google place_id (not need_type): a
    per-type count would be a constant added to every candidate in a single
    request (since need_type is fixed per call) and could never actually
    break a tie between candidates. Per-place history — "you've been here
    before" — is the signal that can.
    """
    visit_counts_by_place = visit_counts_by_place or {}

    scored = []
    for candidate in candidates:
        distance_m = haversine_meters(user_lat, user_lng, candidate["lat"], candidate["lng"])
        distance_minutes = max(1, round(distance_m / WALK_METERS_PER_MINUTE))

        rating = candidate.get("rating")
        rating_bonus = rating if rating is not None else _DEFAULT_RATING
        budget_fit = _budget_fit(candidate.get("price_level"), budget)
        open_now = candidate.get("open_now")
        closed_penalty = _CLOSED_PENALTY if open_now is False else 0.0

        past_visits = min(
            visit_counts_by_place.get(candidate["place_id"], 0), _MAX_PERSONALIZATION_VISITS
        )
        personalization = past_visits * _PERSONALIZATION_WEIGHT

        base = -(distance_minutes * 10.0)
        score = round(
            base + rating_bonus + budget_fit + personalization - closed_penalty, 2
        )

        scored.append(
            {
                **candidate,
                "distance_minutes": distance_minutes,
                "score": score,
                "reason": _reason(distance_minutes, rating, budget_fit >= 2.0),
            }
        )

    scored.sort(key=lambda c: c["score"], reverse=True)
    return scored
