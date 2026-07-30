"""Tests for the pure TMAP GeoJSON -> RouteOut transform (no network, no DB)."""
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from routers.routes import tmap_geojson_to_route

# Trimmed but representative shape of a real TMAP Pedestrian Route API response:
# a leading Point feature carrying totalDistance/totalTime, followed by
# LineString segments carrying the actual path as [lng, lat] pairs.
SAMPLE_GEOJSON = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [126.9368, 37.5596]},
            "properties": {
                "totalDistance": 320,
                "totalTime": 260,
                "pointIndex": 0,
                "description": "출발",
            },
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [126.9368, 37.5596],
                    [126.9370, 37.5598],
                ],
            },
            "properties": {"index": 0},
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [126.9370, 37.5598],
                    [126.9373, 37.5601],
                ],
            },
            "properties": {"index": 1},
        },
    ],
}


def test_extracts_coordinates_in_order_as_lat_lng():
    route = tmap_geojson_to_route(SAMPLE_GEOJSON)
    assert [(c.latitude, c.longitude) for c in route.coordinates] == [
        (37.5596, 126.9368),
        (37.5598, 126.9370),
        (37.5598, 126.9370),
        (37.5601, 126.9373),
    ]


def test_distance_and_minutes_come_from_point_feature_properties():
    route = tmap_geojson_to_route(SAMPLE_GEOJSON)
    assert route.distance_meters == 320
    assert route.distance_minutes == round(260 / 60)  # 4 -> rounds to 4


def test_empty_features_raises_404():
    with pytest.raises(HTTPException) as exc_info:
        tmap_geojson_to_route({"type": "FeatureCollection", "features": []})
    assert exc_info.value.status_code == 404


def test_features_with_no_linestring_raises_404():
    only_point = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [126.9368, 37.5596]},
                "properties": {"totalDistance": 0, "totalTime": 0},
            }
        ],
    }
    with pytest.raises(HTTPException) as exc_info:
        tmap_geojson_to_route(only_point)
    assert exc_info.value.status_code == 404


def test_non_dict_response_raises_502_instead_of_crashing():
    # A degenerate request (e.g. an origin/destination pair TMAP can't route,
    # like two points on opposite continents) can come back as valid JSON
    # that isn't a FeatureCollection dict at all. Before this guard, `.get()`
    # on a non-dict raised an unhandled AttributeError -> opaque HTTP 500.
    with pytest.raises(HTTPException) as exc_info:
        tmap_geojson_to_route(["unexpected", "list", "shape"])
    assert exc_info.value.status_code == 502


def test_three_element_position_does_not_crash():
    # A GeoJSON position may legally carry an elevation as a 3rd element.
    # Unpacking `for lng, lat in coordinates` used to raise
    # "too many values to unpack" on this -- indexing must handle it instead.
    geojson_with_elevation = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [126.9368, 37.5596]},
                "properties": {"totalDistance": 100, "totalTime": 60},
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [126.9368, 37.5596, 0.0],
                        [126.9370, 37.5598, 1.5],
                    ],
                },
                "properties": {"index": 0},
            },
        ],
    }
    route = tmap_geojson_to_route(geojson_with_elevation)
    assert [(c.latitude, c.longitude) for c in route.coordinates] == [
        (37.5596, 126.9368),
        (37.5598, 126.9370),
    ]


def test_malformed_feature_is_skipped_instead_of_crashing():
    # A feature that isn't a dict (or has non-dict geometry/properties) must
    # be skipped rather than raising AttributeError on `.get()`.
    malformed = {
        "type": "FeatureCollection",
        "features": [
            "not-a-feature-dict",
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[126.9368, 37.5596], [126.9370, 37.5598]],
                },
                "properties": {"totalDistance": 200, "totalTime": 120},
            },
        ],
    }
    route = tmap_geojson_to_route(malformed)
    assert route.distance_meters == 200
    assert len(route.coordinates) == 2
