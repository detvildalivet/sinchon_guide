from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    UniqueConstraint,
    Index,
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
    queues_created = relationship("Queue", back_populates="creator")
    queue_memberships = relationship(
        "QueueMember", back_populates="user", cascade="all, delete-orphan"
    )
    messages = relationship("Message", back_populates="user")


class Place(Base):
    """A thin reference to a Google place.

    Place *details* (address, coords, menu, rating) are fetched live from Google
    and are NOT stored here. This row exists only to give Visit/Queue a stable
    integer FK target keyed off the Google place id. `name` is cached for display
    in visit history and queue system messages.
    """
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)
    google_place_id = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=True)
    # Share of distinct visitors who came back (>=2 visits). Behavioural metric.
    revisited_rate = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    visits = relationship("Visit", back_populates="place", cascade="all, delete-orphan")
    queues = relationship("Queue", back_populates="place", cascade="all, delete-orphan")
    menu_items = relationship(
        "MenuItem", back_populates="place", cascade="all, delete-orphan"
    )


class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    place_id = Column(Integer, ForeignKey("places.id"), nullable=False, index=True)
    arrived_at = Column(DateTime, nullable=False)
    left_at = Column(DateTime, nullable=True)
    mood = Column(Float, nullable=True)
    price = Column(Float, nullable=True)
    disliked = Column(Boolean, default=False, nullable=False)
    feedback_submitted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="visits")
    place = relationship("Place", back_populates="visits")

    __table_args__ = (
        Index("ix_visits_user_place", "user_id", "place_id"),
    )


class MenuItem(Base):
    """A menu item carrying both display data and solo-recommendation scoring metadata.

    venue_name / category / distance are denormalized so the recommendation response
    matches the frontend SoloMenuRecommendation shape without a join.
    """
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=True, index=True)  # frontend id e.g. "sm1"
    place_id = Column(Integer, ForeignKey("places.id"), nullable=True, index=True)
    menu_name = Column(String, nullable=False)
    venue_name = Column(String, nullable=False)
    category = Column(
        Enum("restaurant", "cafe", "bar", name="menu_category_enum"),
        nullable=False,
        index=True,
    )
    description = Column(String, nullable=False)
    distance = Column(String, nullable=False)  # pre-formatted e.g. "도보 6분"
    distance_minutes = Column(Integer, nullable=False)
    tags = Column(JSON, default=list, nullable=False)
    solo_score = Column(Float, nullable=False)
    meal_slot = Column(
        Enum("breakfast", "lunch", "snack", "dinner", "late", name="meal_slot_enum"),
        nullable=False,
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    place = relationship("Place", back_populates="menu_items")


class Queue(Base):
    """A waiting queue at a place. At most one open queue per place."""
    __tablename__ = "queues"

    id = Column(Integer, primary_key=True, index=True)
    place_id = Column(Integer, ForeignKey("places.id"), nullable=False, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(
        Enum("open", "closed", name="queue_status_enum"),
        default="open",
        nullable=False,
        index=True,
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    place = relationship("Place", back_populates="queues")
    creator = relationship("User", back_populates="queues_created")
    members = relationship(
        "QueueMember", back_populates="queue", cascade="all, delete-orphan"
    )
    messages = relationship(
        "Message", back_populates="queue", cascade="all, delete-orphan"
    )


class QueueMember(Base):
    __tablename__ = "queue_members"

    id = Column(Integer, primary_key=True, index=True)
    queue_id = Column(Integer, ForeignKey("queues.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    queue = relationship("Queue", back_populates="members")
    user = relationship("User", back_populates="queue_memberships")

    __table_args__ = (
        UniqueConstraint("queue_id", "user_id", name="uq_queue_member"),
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    queue_id = Column(Integer, ForeignKey("queues.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # null = system
    sender_type = Column(
        Enum("system", "user", name="sender_type_enum"),
        nullable=False,
    )
    body = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    queue = relationship("Queue", back_populates="messages")
    user = relationship("User", back_populates="messages")

    __table_args__ = (
        Index("ix_messages_queue_created", "queue_id", "created_at"),
    )
