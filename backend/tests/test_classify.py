"""Tests for services/classify.py's free-text -> place-category classification.

Monkeypatches genai.Client (module-level, same pattern as
test_enrichment.py monkeypatching require_google_key) so no real API key or
network call is needed. Covers the fail-soft contract: only a missing
GEMINI_API_KEY (require_gemini_key raising) propagates as an
HTTPException; every other failure mode -- an empty/unparseable "other"
classification, a malformed response, or an exception from the client
itself -- returns None so routers/classify.py never 500s (and AskScreen
shows a retry prompt instead of a button fallback, since there isn't one).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi import HTTPException

import services.classify as classify


class _FakeFunctionCall:
    def __init__(self, args):
        self.args = args


class _FakeResponse:
    def __init__(self, function_calls):
        self.function_calls = function_calls


class _FakeModels:
    def __init__(self, response=None, exc=None):
        self._response = response
        self._exc = exc

    def generate_content(self, **kwargs):
        if self._exc is not None:
            raise self._exc
        return self._response


class _FakeClient:
    def __init__(self, response=None, exc=None):
        self.models = _FakeModels(response=response, exc=exc)


def _monkeypatch_gemini(monkeypatch, response=None, exc=None):
    monkeypatch.setattr(classify, "require_gemini_key", lambda: "fake-key")
    monkeypatch.setattr(
        classify.genai, "Client", lambda api_key: _FakeClient(response=response, exc=exc)
    )


@pytest.mark.parametrize("need_type", ["meal", "cafe", "drinks", "dessert"])
def test_classifies_each_need_type(monkeypatch, need_type):
    response = _FakeResponse([_FakeFunctionCall({"type": need_type})])
    _monkeypatch_gemini(monkeypatch, response=response)

    assert classify.classify_need_type("아무 텍스트") == need_type


def test_other_with_keyword_returns_the_keyword(monkeypatch):
    # The open path: type="other" plus an extracted Korean place-type noun
    # (e.g. "당구장") for anything outside the 4 curated categories.
    response = _FakeResponse([_FakeFunctionCall({"type": "other", "keyword": "당구장"})])
    _monkeypatch_gemini(monkeypatch, response=response)

    assert classify.classify_need_type("당구장 가고싶어") == "당구장"


def test_other_with_whitespace_keyword_maps_to_none(monkeypatch):
    response = _FakeResponse([_FakeFunctionCall({"type": "other", "keyword": "   "})])
    _monkeypatch_gemini(monkeypatch, response=response)

    assert classify.classify_need_type("텍스트") is None


def test_other_with_no_keyword_maps_to_none(monkeypatch):
    # Gemini's signal for "not confidently a place request at all" -- no
    # separate "unknown" enum member, folded into other + empty keyword.
    response = _FakeResponse([_FakeFunctionCall({"type": "other"})])
    _monkeypatch_gemini(monkeypatch, response=response)

    assert classify.classify_need_type("의미 없는 텍스트") is None


def test_unrecognized_type_value_maps_to_none(monkeypatch):
    # Defensive: a value outside the enum entirely (shouldn't happen with a
    # forced function schema, but the parser must still degrade cleanly).
    response = _FakeResponse([_FakeFunctionCall({"type": "bogus"})])
    _monkeypatch_gemini(monkeypatch, response=response)

    assert classify.classify_need_type("텍스트") is None


def test_missing_function_call_maps_to_none(monkeypatch):
    # Should never happen with tool_config forcing the call, but the parser
    # must degrade to None rather than raising if it somehow does.
    response = _FakeResponse([])
    _monkeypatch_gemini(monkeypatch, response=response)

    assert classify.classify_need_type("아무 텍스트") is None


def test_client_exception_maps_to_none(monkeypatch):
    _monkeypatch_gemini(monkeypatch, exc=RuntimeError("network down"))

    assert classify.classify_need_type("아무 텍스트") is None


def test_missing_api_key_raises(monkeypatch):
    def _raise():
        raise HTTPException(status_code=500, detail="no key")

    monkeypatch.setattr(classify, "require_gemini_key", _raise)

    with pytest.raises(HTTPException) as exc_info:
        classify.classify_need_type("아무 텍스트")
    assert exc_info.value.status_code == 500
