"""Shared error surfacing for external API calls (Kakao Local, TMAP routes).

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
