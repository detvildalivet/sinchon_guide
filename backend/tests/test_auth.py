"""Tests for auth.py's JWT round-trip and the require_jwt_secret guard it
depends on.

This suite didn't exist before: auth.py previously fell back to a hardcoded
SECRET_KEY ("dev-secret-change-me") when SINCHON_JWT_SECRET was unset — a
value public in this repo, so anyone could forge a token for any user_id.
The fix removes the fallback and routes signing/verification through
services.api_errors.require_jwt_secret(), matching the existing
require_kakao_key/require_tmap_key/require_google_key pattern (lazy,
call-time, clean 500 if unset). These tests monkeypatch require_jwt_secret
the same way test_enrichment.py monkeypatches require_google_key, so no real
env var needs to be set for the suite to run.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi import HTTPException

import auth
from services import api_errors


def test_require_jwt_secret_raises_when_unset(monkeypatch):
    monkeypatch.delenv("SINCHON_JWT_SECRET", raising=False)
    with pytest.raises(HTTPException) as exc_info:
        api_errors.require_jwt_secret()
    assert exc_info.value.status_code == 500


def test_require_jwt_secret_returns_the_env_value(monkeypatch):
    monkeypatch.setenv("SINCHON_JWT_SECRET", "a-real-secret")
    assert api_errors.require_jwt_secret() == "a-real-secret"


def test_create_and_decode_round_trip(monkeypatch):
    monkeypatch.setattr(auth, "require_jwt_secret", lambda: "fake-secret")
    token = auth.create_access_token(user_id=42)

    # get_user_from_token needs a DB lookup for the happy path; decode the
    # token directly here to isolate what create_access_token actually
    # produced, without standing up a database.
    from jose import jwt

    payload = jwt.decode(token, "fake-secret", algorithms=[auth.ALGORITHM])
    assert payload["sub"] == "42"


def test_decode_fails_with_wrong_secret(monkeypatch):
    monkeypatch.setattr(auth, "require_jwt_secret", lambda: "secret-a")
    token = auth.create_access_token(user_id=1)

    monkeypatch.setattr(auth, "require_jwt_secret", lambda: "secret-b")
    assert auth.get_user_from_token(token, db=None) is None


def test_get_user_from_token_none_for_garbage_token(monkeypatch):
    monkeypatch.setattr(auth, "require_jwt_secret", lambda: "fake-secret")
    assert auth.get_user_from_token("not-a-real-token", db=None) is None
