"""Password policy for account signup.

Pure, no DB/network access — a plain function over a plain string, the same
shape as services/recommendation.py, which keeps it trivially testable (see
tests/test_password.py) independent of FastAPI/pydantic.

Policy (settled during brainstorming): 8-64 characters, and at least 2 of 3
character classes present (letter / digit / symbol). "Letter" means any
Unicode letter (str.isalpha()), not just ASCII a-z/A-Z, so a Korean
passphrase like "신촌가이드좋아요1" counts as letter+digit and passes —
restricting to ASCII would wrongly reject legitimate Korean passwords.
Whitespace belongs to none of the three classes, so a string of only spaces
has zero classes and is rejected by the variety check alone; no separate
whitespace rule is needed.

This is the single source of truth for the rule: schemas.py deliberately
does NOT also declare a pydantic Field(min_length=...) constraint, since a
pydantic-level rejection surfaces as a 422 whose detail[0].msg is prefixed
"Value error, ..." (see api/client.ts's parseError), which would leak into
the Korean UI. routers/users.py calls validate_password() explicitly and
raises a clean 400 with the Korean message as-is.

frontend/src/utils/password.ts mirrors this rule for the live signup
checklist; the two are kept in sync by hand, not by a shared test source
(the example tables are duplicated, one per side).
"""
from typing import Optional

MIN_LENGTH = 8
MAX_LENGTH = 64

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
