from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

NeedType = Literal["meal", "cafe", "drinks", "dessert"]
Budget = Literal["cheap", "mid", "splurge"]


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


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Recommendations ----------

class NeedIn(BaseModel):
    """The categorized answer to 'what do you need?' — the LLM-ready contract.

    A future free-text input stage just needs to emit this same shape;
    everything downstream (Places lookup, scoring) is unaffected.
    """
    type: NeedType
    budget: Budget
    lat: float
    lng: float


class RecommendationOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    place_id: str = Field(alias="placeId")
    name: str
    lat: float
    lng: float
    rating: Optional[float] = None
    price_level: Optional[int] = Field(default=None, alias="priceLevel")
    distance_minutes: int = Field(alias="distanceMinutes")
    open_now: Optional[bool] = Field(default=None, alias="openNow")
    score: float
    reason: str


# ---------- Routes ----------

class Coord(BaseModel):
    lat: float
    lng: float


class RouteIn(BaseModel):
    origin: Coord
    destination: Coord


class LatLng(BaseModel):
    """Matches frontend MapCoordinate — {latitude, longitude}, not {lat, lng}
    like Coord above, since this feeds NaverMapPathOverlay's `coords` prop
    directly with no reshaping on the client."""

    latitude: float
    longitude: float


class RouteOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    coordinates: list[LatLng]
    distance_minutes: int = Field(alias="distanceMinutes")
    distance_meters: int = Field(alias="distanceMeters")


# ---------- Visits ----------

class VisitCreate(BaseModel):
    place_id: str = Field(alias="placeId")
    place_name: str = Field(alias="placeName")
    type: NeedType
    budget: Budget
    model_config = ConfigDict(populate_by_name=True)
