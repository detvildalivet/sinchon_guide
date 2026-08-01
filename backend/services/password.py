"""Password policy for account signup.

Pure, no DB/network access — trivially testable (see tests/test_password.py).

Policy: 8-20 characters, and at least 2 of 3 character classes present
(letter / digit / symbol). "Letter" means any Unicode letter, not just ASCII,
so Korean passphrases pass; whitespace belongs to no class.

Single source of truth for the rule: schemas.py deliberately has no
pydantic-level length constraint (that would surface as a "Value error, ..."
422 leaking into the Korean UI). routers/users.py calls validate_password()
explicitly for a clean 400 instead.

frontend/src/utils/password.ts mirrors this rule by hand for the live
signup checklist.
"""
from typing import Optional

MIN_LENGTH = 8
MAX_LENGTH = 20

_LENGTH_ERROR = f"비밀번호는 {MIN_LENGTH}자 이상 {MAX_LENGTH}자 이하여야 합니다."
_VARIETY_ERROR = "비밀번호는 영문·숫자·기호 중 2종 이상을 포함해야 합니다."


def _classes(password: str) -> set:
    """Which of {"letter", "digit", "symbol"} appear in password.

    A character contributes to at most one class; whitespace contributes to
    none (see module docstring).
    """
    found = set()
    for ch in password:
        if ch.isalpha():
            found.add("letter")
        elif ch.isdigit():
            found.add("digit")
        elif not ch.isspace():
            found.add("symbol")
    return found


def validate_password(password: str) -> Optional[str]:
    """Return a Korean error message, or None if the password is acceptable."""
    if len(password) < MIN_LENGTH or len(password) > MAX_LENGTH:
        return _LENGTH_ERROR
    if len(_classes(password)) < 2:
        return _VARIETY_ERROR
    return None
