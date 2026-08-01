"""Shared error surfacing for external API calls (Kakao Local, TMAP routes,
Google Places enrichment, Gemini classification).

Without this, any upstream rejection (bad/restricted key, billing not
enabled, quota exceeded, malformed request) bubbles up as an unhandled
exception and FastAPI turns it into an opaque "Internal Server Error" with
no detail — indistinguishable from every other kind of 500. This wraps such
failures into an HTTPException carrying the provider's actual error message,
so the client (and its "앗, 문제가 생겼어요" error card) can show something
actionable instead of just "HTTP 500".
"""
import os

import httpx
from fastapi import HTTPException, status


def _require(env_var: str, hint: str) -> str:
    key = os.environ.get(env_var)
    if not key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Server is not configured with {env_var} — set it in the "
            f"backend environment (see CLAUDE.md). {hint}",
        )
    return key


def require_kakao_key() -> str:
    return _require(
        "KAKAO_REST_API_KEY",
        "Use the app's REST API key, not the JavaScript or Native App key.",
    )


def require_tmap_key() -> str:
    return _require(
        "TMAP_APP_KEY",
        "The app registered for this key must have the 보행자 경로안내 "
        "(Pedestrian) product subscribed, not just 대중교통 (Transit).",
    )


def require_google_key() -> str:
    return _require(
        "GOOGLE_PLACES_API_KEY",
        "The key must have Places API (New) enabled and must NOT be "
        "IP-restricted while the backend runs on a dynamic IP (an "
        "IP-restricted key is what broke the old Google integration — see "
        "CLAUDE.md's googleghost.png note).",
    )


def require_gemini_key() -> str:
    return _require(
        "GEMINI_API_KEY",
        "Get a free key from Google AI Studio (aistudio.google.com/apikey) "
        "— Flash/Flash-Lite models are free to use there. Used by "
        "services/classify.py to classify free-text need input.",
    )


def require_jwt_secret() -> str:
    # Unlike the provider keys above, this isn't a third-party API
    # credential — it's the HMAC key that signs every auth token this app
    # issues. No safe hardcoded fallback: a fallback known from the public
    # repo is equivalent to no signature at all, letting anyone forge a
    # token for any user_id.
    return _require(
        "SINCHON_JWT_SECRET",
        "Set it to a long, random value. This key signs every auth token; "
        "there is no safe default.",
    )


def request_external_api(
    client: httpx.Client, method: str, url: str, api_name: str, **kwargs
) -> httpx.Response:
    try:
        response = client.request(method, url, **kwargs)
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not reach {api_name}: {exc}",
        ) from exc

    if response.is_success:
        return response

    try:
        payload = response.json()
    except ValueError:
        payload = None

    # Provider error shapes differ: Google/TMAP nest under {"error": {...}},
    # Kakao returns {"errorType": ..., "message": ...} at the top level. A
    # valid-JSON-but-non-dict body (array, bare string/number) must fall back
    # to raw text rather than raising out of this error-formatting path.
    detail = response.text
    if isinstance(payload, dict):
        error = payload.get("error")
        if isinstance(error, dict) and isinstance(error.get("message"), str):
            detail = error["message"]
        elif isinstance(payload.get("message"), str):
            detail = payload["message"]
    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=f"{api_name} error ({response.status_code}): {detail}",
    )
