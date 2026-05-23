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
    rooms_created = relationship("Room", back_populates="creator")
    memberships = relationship("RoomMember", back_populates="user", cascade="all, delete-orphan")


class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)
    google_place_id = Column(String, unique=True, nullable=True, index=True)
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String, nullable=True)
    place_type = Column(
        Enum("restaurant", "cafe", "bar", name="place_type_enum"),
        nullable=False,
        index=True,
    )
    revisited_rate = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    visits = relationship("Visit", back_populates="place", cascade="all, delete-orphan")
    rooms = relationship("Room", back_populates="place", cascade="all, delete-orphan")


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


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    place_id = Column(Integer, ForeignKey("places.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    max_participants = Column(Integer, nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(
        Enum("open", "closed", "completed", name="room_status_enum"),
        default="open",
        nullable=False,
        index=True,
    )
    final_gathering_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    place = relationship("Place", back_populates="rooms")
    creator = relationship("User", back_populates="rooms_created")
    members = relationship("RoomMember", back_populates="room", cascade="all, delete-orphan")


class RoomMember(Base):
    __tablename__ = "room_members"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    available_times = Column(JSON, default=list, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    room = relationship("Room", back_populates="members")
    user = relationship("User", back_populates="memberships")

    __table_args__ = (
        UniqueConstraint("room_id", "user_id", name="uq_room_member"),
    )
