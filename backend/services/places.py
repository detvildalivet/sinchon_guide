"""Kakao Local API integration.

This is the app's only source of place breadth — the server does not own a
place catalog. It queries Kakao's category/keyword search around the user's
location and caches a thin PlaceAnnotation row per result (see
models.PlaceAnnotation) so future personalization signals (curated tags,
visit history) have somewhere to live without mirroring all of Sinchon.

Was Google Places API (New) — moved to Kakao because Google's IP-restricted
key kept breaking on IP changes, and this session's research found no viable
Naver substitute: NCP's Maps product family has no place/POI search API at
all, and Naver's own Local Search API (a different Naver platform) is
keyword-only with no coordinate/radius filter and a 5-result cap. Kakao's
category+radius search is the structural analog to Google's searchNearby.

Trade-off: Kakao's response has no rating, price-level, or open-now field —
unlike Google Places, neither Kakao nor Naver expose that data via public
API. `services/recommendation.py`'s scorer already treats those fields as
Optional with neutral defaults, so this degrades ranking to closest-first +
visit-history rather than breaking anything; see CLAUDE.md for the full
reasoning and why AskScreen no longer asks for a budget.

The Kakao REST API key lives only here; it is never shipped to the client.
Read lazily (at call time, not import time) via api_errors.require_kakao_key()
so the app still boots and tests still run without KAKAO_REST_API_KEY set.
"""
from datetime import datetime
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from models import PlaceAnnotation
from services.api_errors import request_external_api, require_kakao_key

CATEGORY_SEARCH_URL = "https://dapi.kakao.com/v2/local/search/category.json"
KEYWORD_SEARCH_URL = "https://dapi.kakao.com/v2/local/search/keyword.json"

SEARCH_RADIUS_METERS = 1200
KAKAO_PAGE_SIZE = 15  # Kakao's per-page max (1-15); one page is plenty at this radius.

# Need.type -> how to query Kakao. Kakao's keyword endpoint requires a `query`
# string, so need types with no natural keyword (a plain "restaurant"/"cafe"
# browse) use the category-only endpoint instead; need types Kakao doesn't
# give a dedicated category_group_code (bars, dessert shops are subcategories
# of the FD6/CE7 groups, not their own codes) use the keyword endpoint to
# narrow within that group.
#
# category_name_must_include mirrors the old _matches_need_type Google
# primaryType check — same defensive purpose (Nearby Search's includedTypes
# matched a place's whole types list, not just its primary type, so a
# McDonald's could slip into "cafe" results; Kakao's broad FD6/CE7 groups
# have the same failure mode, e.g. a cafe surfacing under a "meal" search).
NEED_TYPE_CONFIG: dict[str, dict] = {
    "meal": {
        "category_group_code": "FD6",
        "keyword": None,
        "category_name_must_include": None,
        "category_name_must_exclude": ["카페", "술집"],
    },
    "cafe": {
        "category_group_code": "CE7",
        "keyword": None,
        "category_name_must_include": ["카페"],
        "category_name_must_exclude": None,
    },
    "drinks": {
        "category_group_code": "FD6",
        "keyword": "술집",
        "category_name_must_include": ["술집"],
        "category_name_must_exclude": None,
    },
    "dessert": {
        "category_group_code": "CE7",
        "keyword": "디저트",
        "category_name_must_include": ["카페", "디저트", "베이커리", "아이스크림"],
        "category_name_must_exclude": None,
    },
}


def _matches_need_type(category_name: Optional[str], need_type: str) -> bool:
    """Post-filter Kakao's `category_name` (a '대분류 > 중분류 > ...' breadcrumb
    string) against the need type's expected subcategory, the same way the
    old Google-era check re-verified primaryType instead of trusting the
    request filter alone.
    """
    if category_name is None:
        return False
    config = NEED_TYPE_CONFIG[need_type]

    must_exclude = config["category_name_must_exclude"]
    if must_exclude and any(term in category_name for term in must_exclude):
        return False

    must_include = config["category_name_must_include"]
    if must_include and not any(term in category_name for term in must_include):
        return False

    return True


def _short_category(category_name: Optional[str]) -> Optional[str]:
    """Last segment of Kakao's '대분류 > 중분류 > 소분류' breadcrumb, for display
    (e.g. "음식점 > 카페,디저트 > 카페" -> "카페"). None if Kakao gave nothing."""
    if not category_name:
        return None
    last = category_name.split(">")[-1].strip()
    return last or None


def search_nearby(db: Session, lat: float, lng: float, need_type: str) -> list[dict]:
    """Query Kakao Local for candidates around (lat, lng).

    Budget is intentionally NOT sent as a request filter — Kakao has no
    price-level concept at all (see module docstring). `price_level` is
    always None on returned candidates; the scorer treats that as neutral.

    Returns a list of plain dicts: {place_id, name, lat, lng, rating,
    price_level, open_now, category, address} — rating/price_level/open_now
    are always None (Kakao doesn't provide them), kept in the shape for
    schema/scorer compatibility. category/address are real values straight
    from Kakao's response (see _short_category), surfaced to the client via
    RecommendationOut instead of being discarded as before.
    """
    config = NEED_TYPE_CONFIG[need_type]
    url = KEYWORD_SEARCH_URL if config["keyword"] else CATEGORY_SEARCH_URL

    params = {
        "category_group_code": config["category_group_code"],
        "x": lng,
        "y": lat,
        "radius": SEARCH_RADIUS_METERS,
        "size": KAKAO_PAGE_SIZE,
        "sort": "distance",
    }
    if config["keyword"]:
        params["query"] = config["keyword"]

    headers = {"Authorization": f"KakaoAK {require_kakao_key()}"}

    with httpx.Client(timeout=10.0) as client:
        response = request_external_api(
            client, "GET", url, "Kakao Local API", params=params, headers=headers
        )
        data = response.json()

    candidates: list[dict] = []
    for place in data.get("documents", []):
        category_name = place.get("category_name")
        if not _matches_need_type(category_name, need_type):
            continue
        candidate = {
            "place_id": place["id"],
            "name": place.get("place_name", "이름 없음"),
            "lat": float(place["y"]),
            "lng": float(place["x"]),
            "rating": None,
            "price_level": None,
            "open_now": None,
            # Kakao's category_name is a '대분류 > 중분류 > 소분류' breadcrumb
            # (e.g. "음식점 > 카페,디저트 > 카페") — the last segment is the
            # closest thing to a user-facing category label. Kept only for
            # display; _matches_need_type above already used the full string.
            "category": _short_category(category_name),
            "address": place.get("road_address_name") or place.get("address_name") or None,
        }
        candidates.append(candidate)
        _upsert_annotation(db, candidate)

    db.commit()
    return candidates


def _upsert_annotation(db: Session, candidate: dict) -> None:
    """Upsert the place's identity/location fields only. `rating` is owned by
    services.enrichment._persist_annotation (Google is the only source for
    it) — writing candidate["rating"] here, which is always None at this
    point in the pipeline (see search_nearby's docstring), would blank out
    whatever enrichment wrote on every subsequent search. `price_level` is
    never fetched by anything anymore (see module docstring), so it's left
    untouched rather than written as None."""
    row: Optional[PlaceAnnotation] = (
        db.query(PlaceAnnotation)
        .filter(PlaceAnnotation.place_id == candidate["place_id"])
        .first()
    )
    if row is None:
        row = PlaceAnnotation(place_id=candidate["place_id"], curated_tags=[])
        db.add(row)

    row.name = candidate["name"]
    row.lat = candidate["lat"]
    row.lng = candidate["lng"]
    row.last_fetched = datetime.utcnow()
