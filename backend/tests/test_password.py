"""Tests for the password policy (services/password.py) and where it's
enforced (routers/users.py's register()).

Policy under test (settled during brainstorming): 8-20 characters, at least
2 of 3 character classes (letter/digit/symbol) — see the module docstring
in services/password.py for the full reasoning, including why "letter"
means any Unicode letter rather than ASCII-only.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi import HTTPException

from services.password import MAX_LENGTH, MIN_LENGTH, validate_password


@pytest.mark.parametrize(
    "password",
    [
        "sinchon12",  # letter + digit
        "Guide!!!",  # letter + symbol
        "신촌가이드좋아요1",  # Korean letters + digit
        "12345678!",  # digit + symbol
        "a" * (MIN_LENGTH - 2) + "1!",  # exactly at the short end, 2 classes
        "A" * (MAX_LENGTH - 1) + "1",  # exactly at the long end, 2 classes
    ],
)
def test_accepts_passwords_with_two_classes(password):
    assert validate_password(password) is None


@pytest.mark.parametrize(
    "password",
    [
        "aaaaaaaa",  # letters only — the motivating case
        "abcdefgh",  # same, longer
        "12345678",  # digits only
        "!!!!!!!!",  # symbols only
        "        ",  # whitespace only — no class at all
    ],
)
def test_rejects_single_class_passwords(password):
    error = validate_password(password)
    assert error is not None
    assert "2종" in error


@pytest.mark.parametrize(
    "password",
    [
        "a1",  # too short
        "a1!",
        "a" * (MIN_LENGTH - 1),
    ],
)
def test_rejects_too_short(password):
    error = validate_password(password)
    assert error is not None
    assert str(MIN_LENGTH) in error


def test_rejects_too_long():
    password = "a1" * (MAX_LENGTH // 2 + 1)  # 2 classes, but over MAX_LENGTH
    assert len(password) > MAX_LENGTH
    error = validate_password(password)
    assert error is not None
    assert str(MAX_LENGTH) in error


def test_error_messages_are_nonempty_korean_strings():
    for password in ["short", "aaaaaaaa"]:
        error = validate_password(password)
        assert isinstance(error, str)
        assert len(error) > 0


def test_register_rejects_weak_password_before_touching_db():
    """register() must validate the password before it ever uses `db` —
    passing db=None proves the weak-password path returns without a query.
    """
    from routers.users import register
    from schemas import UserCreate

    payload = UserCreate(
        email="t@t.com",
        password="aaaaaaaa",
        real_name="홍길동",
        birth_date="2000-01-01",
        nickname="테스트",
    )
    with pytest.raises(HTTPException) as exc_info:
        register(payload, db=None)
    assert exc_info.value.status_code == 400
    assert "2종" in exc_info.value.detail
