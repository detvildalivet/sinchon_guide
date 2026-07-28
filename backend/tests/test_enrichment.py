"""Tests for the Google Places enrichment pass.

Pure-function tests (match-plausibility, response parsing) need no network
or DB. enrich_candidates() itself is tested with the network call
monkeypatched and a minimal fake DB session, to verify it degrades
gracefully (leaves fields None) rather than raising.

(price_level was fetched/mapped here originally but was removed after live
testing showed it too sparse to matter — see services/enrichment.py's
module docstring.)
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import services.enrichment as enrichment
from services.enrichment import (
    _is_plausible_match,
    _parse_google_place,
    enrich_candidates,
)

USER_LAT, USER_LNG = 37.5596, 126.9368  # Sinchon station, roughly


def _candidate(place_id="p1", lat=USER_LAT, lng=USER_LNG, name="스타벅스 신촌점"):
    return {
        "place_id": place_id,
        "name": name,
        "lat": lat,
        "lng": lng,
        "rating": None,
        "price_level": None,
        "open_now": None,
    }


def _google_place(lat=USER_LAT, lng=USER_LNG, name="스타벅스 신촌점", **fields):
    place = {
        "id": "google-1",
        "displayName": {"text": name},
        "location": {"latitude": lat, "longitude": lng},
    }
    place.update(fields)
    return place


# ---------- _is_plausible_match ----------


def test_close_coordinate_and_matching_name_is_plausible():
    candidate = _candidate(name="스타벅스 신촌점")
    google_place = _google_place(lat=USER_LAT, lng=USER_LNG, name="스타벅스 신촌점")
    assert _is_plausible_match(candidate, google_place) is True


def test_name_with_branch_suffix_still_matches_via_substring():
    candidate = _candidate(name="스타벅스")
    google_place = _google_place(lat=USER_LAT, lng=USER_LNG, name="스타벅스 신촌점")
    assert _is_plausible_match(candidate, google_place) is True


def test_far_coordinate_is_not_plausible_even_with_matching_name():
    candidate = _candidate(lat=USER_LAT, lng=USER_LNG, name="스타벅스 신촌점")
    # ~0.01 degrees is roughly 1.1km away -- far outside MATCH_RADIUS_METERS.
    google_place = _google_place(lat=USER_LAT + 0.01, lng=USER_LNG, name="스타벅스 신촌점")
    assert _is_plausible_match(candidate, google_place) is False


def test_mismatched_name_is_not_plausible_even_when_close():
    candidate = _candidate(lat=USER_LAT, lng=USER_LNG, name="스타벅스 신촌점")
    google_place = _google_place(lat=USER_LAT, lng=USER_LNG, name="이디야커피")
    assert _is_plausible_match(candidate, google_place) is False


def test_missing_location_is_not_plausible():
    candidate = _candidate()
    google_place = {"displayName": {"text": candidate["name"]}}
    assert _is_plausible_match(candidate, google_place) is False


# ---------- _parse_google_place ----------


def test_parse_full_place_extracts_both_fields():
    google_place = _google_place(
        rating=4.3,
        currentOpeningHours={"openNow": True},
    )
    parsed = _parse_google_place(google_place)
    assert parsed == {"rating": 4.3, "open_now": True}


def test_parse_falls_back_to_regular_opening_hours_when_no_current_hours():
    google_place = _google_place(regularOpeningHours={"openNow": False})
    parsed = _parse_google_place(google_place)
    assert parsed["open_now"] is False


def test_parse_missing_fields_all_become_none():
    google_place = _google_place()
    parsed = _parse_google_place(google_place)
    assert parsed == {"rating": None, "open_now": None}


# ---------- enrich_candidates (network call monkeypatched) ----------


class _FakeQuery:
    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return None  # no cached PlaceAnnotation row -> _persist_annotation is a no-op


class _FakeSession:
    def query(self, *args, **kwargs):
        return _FakeQuery()

    def commit(self):
        pass


def test_enrich_candidates_fills_fields_on_match(monkeypatch):
    monkeypatch.setattr(enrichment, "require_google_key", lambda: "fake-key")
    matched_place = _google_place(rating=4.5, currentOpeningHours={"openNow": True})
    monkeypatch.setattr(
        enrichment, "_search_text_for_candidate", lambda client, key, candidate: matched_place
    )

    candidates = [_candidate(place_id="p1")]
    enrich_candidates(_FakeSession(), candidates)

    assert candidates[0]["rating"] == 4.5
    assert candidates[0]["open_now"] is True
    # price_level is no longer fetched at all -- enrichment must not touch it.
    assert candidates[0]["price_level"] is None


def test_enrich_candidates_leaves_fields_none_on_no_match(monkeypatch):
    monkeypatch.setattr(enrichment, "require_google_key", lambda: "fake-key")
    monkeypatch.setattr(
        enrichment, "_search_text_for_candidate", lambda client, key, candidate: None
    )

    candidates = [_candidate(place_id="p1")]
    enrich_candidates(_FakeSession(), candidates)

    assert candidates[0]["rating"] is None
    assert candidates[0]["price_level"] is None
    assert candidates[0]["open_now"] is None


def test_enrich_candidates_only_touches_top_n(monkeypatch):
    monkeypatch.setattr(enrichment, "require_google_key", lambda: "fake-key")
    matched_place = _google_place(rating=5.0)
    monkeypatch.setattr(
        enrichment, "_search_text_for_candidate", lambda client, key, candidate: matched_place
    )

    candidates = [_candidate(place_id=f"p{i}") for i in range(5)]
    enrich_candidates(_FakeSession(), candidates, top_n=2)

    assert candidates[0]["rating"] == 5.0
    assert candidates[1]["rating"] == 5.0
    assert candidates[2]["rating"] is None
    assert candidates[3]["rating"] is None
    assert candidates[4]["rating"] is None


def test_enrich_candidates_no_candidates_is_a_noop(monkeypatch):
    monkeypatch.setattr(enrichment, "require_google_key", lambda: "fake-key")
    enrich_candidates(_FakeSession(), [])  # must not raise
