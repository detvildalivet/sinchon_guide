"""Free-text -> place-category classification via Gemini.

This is the "ask what the user needs" -> "categorize the answer" step of the
app's pipeline. AskScreen has no buttons at all — it's a pure LLM inquiry
slot: the user describes where they want to go in their own words, and this
module turns that into a category `services/places.py` can search Kakao
with. Two kinds of category come out of it:

- One of 4 curated types (meal/cafe/drinks/dessert) — these get Kakao's
  dedicated FD6/CE7 category-code search plus a defensive category-name
  filter (see services/places.py's NEED_TYPE_CONFIG), which is materially
  more accurate than a bare keyword search.
- An open Korean place-type keyword Gemini extracts for anything else (e.g.
  "당구장", "헬스장", "노래방") — routed to a plain Kakao keyword search with
  no category restriction, since there's no fixed target category to filter
  against.

A single forced function call to Gemini's Flash-Lite tier — the cheapest
current Gemini tier, free to use at this volume via Google AI Studio, and
more than enough for this — decides which of the two applies and does the
extraction in one round trip. (This used to be Claude Haiku 4.5; switched to
Gemini so classification costs nothing to run.)

Model is pinned to the `-latest` alias (`gemini-flash-lite-latest`), not a
dated snapshot like `gemini-2.5-flash-lite` — that snapshot string is still
listed by client.models.list() but returns a 404 ("no longer available to
new users") for accounts created after its cutoff, which is exactly the
kind of breakage the `-latest` alias exists to dodge.

Deliberately fail-soft on anything except a missing/misconfigured API key:
text that isn't really about finding a place, a network error, or any
other API failure all return None rather than raising, so
routers/classify.py never 500s. Since there's no button fallback, None
means AskScreen shows an inline retry prompt on the same text field. Only
require_gemini_key() aborts (a config error, not a per-request miss) —
same split as services/enrichment.py's require_google_key() (a different
Google product — Places API (New) — from this module's Gemini API).

The Gemini API key lives only here; it is never shipped to the client.
"""
from typing import Optional

from google import genai
from google.genai import types

from services.api_errors import require_gemini_key

MODEL = "gemini-flash-lite-latest"

SYSTEM_PROMPT = """\
사용자가 신촌 지역에서 어떤 곳을 찾고 있는지 분류하십시오.

다음 네 가지 중 하나에 명확히 해당하면 type을 그 값으로 설정하십시오:
- meal: 식사, 밥, 배고픔 관련
- cafe: 카페, 커피, 공부/작업 공간 관련
- drinks: 술 한잔, 술집, 안주 관련
- dessert: 디저트, 빵, 아이스크림, 단 것 관련

네 가지 중 어느 것에도 해당하지 않으면 type을 other로 설정하고, keyword에
사용자가 찾는 장소 종류를 나타내는 짧은 한국어 명사를 넣으십시오 (예:
"당구장", "헬스장", "노래방", "편의점"). 문장 전체가 아니라 지역 장소
검색에 바로 쓸 수 있는 짧은 명사여야 합니다.

사용자의 글이 장소를 찾는 요청인지조차 확실하지 않으면 type을 other로
설정하고 keyword는 비워두십시오."""

CLASSIFY_TOOL = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="classify_need",
            description="사용자의 요청을 장소 카테고리로 분류합니다.",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "enum": ["meal", "cafe", "drinks", "dessert", "other"],
                    },
                    "keyword": {
                        "type": "string",
                        "description": (
                            "type이 other일 때만 사용. 지역 장소 검색에 쓸 짧은 "
                            "한국어 명사 (예: '당구장'). 무엇을 찾는지 확실하지 "
                            "않으면 비워두십시오."
                        ),
                    },
                },
                "required": ["type"],
            },
        )
    ]
)

CURATED_TYPES = ("meal", "cafe", "drinks", "dessert")


def classify_need_type(text: str) -> Optional[str]:
    """Classify free-text Korean input into a place category.

    Returns one of the 4 curated type identifiers, an open Korean keyword
    Gemini extracted, or None. None — not an exception — covers anything
    short of a missing API key: text Gemini couldn't tell was a place
    request, a network error, a malformed response, or any other Gemini
    API failure. All of those mean AskScreen shows a retry prompt rather
    than /classify failing outright.
    """
    api_key = require_gemini_key()
    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=MODEL,
            contents=text,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                tools=[CLASSIFY_TOOL],
                tool_config=types.ToolConfig(
                    function_calling_config=types.FunctionCallingConfig(
                        mode="ANY",
                        allowed_function_names=["classify_need"],
                    )
                ),
            ),
        )
        for call in response.function_calls or []:
            args = dict(call.args or {})
            value = args.get("type")
            if value in CURATED_TYPES:
                return value
            if value == "other":
                keyword = (args.get("keyword") or "").strip()
                return keyword or None
            return None
        return None
    except Exception:
        return None
