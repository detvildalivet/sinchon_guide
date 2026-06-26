from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

PlaceType = Literal["restaurant", "cafe", "bar"]
MealSlot = Literal["breakfast", "lunch", "snack", "dinner", "late"]
QueueStatus = Literal["open", "closed"]
SenderType = Literal["system", "user"]


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


# ---------- Places (live from Google; not stored) ----------

class NearbyPlaceOut(BaseModel):
    """A venue returned by Google Places Nearby Search, normalized for the app."""
    model_config = ConfigDict(populate_by_name=True)

    google_place_id: str = Field(alias="googlePlaceId")
    name: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    place_type: PlaceType = Field(alias="placeType")
    rating: Optional[float] = None


class PlaceRefOut(BaseModel):
    """The thin DB reference row that anchors visits/queues (id <-> google id)."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    google_place_id: str = Field(alias="googlePlaceId")
    name: Optional[str] = None
    revisited_rate: float = Field(default=0.0, alias="revisitedRate")


# ---------- Visits ----------

class VisitStart(BaseModel):
    google_place_id: str = Field(alias="googlePlaceId")
    name: Optional[str] = None  # cached on the Place row for history display
    arrived_at: Optional[datetime] = None
    model_config = ConfigDict(populate_by_name=True)


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


# ---------- Queues ----------

class QueueCreate(BaseModel):
    google_place_id: str = Field(alias="googlePlaceId")
    name: Optional[str] = None  # cached on the Place row for system messages
    model_config = ConfigDict(populate_by_name=True)


class QueueInfo(BaseModel):
    """Matches frontend QueueInfo: { placeId, exists, waitingCount }.

    `placeId` here is the Google place id (the public place identifier).
    """
    place_id: str = Field(alias="placeId")
    exists: bool
    waiting_count: int = Field(alias="waitingCount")
    queue_id: Optional[int] = Field(default=None, alias="queueId")
    model_config = ConfigDict(populate_by_name=True)


class QueueOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: int
    place_id: int = Field(alias="placeId")
    google_place_id: Optional[str] = Field(default=None, alias="googlePlaceId")
    status: QueueStatus
    waiting_count: int = Field(alias="waitingCount")
    created_at: datetime = Field(alias="createdAt")


# ---------- Messages ----------

class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class MessageOut(BaseModel):
    """Matches frontend Message (+ identifiers). Client derives 'me' vs 'system'."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    queue_id: int = Field(alias="queueId")
    user_id: Optional[int] = Field(default=None, alias="userId")
    sender_type: SenderType = Field(alias="senderType")
    body: str
    created_at: datetime = Field(alias="createdAt")


# ---------- Recommendations ----------

class SoloMenuRecommendationOut(BaseModel):
    """Matches frontend SoloMenuRecommendation exactly."""
    model_config = ConfigDict(populate_by_name=True)

    id: str  # MenuItem.code e.g. "sm1"
    menu_name: str = Field(alias="menuName")
    venue_name: str = Field(alias="venueName")
    category: PlaceType
    description: str
    distance: str
    tags: list[str]
    score: float
    reason: str
