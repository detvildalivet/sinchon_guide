"""Shared error surfacing for external API calls (Kakao Local, TMAP routes,
Google Places enrichment).

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


def require_kakao_key() -> str:
    key = os.environ.get("KAKAO_REST_API_KEY")
    if not key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Server is not configured with KAKAO_REST_API_KEY — "
                "set it in the backend environment (see CLAUDE.md). Use the "
                "app's REST API key, not the JavaScript or Native App key."
            ),
        )
    return key


def require_tmap_key() -> str:
    key = os.environ.get("TMAP_APP_KEY")
    if not key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Server is not configured with TMAP_APP_KEY — "
                "set it in the backend environment (see CLAUDE.md). "
                "The app registered for this key must have the 보행자 "
                "경로안내 (Pedestrian) product subscribed, not just 대중교통 "
                "(Transit)."
            ),
        )
    return key


def require_google_key() -> str:
    key = os.environ.get("GOOGLE_PLACES_API_KEY")
    if not key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Server is not configured with GOOGLE_PLACES_API_KEY — "
                "set it in the backend environment (see CLAUDE.md). The key "
                "must have Places API (New) enabled and must NOT be "
                "IP-restricted while the backend runs on a dynamic IP "
                "(an IP-restricted key is what broke the old Google "
                "integration — see CLAUDE.md's googleghost.png note)."
            ),
        )
    return key


def require_jwt_secret() -> str:
    # Unlike the three provider keys above, this isn't a third-party API
    # credential — it's the HMAC key that signs every auth token this app
    # issues. It has no safe hardcoded fallback: a fallback known from the
    # public repo is equivalent to no signature at all, letting anyone forge
    # a token for any user_id. Read lazily (at call time, not import time)
    # so the app still boots and pytest still runs without it set, matching
    # the require_kakao_key/require_tmap_key/require_google_key pattern.
    key = os.environ.get("SINCHON_JWT_SECRET")
    if not key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Server is not configured with SINCHON_JWT_SECRET — set it "
                "in the backend environment (see CLAUDE.md) to a long, "
                "random value. This key signs every auth token; there is no "
                "safe default."
            ),
        )
    return key


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
        detail = response.json().get("error", {}).get("message", response.text)
    except ValueError:
        detail = response.text
    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=f"{api_name} error ({response.status_code}): {detail}",
    )
