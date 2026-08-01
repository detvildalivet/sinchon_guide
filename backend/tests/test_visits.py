"""Tests for GET /visits (routers.visits.list_visits).

Unlike the rest of this suite, this needs a real (if tiny) DB session to
exercise the actual order_by/filter query rather than mocking SQLAlchemy's
query-builder chain, which wouldn't prove anything about the real ordering
logic. Kept fully self-contained: an in-memory SQLite engine created here,
not the app's own sinchon_guide.db, so this still needs no network and
leaves no file behind.
"""
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker

from database import Base
from models import HistoryClear, User, Visit
from routers.visits import clear_visits, list_visits


def _make_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def _make_user(db, email="a@test.com", nickname="tester"):
    user = User(
        email=email,
        password_hash="x",
        real_name="Test User",
        birth_date=datetime(2000, 1, 1).date(),
        nickname=nickname,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_list_visits_returns_newest_first():
    db = _make_session()
    user = _make_user(db)

    older = Visit(
        user_id=user.id,
        place_id="p1",
        place_name="오래된 카페",
        type="cafe",
        created_at=datetime.utcnow() - timedelta(days=1),
    )
    newer = Visit(
        user_id=user.id,
        place_id="p2",
        place_name="최근 식당",
        type="meal",
        created_at=datetime.utcnow(),
    )
    db.add_all([older, newer])
    db.commit()

    result = list_visits(db=db, user=user)

    assert [row.place_id for row in result] == ["p2", "p1"]


def test_list_visits_only_returns_current_users_rows():
    db = _make_session()
    user = _make_user(db, email="a@test.com", nickname="a")
    other = _make_user(db, email="b@test.com", nickname="b")

    db.add(Visit(user_id=user.id, place_id="mine", place_name="내 장소", type="cafe"))
    db.add(Visit(user_id=other.id, place_id="theirs", place_name="남의 장소", type="cafe"))
    db.commit()

    result = list_visits(db=db, user=user)

    assert [row.place_id for row in result] == ["mine"]


def test_list_visits_empty_when_no_history():
    db = _make_session()
    user = _make_user(db)

    result = list_visits(db=db, user=user)

    assert result == []


# ---------- clear_visits ----------
# "Clear history" must only hide rows from list_visits — it must never
# delete/modify a Visit row, since the recommendation scorer's
# personalization signal (a plain count-by-place-id query over Visit,
# mirroring routers.recommendations.recommend()) has to keep counting every
# visit forever, cleared or not.


def test_clear_visits_hides_prior_rows_from_list_visits():
    db = _make_session()
    user = _make_user(db)
    db.add(Visit(user_id=user.id, place_id="p1", place_name="이전 방문", type="cafe"))
    db.commit()

    clear_visits(db=db, user=user)
    result = list_visits(db=db, user=user)

    assert result == []


def test_clear_visits_does_not_delete_or_modify_visit_rows():
    db = _make_session()
    user = _make_user(db)
    db.add(Visit(user_id=user.id, place_id="p1", place_name="이전 방문", type="cafe"))
    db.commit()

    clear_visits(db=db, user=user)

    # The row is hidden from list_visits (proven above) but must still exist
    # untouched in the visits table itself.
    all_visits = db.query(Visit).filter(Visit.user_id == user.id).all()
    assert [v.place_id for v in all_visits] == ["p1"]


def test_visit_made_after_clear_is_visible_again():
    db = _make_session()
    user = _make_user(db)
    db.add(Visit(user_id=user.id, place_id="old", place_name="예전 장소", type="cafe"))
    db.commit()

    clear_visits(db=db, user=user)

    db.add(Visit(user_id=user.id, place_id="new", place_name="새 장소", type="meal"))
    db.commit()

    result = list_visits(db=db, user=user)

    assert [row.place_id for row in result] == ["new"]


def test_clearing_again_pushes_the_cutoff_forward():
    db = _make_session()
    user = _make_user(db)

    clear_visits(db=db, user=user)
    first_marker = db.query(HistoryClear).filter(HistoryClear.user_id == user.id).first()
    first_cutoff = first_marker.cleared_at

    clear_visits(db=db, user=user)
    second_marker = db.query(HistoryClear).filter(HistoryClear.user_id == user.id).first()

    # Still exactly one marker row per user (upserted, not duplicated), and
    # the cutoff only ever moves forward.
    assert db.query(HistoryClear).filter(HistoryClear.user_id == user.id).count() == 1
    assert second_marker.cleared_at >= first_cutoff


def test_clear_visits_does_not_affect_personalization_count_query():
    """Mirrors the visit_counts_by_place query in routers.recommendations.recommend():
    a plain count of Visit rows grouped by place_id, filtered only on user_id —
    deliberately NOT joined against HistoryClear. This must return the full
    count regardless of an intervening clear_visits() call."""
    db = _make_session()
    user = _make_user(db)
    db.add(Visit(user_id=user.id, place_id="p1", place_name="단골집", type="cafe"))
    db.commit()

    clear_visits(db=db, user=user)

    db.add(Visit(user_id=user.id, place_id="p1", place_name="단골집", type="cafe"))
    db.commit()

    visit_rows = (
        db.query(Visit.place_id, func.count(Visit.id))
        .filter(Visit.user_id == user.id)
        .group_by(Visit.place_id)
        .all()
    )
    visit_counts_by_place = {row[0]: row[1] for row in visit_rows}

    # Both the pre-clear and post-clear visit to "p1" count, even though
    # list_visits (per the tests above) would only show the post-clear one.
    assert visit_counts_by_place == {"p1": 2}
