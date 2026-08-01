"""Tests for services/api_errors.request_external_api -- the shared error
path for all three external providers (Kakao, Google, TMAP). This was
previously untested, which is how it shipped with a crash of its own: a
valid-JSON-but-non-dict error body raised AttributeError instead of being
turned into a clean 502 (see backend/services/api_errors.py).

A minimal fake httpx.Response stands in for the real thing -- only
`is_success`, `status_code`, `.json()` and `.text` are ever touched by
request_external_api.
"""
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.api_errors import request_external_api


class _FakeResponse:
    def __init__(self, status_code, json_value=None, json_raises=False, text=""):
        self.status_code = status_code
        self.is_success = 200 <= status_code < 300
        self._json_value = json_value
        self._json_raises = json_raises
        self.text = text

    def json(self):
        if self._json_raises:
            raise ValueError("not valid json")
        return self._json_value


class _FakeClient:
    def __init__(self, response):
        self._response = response

    def request(self, method, url, **kwargs):
        return self._response


def _call(response):
    with pytest.raises(HTTPException) as exc_info:
        request_external_api(_FakeClient(response), "GET", "https://example.test", "Test API")
    return exc_info.value


def test_success_response_is_returned_unchanged():
    response = _FakeResponse(200, json_value={"ok": True})
    result = request_external_api(_FakeClient(response), "GET", "https://example.test", "Test API")
    assert result is response


def test_google_or_tmap_shaped_error_extracts_nested_message():
    response = _FakeResponse(
        502, json_value={"error": {"code": 502, "message": "quota exceeded"}}
    )
    exc = _call(response)
    assert exc.status_code == 502
    assert "quota exceeded" in exc.detail


def test_kakao_shaped_error_extracts_top_level_message():
    # Kakao's error body has no "error" wrapper -- {"errorType": ..., "message": ...}.
    response = _FakeResponse(
        401, json_value={"errorType": "AccessDeniedError", "message": "invalid api key"}
    )
    exc = _call(response)
    assert exc.status_code == 502
    assert "invalid api key" in exc.detail


def test_json_array_error_body_falls_back_to_raw_text_instead_of_crashing():
    # A valid-JSON-but-non-dict body (e.g. a bare array) used to raise
    # AttributeError from `.get()` on a list -- the error-formatting helper
    # crashed inside an error path. Must fall back to response.text instead.
    response = _FakeResponse(500, json_value=["unexpected", "array"], text="raw array body")
    exc = _call(response)
    assert exc.status_code == 502
    assert "raw array body" in exc.detail


def test_non_json_error_body_falls_back_to_raw_text():
    response = _FakeResponse(503, json_raises=True, text="<html>Service Unavailable</html>")
    exc = _call(response)
    assert exc.status_code == 502
    assert "Service Unavailable" in exc.detail


def test_dict_without_error_or_message_key_falls_back_to_raw_text():
    response = _FakeResponse(500, json_value={"unrelated": "shape"}, text="raw body")
    exc = _call(response)
    assert exc.status_code == 502
    assert "raw body" in exc.detail
