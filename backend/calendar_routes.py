"""Calendrier partagé et rappels de notes."""

from datetime import datetime, timedelta, UTC
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from auth import User
from children import Access, readable_query
from core import db, new_id, now_iso

router = APIRouter()
REMINDER_DAYS = 14


class EventIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    kind: Literal["rdv", "reunion", "autre"] = "rdv"
    start: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}", max_length=40)
    duration: int = Field(default=60, ge=5, le=720)
    location: str = Field(default="", max_length=160)
    notes: str = Field(default="", max_length=1000)


@router.get("/events")
async def list_events(user: User, child_id: str | None = None, start: str | None = None, end: str | None = None):
    q: dict = {}
    if user.get("role") not in ("admin", "direction"):
        ids = [c["child_id"] for c in await db.children.find(readable_query(user), {"child_id": 1}).to_list(500)]
        if child_id and child_id not in ids:
            raise HTTPException(404, "Profil introuvable")
        q["child_id"] = {"$in": ids}
    if child_id:
        q["child_id"] = child_id
    if start or end:
        q["start"] = {**({"$gte": start} if start else {}), **({"$lt": end} if end else {})}
    return await db.events.find(q, {"_id": 0}).sort("start", 1).to_list(1000)


@router.post("/children/{child_id}/events")
async def create_event(child_id: str, body: EventIn, access: Access):
    user, child = access
    doc = {
        "event_id": new_id("evt"),
        "child_id": child_id,
        "child_name": child["name"],
        **body.model_dump(),
        "created_by": user["user_id"],
        "created_by_name": user["name"],
        "created_at": now_iso(),
    }
    await db.events.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/children/{child_id}/events/{event_id}")
async def update_event(child_id: str, event_id: str, body: EventIn, _: Access):
    doc = await db.events.find_one_and_update(
        {"event_id": event_id, "child_id": child_id}, {"$set": body.model_dump()}, projection={"_id": 0}, return_document=True
    )
    if not doc:
        raise HTTPException(404, "Rendez-vous introuvable")
    return doc


@router.delete("/children/{child_id}/events/{event_id}")
async def delete_event(child_id: str, event_id: str, _: Access):
    if not (await db.events.delete_one({"event_id": event_id, "child_id": child_id})).deleted_count:
        raise HTTPException(404, "Rendez-vous introuvable")
    return {"ok": True}


@router.get("/reminders")
async def reminders(user: User):
    """Dossiers sans note depuis REMINDER_DAYS jours (admin : tous ; éducateur : les siens)."""
    if user.get("role") not in ("admin", "educator"):
        return []
    q = {} if user["role"] == "admin" else {"$or": [{"user_id": user["user_id"]}, {"assigned": user["user_id"]}]}
    limit = (datetime.now(UTC) - timedelta(days=REMINDER_DAYS)).isoformat()
    out = []
    for c in await db.children.find(q, {"_id": 0, "child_id": 1, "name": 1, "created_at": 1}).to_list(500):
        last = await db.child_notes.find_one({"child_id": c["child_id"]}, {"_id": 0, "created_at": 1}, sort=[("created_at", -1)])
        if (last["created_at"] if last else c.get("created_at", "")) < limit:
            out.append({"child_id": c["child_id"], "name": c["name"], "last_note_at": last["created_at"] if last else None})
    return out
