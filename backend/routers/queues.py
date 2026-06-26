from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from sqlalchemy.orm import Session

from auth import get_current_user, get_user_from_token
from database import SessionLocal, get_db
from models import Message, Place, Queue, QueueMember, User
from routers.places import resolve_place_id
from schemas import MessageCreate, MessageOut, QueueCreate, QueueInfo, QueueOut

router = APIRouter(prefix="/queues", tags=["queues"])


# ---------- WebSocket connection manager ----------

class ConnectionManager:
    """Tracks live WebSocket connections per queue and broadcasts to them."""

    def __init__(self) -> None:
        self.active: dict[int, set[WebSocket]] = {}

    async def connect(self, queue_id: int, ws: WebSocket) -> None:
        await ws.accept()
        self.active.setdefault(queue_id, set()).add(ws)

    def disconnect(self, queue_id: int, ws: WebSocket) -> None:
        conns = self.active.get(queue_id)
        if conns:
            conns.discard(ws)
            if not conns:
                self.active.pop(queue_id, None)

    async def broadcast(self, queue_id: int, payload: dict) -> None:
        for ws in list(self.active.get(queue_id, set())):
            try:
                await ws.send_json(payload)
            except Exception:
                self.disconnect(queue_id, ws)


manager = ConnectionManager()


# ---------- Helpers ----------

def _waiting_count(db: Session, queue_id: int) -> int:
    return db.query(QueueMember).filter(QueueMember.queue_id == queue_id).count()


def _serialize_queue(db: Session, queue: Queue) -> QueueOut:
    return QueueOut(
        id=queue.id,
        place_id=queue.place_id,
        google_place_id=queue.place.google_place_id if queue.place else None,
        status=queue.status,
        waiting_count=_waiting_count(db, queue.id),
        created_at=queue.created_at,
    )


def _open_queue_for_place(db: Session, place_id: int) -> Optional[Queue]:
    return (
        db.query(Queue)
        .filter(Queue.place_id == place_id, Queue.status == "open")
        .first()
    )


def _add_system_message(db: Session, queue_id: int, body: str) -> Message:
    msg = Message(queue_id=queue_id, user_id=None, sender_type="system", body=body)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


async def _broadcast_message(queue_id: int, msg: Message) -> None:
    await manager.broadcast(
        queue_id,
        {
            "type": "message",
            "message": MessageOut.model_validate(msg).model_dump(
                by_alias=True, mode="json"
            ),
        },
    )


async def _broadcast_presence(db: Session, queue_id: int) -> None:
    await manager.broadcast(
        queue_id, {"type": "presence", "waitingCount": _waiting_count(db, queue_id)}
    )


# ---------- REST endpoints ----------

@router.get("/info/{google_place_id}", response_model=QueueInfo)
def queue_info(google_place_id: str, db: Session = Depends(get_db)):
    """Open-queue status for a Google place id (mirror of frontend getQueueInfo)."""
    place = (
        db.query(Place).filter(Place.google_place_id == google_place_id).first()
    )
    if not place:
        return QueueInfo(place_id=google_place_id, exists=False, waiting_count=0)
    queue = _open_queue_for_place(db, place.id)
    if not queue:
        return QueueInfo(place_id=google_place_id, exists=False, waiting_count=0)
    return QueueInfo(
        place_id=google_place_id,
        exists=True,
        waiting_count=_waiting_count(db, queue.id),
        queue_id=queue.id,
    )


@router.post("", response_model=QueueOut, status_code=status.HTTP_201_CREATED)
def create_queue(
    payload: QueueCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create an open queue at a place ("큐 생성"). Creator becomes the first member."""
    place_id = resolve_place_id(db, payload.google_place_id, payload.name)
    place = db.query(Place).filter(Place.id == place_id).first()

    if _open_queue_for_place(db, place.id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An open queue already exists for this place",
        )

    queue = Queue(place_id=place.id, creator_id=user.id, status="open")
    db.add(queue)
    db.commit()
    db.refresh(queue)

    db.add(QueueMember(queue_id=queue.id, user_id=user.id))
    db.commit()

    place_label = place.name or "이곳"
    _add_system_message(db, queue.id, f"{place_label} 큐가 열렸어요. 이제 다른 사람이 조인할 수 있어요.")
    return _serialize_queue(db, queue)


@router.post("/{queue_id}/join", response_model=QueueOut)
async def join_queue(
    queue_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Join an open queue ("큐 조인")."""
    queue = db.query(Queue).filter(Queue.id == queue_id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    if queue.status != "open":
        raise HTTPException(status_code=409, detail="Queue is not open")

    existing = (
        db.query(QueueMember)
        .filter(QueueMember.queue_id == queue_id, QueueMember.user_id == user.id)
        .first()
    )
    if not existing:
        db.add(QueueMember(queue_id=queue_id, user_id=user.id))
        db.commit()
        msg = _add_system_message(db, queue_id, f"{user.nickname}님이 입장했어요.")
        await _broadcast_message(queue_id, msg)
        await _broadcast_presence(db, queue_id)

    return _serialize_queue(db, queue)


@router.delete("/{queue_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_queue(
    queue_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    member = (
        db.query(QueueMember)
        .filter(QueueMember.queue_id == queue_id, QueueMember.user_id == user.id)
        .first()
    )
    if member:
        db.delete(member)
        db.commit()
        msg = _add_system_message(db, queue_id, f"{user.nickname}님이 나갔어요.")
        await _broadcast_message(queue_id, msg)

        if _waiting_count(db, queue_id) == 0:
            queue = db.query(Queue).filter(Queue.id == queue_id).first()
            if queue:
                queue.status = "closed"
                db.commit()
        await _broadcast_presence(db, queue_id)
    return None


@router.get("/{queue_id}/messages", response_model=list[MessageOut])
def list_messages(
    queue_id: int,
    limit: int = Query(default=100, ge=1, le=500),
    before_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not db.query(Queue).filter(Queue.id == queue_id).first():
        raise HTTPException(status_code=404, detail="Queue not found")
    q = db.query(Message).filter(Message.queue_id == queue_id)
    if before_id is not None:
        q = q.filter(Message.id < before_id)
    rows = q.order_by(Message.id.desc()).limit(limit).all()
    return list(reversed(rows))


@router.post(
    "/{queue_id}/messages",
    response_model=MessageOut,
    status_code=status.HTTP_201_CREATED,
)
async def post_message(
    queue_id: int,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """REST fallback for sending a chat message when WebSocket is unavailable."""
    queue = db.query(Queue).filter(Queue.id == queue_id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")

    msg = Message(
        queue_id=queue_id, user_id=user.id, sender_type="user", body=payload.body
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    await _broadcast_message(queue_id, msg)
    return msg


# ---------- WebSocket ----------

@router.websocket("/{queue_id}/ws")
async def queue_ws(websocket: WebSocket, queue_id: int, token: str = Query(...)):
    """Live chat + presence. Auth via ?token=<jwt> (RN cannot set WS headers)."""
    db = SessionLocal()
    try:
        user = get_user_from_token(token, db)
        if user is None:
            await websocket.close(code=4401)
            return

        queue = db.query(Queue).filter(Queue.id == queue_id).first()
        if not queue:
            await websocket.close(code=4404)
            return

        is_member = (
            db.query(QueueMember)
            .filter(QueueMember.queue_id == queue_id, QueueMember.user_id == user.id)
            .first()
        )
        if not is_member:
            await websocket.close(code=4403)
            return

        await manager.connect(queue_id, websocket)
        try:
            while True:
                data = await websocket.receive_json()
                if data.get("type") != "message":
                    continue
                body = (data.get("body") or "").strip()
                if not body:
                    continue
                msg = Message(
                    queue_id=queue_id,
                    user_id=user.id,
                    sender_type="user",
                    body=body[:2000],
                )
                db.add(msg)
                db.commit()
                db.refresh(msg)
                await _broadcast_message(queue_id, msg)
        except WebSocketDisconnect:
            manager.disconnect(queue_id, websocket)
    finally:
        db.close()
