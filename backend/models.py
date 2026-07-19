from datetime import datetime
from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
)
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

    Keyed by Google's place_id (not a local FK) since the app no longer owns a
    place catalog — Places API supplies candidates live. This table is the
    thin, server-owned signal that drives visit-history personalization in
    services/recommendation.py.
    """
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    google_place_id = Column(String, nullable=False, index=True)
    place_name = Column(String, nullable=False)
    type = Column(String, nullable=False, index=True)  # meal / cafe / drinks / dessert
    budget = Column(String, nullable=False)  # cheap / mid / splurge
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="visits")


class PlaceAnnotation(Base):
    """Thin server-side cache/annotation layer keyed by Google's place_id.

    Deliberately NOT a full mirror of Sinchon's places — only rows for places
    that have actually surfaced in a recommendation get cached here. Basic
    fields are refreshed opportunistically (last_fetched); curated_tags is the
    slot for hand-tuned personalization signals that Places API can't supply.
    """
    __tablename__ = "place_annotations"

    place_id = Column(String, primary_key=True)  # Google place_id
    name = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    rating = Column(Float, nullable=True)
    price_level = Column(Integer, nullable=True)  # 0-4, Google's PriceLevel enum as int
    curated_tags = Column(JSON, default=list, nullable=False)
    last_fetched = Column(DateTime, default=datetime.utcnow, nullable=False)
