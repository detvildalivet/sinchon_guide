import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.places import _matches_need_type, _short_category


def test_cafe_matches_cafe():
    assert _matches_need_type("음식점 > 카페,디저트 > 카페", "cafe") is True


def test_restaurant_does_not_match_cafe():
    assert _matches_need_type("음식점 > 한식 > 국밥", "cafe") is False


def test_missing_category_name_does_not_match():
    assert _matches_need_type(None, "cafe") is False


def test_bar_matches_drinks_but_not_meal():
    # Regression: Kakao groups bars under the same FD6 (음식점) code as
    # restaurants — there's no dedicated category_group_code for 술집, unlike
    # Google's old "bar" type. Only the keyword-narrowed category_name check
    # should accept it as `drinks`.
    bar_category = "음식점 > 술집 > 호프,요리주점"
    assert _matches_need_type(bar_category, "drinks") is True
    assert _matches_need_type(bar_category, "meal") is False


def test_cafe_category_does_not_match_meal():
    # Regression counterpart to the bar case: a cafe surfacing under a broad
    # FD6 "meal" search should still be rejected (mirrors the old
    # McDonald's-under-cafe check from the Google Places era).
    assert _matches_need_type("음식점 > 카페,디저트 > 카페", "meal") is False


def test_dessert_accepts_bakery_and_ice_cream_and_dessert_cafes():
    assert _matches_need_type("음식점 > 카페,디저트 > 베이커리", "dessert") is True
    assert _matches_need_type("음식점 > 카페,디저트 > 아이스크림", "dessert") is True
    assert _matches_need_type("음식점 > 카페,디저트 > 디저트카페", "dessert") is True


def test_dessert_rejects_unrelated_restaurant_category():
    assert _matches_need_type("음식점 > 한식 > 국밥", "dessert") is False


# ---------- _short_category ----------
# Kakao's category_name breadcrumb was already read for filtering but
# discarded before reaching the client; _short_category is the display-label
# extraction added so RecommendationOut can surface it.


def test_short_category_takes_last_breadcrumb_segment():
    assert _short_category("음식점 > 카페,디저트 > 카페") == "카페"


def test_short_category_strips_surrounding_whitespace():
    assert _short_category("음식점 > 한식 >  국밥 ") == "국밥"


def test_short_category_none_when_missing():
    assert _short_category(None) is None


def test_short_category_none_when_empty_string():
    assert _short_category("") is None
