"""Kakao Local API integration — the app's only source of place breadth.

The Kakao REST API key lives only here; it is never shipped to the client.
Read lazily (at call time, not import time) via api_errors.require_kakao_key()
so the app still boots and tests still run without KAKAO_REST_API_KEY set.
"""
from typing import Callable, Optional

import httpx

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
# category_name_must_include/_exclude defensively re-verify Kakao's broad
# FD6/CE7 category groups: a McDonald's or cafe can otherwise slip into the
# wrong need type's results.
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
    string) against the need type's expected subcategory."""
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


def _query_kakao(
    url: str,
    params: dict,
    category_filter: Optional[Callable[[Optional[str]], bool]] = None,
) -> list[dict]:
    """Shared Kakao Local call + response-to-candidate-dict transform, used
    by both the curated category/keyword path and the open keyword path.

    rating/open_now are always None here — Kakao doesn't provide them;
    services/enrichment.py fills them in for the nearest few candidates.
    category/address come straight from Kakao's response (see
    _short_category). category_filter, when given, drops results that don't
    match a need type's expected subcategory (see _matches_need_type); the
    open keyword path passes none, trusting Kakao's own relevance ranking
    since there's no fixed category to check an arbitrary keyword against.
    """
    headers = {"Authorization": f"KakaoAK {require_kakao_key()}"}

    with httpx.Client(timeout=10.0) as client:
        response = request_external_api(
            client, "GET", url, "Kakao Local API", params=params, headers=headers
        )
        data = response.json()

    candidates: list[dict] = []
    for place in data.get("documents", []):
        category_name = place.get("category_name")
        if category_filter is not None and not category_filter(category_name):
            continue
        candidates.append(
            {
                "place_id": place["id"],
                "name": place.get("place_name", "이름 없음"),
                "lat": float(place["y"]),
                "lng": float(place["x"]),
                "rating": None,
                "open_now": None,
                "category": _short_category(category_name),
                "address": place.get("road_address_name") or place.get("address_name") or None,
            }
        )
    return candidates


def search_nearby(lat: float, lng: float, need_type: str) -> list[dict]:
    """Query Kakao Local for candidates around (lat, lng).

    need_type is an open string, not a closed enum (see schemas.NeedIn):
    one of the 4 curated types below gets Kakao's dedicated category-code
    search; anything else — an arbitrary Korean keyword services/classify.py
    extracted, e.g. "당구장" — is dispatched to _search_keyword instead, a
    plain Kakao keyword search with no category restriction.

    Returns candidates sorted nearest-first (Kakao's sort=distance).
    """
    if need_type not in NEED_TYPE_CONFIG:
        return _search_keyword(lat, lng, need_type)

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

    return _query_kakao(
        url, params, category_filter=lambda name: _matches_need_type(name, need_type)
    )


def _search_keyword(lat: float, lng: float, keyword: str) -> list[dict]:
    """Open-ended search for anything outside the 4 curated need types (see
    NEED_TYPE_CONFIG) — e.g. "당구장", "헬스장", extracted by
    services/classify.py from free text that didn't match one of the
    curated categories."""
    params = {
        "query": keyword,
        "x": lng,
        "y": lat,
        "radius": SEARCH_RADIUS_METERS,
        "size": KAKAO_PAGE_SIZE,
        "sort": "distance",
    }
    return _query_kakao(KEYWORD_SEARCH_URL, params)
