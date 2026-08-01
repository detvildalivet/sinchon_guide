from datetime import datetime
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    real_name = Column(String, nullable=False)
    birth_date = Column(Date, nullable=False)
    nickname = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    visits = relationship("Visit", back_populates="user", cascade="all, delete-orphan")


class Visit(Base):
    """A record of a place the user chose to be guided to.

    Keyed by the search provider's place_id (Kakao's `id`, not a local FK)
    since the app no longer owns a place catalog — Kakao Local supplies
    candidates live. This table is the thin, server-owned signal that drives
    visit-history personalization in services/recommendation.py.
    """
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    place_id = Column(String, nullable=False, index=True)
    place_name = Column(String, nullable=False)
    type = Column(String, nullable=False, index=True)  # meal / cafe / drinks / dessert
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="visits")


class HistoryClear(Base):
    """Per-user 'history cleared before this point' marker — one row per user.

    Deliberately a separate table rather than a column on User or Visit:
    Base.metadata.create_all (see app.py) only creates missing tables, it
    doesn't ALTER existing ones, so a new column would force deleting/
    recreating sinchon_guide.db while a new table doesn't.

    Deliberately NOT a delete of Visit rows either: clearing only affects
    what GET /visits (routers/visits.py) shows the user. The personalization
    signal in services/recommendation.py is computed from a separate query
    in routers/recommendations.py that reads Visit directly and never
    consults this table, so every past visit keeps counting toward
    recommendations even after the user clears what they see.
    """
    __tablename__ = "history_clears"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    cleared_at = Column(DateTime, nullable=False)
