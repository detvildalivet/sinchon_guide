"""Pure scoring/ranking of Places candidates against a user's Need.

No DB/network access — a plain function over plain data (candidate dicts +
visit counts), trivially testable (see tests/test_recommendation.py).

Ranking policy: CLOSEST-FIRST. Walking distance dominates the score; rating
and visit-history personalization only matter as near-tie breakers. A place
that's currently closed always ranks below one that's open.
"""
import math
from typing import Optional

WALK_METERS_PER_MINUTE = 80.0

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


def _reason(distance_minutes: int) -> str:
    """Rating/open-now/category are deliberately NOT folded into this prose
    string — the frontend renders them as their own always-visible pieces
    (RatingStars showing an explicit "평점 없음" when unrated, an
    OpenStatusBadge, a category/address line) via RecommendationOut's
    dedicated fields, rather than as a sentence where a missing value would
    just silently disappear from the text."""
    return f"도보 {distance_minutes}분"


def score_candidates(
    candidates: list[dict],
    user_lat: float,
    user_lng: float,
    visit_counts_by_place: Optional[dict[str, int]] = None,
) -> list[dict]:
    """Score and sort candidates descending. Each output dict adds
    distance_minutes, score, and reason to the input candidate fields.

    visit_counts_by_place is keyed by place_id (not need_type): a
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
        open_now = candidate.get("open_now")
        closed_penalty = _CLOSED_PENALTY if open_now is False else 0.0

        past_visits = min(
            visit_counts_by_place.get(candidate["place_id"], 0), _MAX_PERSONALIZATION_VISITS
        )
        personalization = past_visits * _PERSONALIZATION_WEIGHT

        base = -(distance_minutes * 10.0)
        score = round(base + rating_bonus + personalization - closed_penalty, 2)

        scored.append(
            {
                **candidate,
                "distance_minutes": distance_minutes,
                "score": score,
                "reason": _reason(distance_minutes),
            }
        )

    scored.sort(key=lambda c: c["score"], reverse=True)
    return scored
