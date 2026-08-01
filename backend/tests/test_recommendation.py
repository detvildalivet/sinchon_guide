"""Tests for the pure recommendation scorer (no DB, no network).

Ranking policy under test (settled during brainstorming): closest-first,
with rating / visit-history as near-tie breakers, and an open-now place
always outranking a closed one regardless of distance. (Budget-fit was
tried as a third tiebreaker and removed — see the module docstring in
services/recommendation.py for why.)
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.recommendation import haversine_meters, score_candidates

USER_LAT, USER_LNG = 37.5596, 126.9368  # Sinchon station, roughly


def _place(place_id, lat, lng, rating=4.0, open_now=True):
    return {
        "place_id": place_id,
        "name": place_id,
        "lat": lat,
        "lng": lng,
        "rating": rating,
        "open_now": open_now,
    }


def test_closest_first_dominates_ranking():
    near = _place("near", USER_LAT + 0.001, USER_LNG, rating=3.0)  # ~110m
    far = _place("far", USER_LAT + 0.02, USER_LNG, rating=5.0)  # ~2.2km, higher rating
    ranked = score_candidates([far, near], USER_LAT, USER_LNG)
    assert [c["place_id"] for c in ranked] == ["near", "far"]


def test_open_now_always_beats_closed_regardless_of_distance():
    closer_but_closed = _place(
        "closed", USER_LAT + 0.0005, USER_LNG, rating=5.0, open_now=False
    )
    farther_but_open = _place(
        "open", USER_LAT + 0.01, USER_LNG, rating=3.0, open_now=True
    )
    ranked = score_candidates(
        [closer_but_closed, farther_but_open], USER_LAT, USER_LNG
    )
    assert ranked[0]["place_id"] == "open"


def test_visit_history_breaks_near_ties_but_not_distance():
    # Same distance, same rating -> the place visited before should edge ahead.
    visited = _place("visited", USER_LAT + 0.001, USER_LNG)
    not_visited = _place("not_visited", USER_LAT + 0.001, USER_LNG)
    ranked = score_candidates(
        [not_visited, visited],
        USER_LAT,
        USER_LNG,
        visit_counts_by_place={"visited": 3},
    )
    assert ranked[0]["place_id"] == "visited"

    # But a big distance gap still overrides personalization -- it's a subtle
    # tiebreaker, not a dominant factor.
    far_but_visited = _place("far_visited", USER_LAT + 0.02, USER_LNG)
    near_not_visited = _place("near_not_visited", USER_LAT + 0.001, USER_LNG)
    ranked2 = score_candidates(
        [far_but_visited, near_not_visited],
        USER_LAT,
        USER_LNG,
        visit_counts_by_place={"far_visited": 4},
    )
    assert ranked2[0]["place_id"] == "near_not_visited"


def test_missing_rating_uses_neutral_default_not_a_penalty():
    no_rating = _place("no_rating", USER_LAT, USER_LNG, rating=None)
    low_rating = _place("low_rating", USER_LAT, USER_LNG, rating=1.0)
    ranked = score_candidates([low_rating, no_rating], USER_LAT, USER_LNG)
    assert ranked[0]["place_id"] == "no_rating"


def test_haversine_meters_known_distance():
    # ~0.01 degrees latitude is roughly 1.11km.
    distance = haversine_meters(37.0, 127.0, 37.01, 127.0)
    assert 1080 < distance < 1140
