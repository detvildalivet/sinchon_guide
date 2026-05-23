from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Place, Room, RoomMember, User
from schemas import (
    AvailableTimesUpdate,
    RoomCreate,
    RoomDetail,
    RoomMemberPublic,
    RoomOut,
)

router = APIRouter(prefix="/rooms", tags=["rooms"])


def _serialize_room(db: Session, room: Room) -> dict:
    count = db.query(func.count(RoomMember.id)).filter(RoomMember.room_id == room.id).scalar()
    return {
        "id": room.id,
        "place_id": room.place_id,
        "name": room.name,
        "max_participants": room.max_participants,
        "creator_id": room.creator_id,
        "status": room.status,
        "final_gathering_time": room.final_gathering_time,
        "created_at": room.created_at,
        "current_participants": count or 0,
    }


@router.post("", response_model=RoomOut, status_code=status.HTTP_201_CREATED)
def create_room(
    payload: RoomCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not db.query(Place).filter(Place.id == payload.place_id).first():
        raise HTTPException(status_code=404, detail="Place not found")
    room = Room(
        place_id=payload.place_id,
        name=payload.name,
        max_participants=payload.max_participants,
        creator_id=user.id,
    )
    db.add(room)
    db.flush()  # get room.id
    db.add(RoomMember(room_id=room.id, user_id=user.id, available_times=[]))
    db.commit()
    db.refresh(room)
    return _serialize_room(db, room)


@router.get("", response_model=list[RoomOut])
def list_rooms(
    place_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
):
    q = db.query(Room).filter(Room.status == "open")
    if place_id is not None:
        q = q.filter(Room.place_id == place_id)
    rooms = q.order_by(Room.created_at.desc()).all()
    return [_serialize_room(db, r) for r in rooms]


@router.get("/{room_id}", response_model=RoomDetail)
def get_room(
    room_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    base = _serialize_room(db, room)
    members = (
        db.query(RoomMember)
        .filter(RoomMember.room_id == room_id)
        .order_by(RoomMember.joined_at.asc())
        .all()
    )
    base["members"] = [
        RoomMemberPublic(nickname=m.user.nickname, joined_at=m.joined_at) for m in members
    ]
    return base


@router.post("/{room_id}/join", response_model=RoomOut)
def join_room(
    room_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room.status != "open":
        raise HTTPException(status_code=400, detail="Room is not open")

    count = db.query(func.count(RoomMember.id)).filter(RoomMember.room_id == room.id).scalar() or 0
    if count >= room.max_participants:
        raise HTTPException(status_code=400, detail="Room is full")

    db.add(RoomMember(room_id=room.id, user_id=user.id, available_times=[]))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Already a member of this room")
    db.refresh(room)
    return _serialize_room(db, room)


@router.delete("/{room_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
def leave_room(
    room_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    membership = (
        db.query(RoomMember)
        .filter(RoomMember.room_id == room_id, RoomMember.user_id == user.id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=404, detail="Not a member of this room")
    db.delete(membership)
    db.commit()


@router.put("/{room_id}/available-times", response_model=RoomOut)
def submit_available_times(
    room_id: int,
    payload: AvailableTimesUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    membership = (
        db.query(RoomMember)
        .filter(RoomMember.room_id == room_id, RoomMember.user_id == user.id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=404, detail="Not a member of this room")
    membership.available_times = [t.isoformat() for t in payload.available_times]
    db.commit()
    room = db.query(Room).filter(Room.id == room_id).first()
    return _serialize_room(db, room)


@router.post("/{room_id}/auto-match", response_model=RoomOut)
def auto_match(
    room_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Intersect members' available_times. Pick the earliest common slot; set as final_gathering_time."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room.creator_id != user.id:
        raise HTTPException(status_code=403, detail="Only the creator can trigger auto-match")

    members = db.query(RoomMember).filter(RoomMember.room_id == room_id).all()
    if not members:
        raise HTTPException(status_code=400, detail="Room has no members")

    slot_sets = [set(m.available_times or []) for m in members]
    if any(len(s) == 0 for s in slot_sets):
        raise HTTPException(status_code=400, detail="Not all members have submitted availability")

    common = set.intersection(*slot_sets)
    if not common:
        raise HTTPException(status_code=409, detail="No common available time among members")

    earliest = sorted(common)[0]  # ISO strings sort chronologically
    room.final_gathering_time = datetime.fromisoformat(earliest)
    room.status = "closed"
    db.commit()
    db.refresh(room)
    return _serialize_room(db, room)
