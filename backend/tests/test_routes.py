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
