from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

PlaceType = Literal["restaurant", "cafe", "bar"]
RoomStatus = Literal["open", "closed", "completed"]


# ---------- Users ----------

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    real_name: str
    birth_date: date
    nickname: str = Field(min_length=2, max_length=20)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserSelf(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    real_name: str
    birth_date: date
    nickname: str
    created_at: datetime


class UserPublic(BaseModel):
    """Exposed to other users — nickname only."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    nickname: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Places ----------

class PlaceCreate(BaseModel):
    google_place_id: Optional[str] = None
    name: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    place_type: PlaceType


class PlaceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    google_place_id: Optional[str]
    name: str
    latitude: float
    longitude: float
    address: Optional[str]
    place_type: PlaceType
    revisited_rate: float
    created_at: datetime


# ---------- Visits ----------

class VisitStart(BaseModel):
    place_id: int
    arrived_at: Optional[datetime] = None


class VisitEnd(BaseModel):
    left_at: Optional[datetime] = None


class VisitFeedback(BaseModel):
    """Either submit mood+price OR set disliked=True. Mood/price ignored if disliked."""
    mood: Optional[float] = Field(default=None, ge=-1.0, le=1.0)
    price: Optional[float] = Field(default=None, ge=-1.0, le=1.0)
    disliked: bool = False


class VisitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    place_id: int
    arrived_at: datetime
    left_at: Optional[datetime]
    mood: Optional[float]
    price: Optional[float]
    disliked: bool
    feedback_submitted: bool
    created_at: datetime


# ---------- Rooms ----------

class RoomCreate(BaseModel):
    place_id: int
    name: str
    max_participants: int = Field(ge=2, le=20)


class RoomOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    place_id: int
    name: str
    max_participants: int
    creator_id: int
    status: RoomStatus
    final_gathering_time: Optional[datetime]
    created_at: datetime
    current_participants: int


class RoomMemberPublic(BaseModel):
    """Per-member view exposed to other room members — nickname only, no identifying info."""
    model_config = ConfigDict(from_attributes=True)

    nickname: str
    joined_at: datetime


class RoomDetail(RoomOut):
    members: list[RoomMemberPublic]


class AvailableTimesUpdate(BaseModel):
    available_times: list[datetime]
