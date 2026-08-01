from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

# ---------- Users ----------

class UserCreate(BaseModel):
    email: EmailStr
    # No length/character constraint here on purpose — routers/users.py calls
    # services.password.validate_password() explicitly instead, so the
    # rejection is a clean 400 with a bare Korean message rather than a
    # pydantic 422 whose detail[0].msg is prefixed "Value error, ...".
    password: str
    real_name: str
    birth_date: date
    nickname: str = Field(min_length=2, max_length=20)


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
    """The categorized answer to 'what do you need?'.

    The free-text input stage (POST /classify, services/classify.py) emits
    exactly this shape — {type, lat, lng} — after classifying the user's
    sentence. `type` is an open string, not a closed enum: it's either one
    of the 4 curated categories (meal/cafe/drinks/dessert — Kakao's FD6/CE7
    dedicated category-code search in services/places.py) or an arbitrary
    Korean place-type keyword Claude extracted (e.g. "당구장"), routed to a
    plain Kakao keyword search instead. Everything downstream (Places
    lookup, scoring) treats it as an opaque string either way.
    """
    type: str
    lat: float
    lng: float


class ClassifyIn(BaseModel):
    """Free-text input to POST /classify — the raw sentence AskScreen's
    text field collects, before it's been categorized."""
    text: str = Field(min_length=1, max_length=200)


class ClassifyOut(BaseModel):
    """type is None when Claude couldn't tell what kind of place the user
    wants (see services/classify.py) — AskScreen shows an inline retry
    prompt in that case rather than guessing. There is no button-grid
    fallback; the text step is the only way in."""
    type: Optional[str] = None


class RecommendationOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    place_id: str = Field(alias="placeId")
    name: str
    lat: float
    lng: float
    rating: Optional[float] = None
    rating_count: Optional[int] = Field(default=None, alias="ratingCount")
    distance_minutes: int = Field(alias="distanceMinutes")
    open_now: Optional[bool] = Field(default=None, alias="openNow")
    category: Optional[str] = None
    address: Optional[str] = None
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
    type: str
    model_config = ConfigDict(populate_by_name=True)


class VisitOut(BaseModel):
    """A read-back row for the History screen — GET /visits."""

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    place_id: str = Field(alias="placeId")
    place_name: str = Field(alias="placeName")
    type: str
    created_at: datetime = Field(alias="createdAt")
