"""Shared error surfacing for Google API calls (Places, Routes).

Without this, any Google-side rejection (bad/restricted key, billing not
enabled, quota exceeded, malformed request) bubbles up as an unhandled
exception and FastAPI turns it into an opaque "Internal Server Error" with
no detail — indistinguishable from every other kind of 500. This wraps such
failures into an HTTPException carrying Google's actual error message, so
the client (and its "앗, 문제가 생겼어요" error card) can show something
actionable instead of just "HTTP 500".
"""
import os

import httpx
from fastapi import HTTPException, status


def require_api_key() -> str:
    key = os.environ.get("GOOGLE_MAPS_SERVER_KEY")
    if not key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Server is not configured with GOOGLE_MAPS_SERVER_KEY — "
                "set it in the backend environment (see CLAUDE.md)."
            ),
        )
    return key


def request_google_api(
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
