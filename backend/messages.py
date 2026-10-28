"""Messagerie sécurisée entre membres de la structure."""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from auth import User
from children import can_read
from core import audit, db, fetch_child, new_id, now_iso

router = APIRouter()


class ThreadIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    child_id: str | None = None
    participant_ids: list[str] = Field(min_length=1, max_length=20)
    text: str = Field(min_length=1, max_length=4000)


class MessageIn(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


async def readable_child(user: dict, child_id: str) -> dict:
    child = await fetch_child(child_id)
    if not child or not can_read(user, child):
        raise HTTPException(404, "Profil introuvable")
    return child


async def thread_for(user: dict, tid: str) -> dict:
    t = await db.threads.find_one({"thread_id": tid}, {"_id": 0})
    if not t or user["user_id"] not in t["participants"]:
        raise HTTPException(404, "Conversation introuvable")
    if t.get("child_id") and not ((child := await fetch_child(t["child_id"])) and can_read(user, child)):
        raise HTTPException(403, "Vous n'avez plus accès au dossier lié à cette conversation")
    return t


async def add_message(t: dict, user: dict, text: str):
    at, text = now_iso(), text.strip()
    await db.thread_messages.insert_one(
        {"msg_id": new_id(), "thread_id": t["thread_id"], "author_id": user["user_id"], "author_name": user["name"], "text": text, "created_at": at}
    )
    await db.threads.update_one(
        {"thread_id": t["thread_id"]}, {"$set": {"last_at": at, "last_text": text[:140], "last_author": user["name"], f"read_by.{user['user_id']}": at}}
    )


async def user_threads(user: dict, child_id: str | None = None) -> list[dict]:
    q = {"participants": user["user_id"], **({"child_id": child_id} if child_id else {})}
    out = []
    for t in await db.threads.find(q, {"_id": 0}).sort("last_at", -1).to_list(200):
        if t.get("child_id"):
            child = await fetch_child(t["child_id"])
            if not child or not can_read(user, child):
                continue
            t["child_name"], t["child_portrait"] = child["name"], child.get("avatar", {}).get("portrait")
        seen = t.pop("read_by", {}).get(user["user_id"], "")
        t["unread"] = await db.thread_messages.count_documents(
            {"thread_id": t["thread_id"], "created_at": {"$gt": seen}, "author_id": {"$ne": user["user_id"]}}
        )
        out.append(t)
    return out


@router.get("/messages/contacts")
async def message_contacts(user: User, child_id: str | None = None):
    users = await db.users.find({"status": "active", "user_id": {"$ne": user["user_id"]}}, {"_id": 0, "password_hash": 0}).to_list(500)
    if child_id:
        child = await readable_child(user, child_id)
        users = [u for u in users if can_read(u, child)]
    return [{"user_id": u["user_id"], "name": u["name"], "role": u.get("role"), "picture": u.get("picture")} for u in users]


@router.get("/messages/threads")
async def list_threads(user: User, child_id: str | None = None):
    return await user_threads(user, child_id)


@router.post("/messages/threads")
async def create_thread(body: ThreadIn, request: Request, user: User):
    child = await readable_child(user, body.child_id) if body.child_id else None
    ids = list(dict.fromkeys(i for i in body.participant_ids if i != user["user_id"]))
    members = await db.users.find({"user_id": {"$in": ids}, "status": "active"}, {"_id": 0}).to_list(50)
    if not ids or len(members) != len(ids):
        raise HTTPException(400, "Destinataire invalide ou inactif")
    if child and not all(can_read(m, child) for m in members):
        raise HTTPException(403, "Un destinataire n'a pas accès à ce dossier")
    t = {
        "thread_id": new_id("th"),
        "title": body.title.strip(),
        "child_id": body.child_id,
        "participants": [user["user_id"], *ids],
        "participant_names": [user["name"], *(m["name"] for m in members)],
        "created_by": user["user_id"],
        "created_at": now_iso(),
        "read_by": {},
    }
    await db.threads.insert_one(t)
    await add_message(t, user, body.text)
    await audit(user, "message.thread_create", body.child_id, t["thread_id"], request)
    return await db.threads.find_one({"thread_id": t["thread_id"]}, {"_id": 0, "read_by": 0})


@router.get("/messages/threads/{tid}")
async def read_thread(tid: str, request: Request, user: User, poll: bool = False):
    t = await thread_for(user, tid)
    msgs = await db.thread_messages.find({"thread_id": tid}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    await db.threads.update_one({"thread_id": tid}, {"$set": {f"read_by.{user['user_id']}": now_iso()}})
    if not poll:
        await audit(user, "message.thread_read", t.get("child_id"), tid, request)
    t.pop("read_by", None)
    return {"thread": t, "messages": msgs}


@router.post("/messages/threads/{tid}/messages")
async def post_message(tid: str, body: MessageIn, request: Request, user: User):
    t = await thread_for(user, tid)
    await add_message(t, user, body.text)
    await audit(user, "message.send", t.get("child_id"), tid, request)
    return {"ok": True}


@router.get("/messages/unread")
async def unread_total(user: User):
    return {"unread": sum(t["unread"] for t in await user_threads(user))}
