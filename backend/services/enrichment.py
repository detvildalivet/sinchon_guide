"""Google Places API (New) enrichment.

Kakao Local (services/places.py) supplies place *breadth* but no rating or
open-now data — neither Kakao nor Naver expose that via public API. This
module fills those two fields in for the nearest candidates only, by
calling Google's Text Search endpoint once per candidate and matching the
result back to the Kakao place by proximity + name. Google is used here
strictly as an enrichment source, not for search breadth, routing, or map
tiles — those stay on Kakao/TMAP/Naver respectively (see CLAUDE.md).

Price level was also fetched here originally (feeding a budget-fit
tiebreaker in services/recommendation.py and a budget question in
AskScreen), but was removed after live testing showed Google's `priceLevel`
field is too sparse (about 1 in 12 Sinchon candidates ever had one) and the
tiebreaker's weight too small to meaningfully change results — asking users
for a budget that essentially never changed their recommendation wasn't
worth it. See CLAUDE.md's AskScreen bullet for the full story.

Enrichment is deliberately fail-soft per candidate: a network error, an
empty result, or an implausible match all just leave that candidate's
rating/open_now at None (their pre-enrichment default), the same as if
Google had never been called. Only a missing/misconfigured
GOOGLE_PLACES_API_KEY aborts the whole call (via require_google_key(),
mirroring require_kakao_key()/require_tmap_key()) — that's a config error,
not a per-place lookup miss.

The Google API key lives only here; it is never shipped to the client.
"""
import re
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from models import PlaceAnnotation
from services.api_errors import require_google_key
from services.recommendation import haversine_meters

TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"

# Deliberately excludes `places.reviews`/`places.editorialSummary` — adding
# either bumps this request from the Enterprise SKU to the pricier
# Enterprise + Atmosphere SKU, and this app doesn't display reviews. Note
# `rating`/opening-hours alone already trigger the Enterprise SKU (confirmed
# against Google's docs), so this mask isn't paying for a tier it doesn't need.
FIELD_MASK = (
    "places.id,places.displayName,places.location,places.rating,"
    "places.userRatingCount,"
    "places.currentOpeningHours.openNow,places.regularOpeningHours.openNow"
)

DEFAULT_TOP_N = 8
LOCATION_BIAS_RADIUS_METERS = 100.0
MATCH_RADIUS_METERS = 80.0  # a Google result farther than this from the Kakao coord is treated as a different place
ENRICH_TIMEOUT_SECONDS = 5.0  # short — a slow enrichment call must not stall the whole /recommendations request


def _normalize_name(name: str) -> str:
    return re.sub(r"\s+", "", name).strip().lower()


def _is_plausible_match(candidate: dict, google_place: dict) -> bool:
    """Guard against Text Search returning an unrelated place: require both
    a close coordinate AND a name that's a substring of the other's (handles
    Kakao/Google differing on branch suffixes like "신촌점"). Either check
    failing means "no match", not "close enough" — a false match would show
    a user real-looking but wrong rating/hours for a place they didn't pick.
    """
    location = google_place.get("location") or {}
    lat, lng = location.get("latitude"), location.get("longitude")
    if lat is None or lng is None:
        return False
    distance = haversine_meters(candidate["lat"], candidate["lng"], lat, lng)
    if distance > MATCH_RADIUS_METERS:
        return False

    google_name = google_place.get("displayName", {}).get("text", "")
    candidate_norm = _normalize_name(candidate["name"])
    google_norm = _normalize_name(google_name)
    if not candidate_norm or not google_norm:
        return False
    return candidate_norm in google_norm or google_norm in candidate_norm


def _parse_google_place(google_place: dict) -> dict:
    """Pure transform: a Text Search result place -> the fields this app
    surfaces. Any field Google didn't return stays None.

    `userRatingCount` was already in FIELD_MASK (free — no billing-tier
    change) but used to be parsed away; it's now kept as `rating_count` so
    RecommendationOut can show "4.3 (128)" instead of a bare number."""
    open_now = None
    current_hours = google_place.get("currentOpeningHours")
    if current_hours is not None:
        open_now = current_hours.get("openNow")
    if open_now is None:
        regular_hours = google_place.get("regularOpeningHours")
        if regular_hours is not None:
            open_now = regular_hours.get("openNow")

    return {
        "rating": google_place.get("rating"),
        "open_now": open_now,
        "rating_count": google_place.get("userRatingCount"),
    }


def _search_text_for_candidate(
    client: httpx.Client, api_key: str, candidate: dict
) -> Optional[dict]:
    """Call Text Search for one candidate. Returns the matched place dict,
    or None on no-result/network-error/implausible-match — never raises, so
    one bad lookup can't take down the whole enrichment pass."""
    headers = {
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": FIELD_MASK,
        "Content-Type": "application/json",
    }
    body = {
        "textQuery": candidate["name"],
        "locationBias": {
            "circle": {
                "center": {"latitude": candidate["lat"], "longitude": candidate["lng"]},
                "radius": LOCATION_BIAS_RADIUS_METERS,
            }
        },
        "maxResultCount": 1,
        "languageCode": "ko",
    }
    try:
        response = client.post(TEXT_SEARCH_URL, json=body, headers=headers)
    except httpx.RequestError:
        return None
    if not response.is_success:
        return None

    try:
        places = response.json().get("places", [])
    except ValueError:
        # A 2xx status with a non-JSON body (captive portal, proxy HTML error
        # page) — treat exactly like no-result, per this function's contract.
        return None
    if not places:
        return None

    google_place = places[0]
    if not _is_plausible_match(candidate, google_place):
        return None
    return google_place


def _persist_annotation(db: Session, candidate: dict) -> None:
    """Cache rating onto the candidate's existing PlaceAnnotation row
    (created by services.places.search_nearby). open_now is time-sensitive
    and intentionally not cached; price_level is no longer fetched at all
    (see module docstring) so it's left untouched here — it stays whatever
    services.places.search_nearby already set it to (always None). Never
    creates a row itself — only search_nearby owns row creation."""
    row: Optional[PlaceAnnotation] = (
        db.query(PlaceAnnotation)
        .filter(PlaceAnnotation.place_id == candidate["place_id"])
        .first()
    )
    if row is None:
        return
    row.rating = candidate["rating"]
    row.last_fetched = datetime.utcnow()


def enrich_candidates(
    db: Session, candidates: list[dict], top_n: int = DEFAULT_TOP_N
) -> None:
    """Enrich the top_n nearest candidates in place with rating/open_now via
    Google Text Search, run concurrently (one request per candidate — Text
    Search has no batch endpoint, and 8 sequential ~5s calls would make
    /recommendations unacceptably slow).

    `candidates` is expected to already be sorted nearest-first (Kakao's
    search_nearby returns it that way). Candidates beyond top_n, and any
    candidate with no plausible Google match, are left exactly as they were
    (rating/open_now stay None) — this degrades that one candidate back to
    closest-first-only ranking rather than failing the whole recommendation.
    Mutates `candidates` in place.
    """
    if not candidates:
        return

    api_key = require_google_key()
    to_enrich = candidates[:top_n]
    if not to_enrich:
        return

    with httpx.Client(timeout=ENRICH_TIMEOUT_SECONDS) as client:
        with ThreadPoolExecutor(max_workers=len(to_enrich)) as executor:
            future_to_candidate = {
                executor.submit(_search_text_for_candidate, client, api_key, candidate): candidate
                for candidate in to_enrich
            }
            for future, candidate in future_to_candidate.items():
                try:
                    google_place = future.result()
                except Exception:
                    # _search_text_for_candidate is documented never to raise,
                    # but a worker fault here must still degrade this one
                    # candidate to un-enriched rather than failing the whole
                    # /recommendations call.
                    continue
                if google_place is None:
                    continue
                parsed = _parse_google_place(google_place)
                candidate["rating"] = parsed["rating"]
                candidate["open_now"] = parsed["open_now"]
                candidate["rating_count"] = parsed["rating_count"]
                _persist_annotation(db, candidate)

    db.commit()
