from services.places import _matches_need_type


def test_exact_primary_type_matches():
    assert _matches_need_type("cafe", "cafe") is True


def test_fast_food_does_not_match_cafe():
    # Regression: a McDonald's returned by Nearby Search(includedTypes=["cafe"])
    # because its `types` list carries a generic cafe-ish secondary type,
    # even though Google's own primaryType calls it something else.
    assert _matches_need_type("hamburger_restaurant", "cafe") is False


def test_missing_primary_type_does_not_match():
    assert _matches_need_type(None, "cafe") is False


def test_dessert_accepts_any_of_its_mapped_types():
    assert _matches_need_type("bakery", "dessert") is True
    assert _matches_need_type("ice_cream_shop", "dessert") is True
