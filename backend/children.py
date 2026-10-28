"""Dossiers des enfants : accès, niveaux, quêtes, observations, partages, notes."""

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from auth import User, role
from core import DEFAULT_LEVELS, DOMAIN_IDS, IMG, XP_OBS, XP_STEP, Email, Id, audit, db, fetch_child, new_id, now_iso

router = APIRouter()
Text = Annotated[str, Field(max_length=2000)]


# ---------- Droits d'accès ----------
def can_read(user: dict, child: dict) -> bool:
    if user.get("role") in ("admin", "direction"):
        return True
    return user.get("role") == "educator" and (
        child["user_id"] == user["user_id"]
        or user["user_id"] in child.get("assigned", [])
        or user["email"].lower() in [x["email"] for x in child.get("shares", [])]
    )


def readable_query(user: dict) -> dict:
    """Filtre Mongo des dossiers visibles (admin/direction : tous)."""
    if user.get("role") in ("admin", "direction"):
        return {}
    return {"$or": [{"user_id": user["user_id"]}, {"assigned": user["user_id"]}, {"shares.email": user["email"].lower()}]}


async def child_access(child_id: str, request: Request, user: User) -> tuple[dict, dict]:
    """Dépendance : (utilisateur, enfant) si l'utilisateur a accès au dossier. Toute modification est tracée."""
    child = await fetch_child(child_id)
    if not child or not can_read(user, child):
        raise HTTPException(404, "Profil introuvable")
    if request.method != "GET" and user.get("role") == "direction":
        raise HTTPException(403, "Accès en lecture seule pour la direction")
    if request.method != "GET" or request.url.path.endswith(child_id):
        await audit(user, f"{request.method} {request.url.path.replace('/api', '', 1)}", child_id, request=request)
    return user, child


Access = Annotated[tuple[dict, dict], Depends(child_access)]


async def owner_access(access: Access) -> tuple[dict, dict]:
    user, child = access
    if child["user_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(403, "Réservé au responsable du dossier")
    return access


Owner = Annotated[tuple[dict, dict], Depends(owner_access)]


# ---------- Modèles ----------
class Avatar(BaseModel):
    face: int = 0
    hair: int = 0
    accessory: int = 0
    portrait: str | None = Field(default=None, max_length=300)


def check_portrait(avatar: Avatar | None):
    p = avatar and avatar.portrait
    if p and not (p.startswith("/api/avatars/") or p.startswith(IMG)):
        raise HTTPException(400, "Portrait non autorisé")


class ChildIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    age: int = Field(ge=0, le=21)
    grade: str = Field(default="", max_length=40)
    notes: Text = ""
    avatar: Avatar = Avatar()


class ChildPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=60)
    age: int | None = Field(default=None, ge=0, le=21)
    grade: str | None = Field(default=None, max_length=40)
    notes: Text | None = None
    avatar: Avatar | None = None


class LevelIn(BaseModel):
    domain_id: str
    level: int = Field(ge=1, le=5)


class StepIn(BaseModel):
    status: Literal["fait", "en cours", "à venir"]


class ObservationIn(BaseModel):
    domain_id: str = Field(max_length=40)
    date: str = Field(max_length=40)
    fact: str = Field(min_length=1, max_length=4000)
    context: Text = ""


class ShareIn(BaseModel):
    email: Email
    role: Literal["parent", "pro"]


class QuestStepIn(BaseModel):
    title: str = Field(min_length=1, max_length=80)
    objective: Text = ""
    action: Text = ""
    resource: Text = ""
    indicator: Text = ""


class QuestIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    domainId: str
    term: str = Field(default="Moyen terme (1–3 mois)", max_length=60)
    steps: list[QuestStepIn] = Field(min_length=1, max_length=6)


class NoteIn(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


def new_child_doc(user_id: str, data: ChildIn) -> dict:
    return {
        "child_id": new_id("child"),
        "user_id": user_id,
        **data.model_dump(),
        "levels": dict(DEFAULT_LEVELS),
        "initial_levels": dict(DEFAULT_LEVELS),
        "level_history": [],
        "quest_steps": {},
        "shares": [],
        "assigned": [],
        "custom_quests": [],
        "avatar_history": [],
        "xp": 0,
        "created_at": now_iso(),
    }


async def store_quest(child_id: str, q: QuestIn) -> dict:
    if q.domainId not in DOMAIN_IDS:
        raise HTTPException(400, "Domaine inconnu")
    quest = {"id": new_id("cq")[:13], **q.model_dump(), "custom": True, "steps": [{**s.model_dump(), "status": "à venir"} for s in q.steps]}
    await db.children.update_one({"child_id": child_id}, {"$push": {"custom_quests": quest}})
    return quest


# ---------- Dossiers ----------
@router.get("/children")
async def list_children(user: User):
    if user.get("role") == "internal":
        return []
    kids = await db.children.find(readable_query(user), {"_id": 0}).sort("created_at", 1).to_list(200)
    me = user["email"].lower()
    for k in kids:
        mine, assigned = k["user_id"] == user["user_id"], user["user_id"] in k.get("assigned", [])
        if not mine and me in [x["email"] for x in k.get("shares", [])]:
            owner = await db.users.find_one({"user_id": k["user_id"]}, {"_id": 0, "name": 1})
            k["owner_name"] = (owner or {}).get("name", "Structure")
        k["access"] = (
            "owner" if mine else "readonly" if user["role"] == "direction" else "assigned" if assigned else "structure" if user["role"] == "admin" else "shared"
        )
    return kids


@router.post("/children")
async def create_child(body: ChildIn, request: Request, user: Annotated[dict, role("admin", "educator")]):
    check_portrait(body.avatar)
    doc = new_child_doc(user["user_id"], body)
    if user["role"] == "educator":
        doc["assigned"] = [user["user_id"]]
    await db.children.insert_one(doc)
    await audit(user, "child.create", doc["child_id"], request=request)
    doc.pop("_id", None)
    return doc


@router.get("/children/{child_id}")
async def read_child(access: Access):
    return access[1]


@router.put("/children/{child_id}")
async def update_child(child_id: str, body: ChildPatch, _: Access):
    check_portrait(body.avatar)
    if patch := body.model_dump(exclude_none=True):
        await db.children.update_one({"child_id": child_id}, {"$set": patch})
    return await fetch_child(child_id)


@router.delete("/children/{child_id}")
async def delete_child(child_id: str, _: Owner):
    await db.children.delete_one({"child_id": child_id})
    for col in (db.observations, db.ai_messages, db.avatars, db.child_notes, db.events):
        await col.delete_many({"child_id": child_id})
    return {"ok": True}


@router.put("/children/{child_id}/levels")
async def set_level(child_id: str, body: LevelIn, access: Access):
    if body.domain_id not in DOMAIN_IDS:
        raise HTTPException(400, "Domaine inconnu")
    prev = access[1]["levels"].get(body.domain_id, 1)
    entry = {"domain_id": body.domain_id, "from": prev, "to": body.level, "date": now_iso()}
    await db.children.update_one({"child_id": child_id}, {"$set": {f"levels.{body.domain_id}": body.level}, "$push": {"level_history": entry}})
    return await fetch_child(child_id)


@router.put("/children/{child_id}/quests/{quest_id}/steps/{idx}")
async def set_step(child_id: str, quest_id: Id, idx: int, body: StepIn, access: Access):
    if not 0 <= idx < 10:
        raise HTTPException(400, "Étape inconnue")
    key = f"{quest_id}:{idx}"
    prev = access[1]["quest_steps"].get(key, {}).get("status")
    delta = (XP_STEP if body.status == "fait" else 0) - (XP_STEP if prev == "fait" else 0)
    await db.children.update_one({"child_id": child_id}, {"$set": {f"quest_steps.{key}": {"status": body.status, "date": now_iso()}}, "$inc": {"xp": delta}})
    return await fetch_child(child_id)


# ---------- Quêtes personnalisées ----------
@router.post("/children/{child_id}/quests")
async def save_quest(child_id: str, body: QuestIn, _: Access):
    await store_quest(child_id, body)
    return await fetch_child(child_id)


@router.delete("/children/{child_id}/quests/{quest_id}")
async def delete_quest(child_id: str, quest_id: Id, access: Owner):
    child = access[1]
    keys = [k for k in child.get("quest_steps", {}) if k.startswith(f"{quest_id}:")]
    done = sum(child["quest_steps"][k].get("status") == "fait" for k in keys)
    update: dict = {"$pull": {"custom_quests": {"id": quest_id}}, "$inc": {"xp": -min(done * XP_STEP, child["xp"])}}
    if keys:
        update["$unset"] = {f"quest_steps.{k}": "" for k in keys}
    await db.children.update_one({"child_id": child_id}, update)
    return await fetch_child(child_id)


# ---------- Observations ----------
@router.get("/children/{child_id}/observations")
async def list_obs(child_id: str, _: Access, domain_id: str | None = None):
    q = {"child_id": child_id, **({"domain_id": domain_id} if domain_id else {})}
    return await db.observations.find(q, {"_id": 0}).sort("date", -1).to_list(1000)


@router.post("/children/{child_id}/observations")
async def create_obs(child_id: str, body: ObservationIn, access: Access):
    doc = {"obs_id": new_id("obs"), "child_id": child_id, **body.model_dump(), "author": access[0]["name"], "created_at": now_iso()}
    await db.observations.insert_one(doc)
    await db.children.update_one({"child_id": child_id}, {"$inc": {"xp": XP_OBS}})
    doc.pop("_id", None)
    return doc


@router.put("/children/{child_id}/observations/{obs_id}")
async def update_obs(child_id: str, obs_id: str, body: ObservationIn, _: Access):
    doc = await db.observations.find_one_and_update(
        {"obs_id": obs_id, "child_id": child_id}, {"$set": body.model_dump()}, projection={"_id": 0}, return_document=True
    )
    if not doc:
        raise HTTPException(404, "Observation introuvable")
    return doc


@router.delete("/children/{child_id}/observations/{obs_id}")
async def delete_obs(child_id: str, obs_id: str, _: Access):
    if (await db.observations.delete_one({"obs_id": obs_id, "child_id": child_id})).deleted_count:
        await db.children.update_one({"child_id": child_id, "xp": {"$gte": XP_OBS}}, {"$inc": {"xp": -XP_OBS}})
    return {"ok": True}


# ---------- Partage ----------
async def set_shares(child_id: str, shares: list[dict]) -> dict:
    await db.children.update_one({"child_id": child_id}, {"$set": {"shares": shares}})
    return await fetch_child(child_id)


@router.post("/children/{child_id}/shares")
async def add_share(child_id: str, body: ShareIn, access: Owner):
    user, child = access
    email = body.email.lower()
    if email == user["email"].lower():
        raise HTTPException(400, "Vous êtes déjà propriétaire de ce profil")
    return await set_shares(child_id, [x for x in child.get("shares", []) if x["email"] != email] + [{"email": email, "role": body.role, "date": now_iso()}])


@router.delete("/children/{child_id}/shares/{email}")
async def remove_share(child_id: str, email: str, access: Owner):
    return await set_shares(child_id, [x for x in access[1].get("shares", []) if x["email"] != email.lower()])


# ---------- Notes ----------
async def own_note(user: dict, child_id: str, note_id: str) -> dict:
    note = await db.child_notes.find_one({"note_id": note_id, "child_id": child_id}, {"_id": 0})
    if not note:
        raise HTTPException(404, "Note introuvable")
    if note["author_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(403, "Seul l'auteur ou l'administrateur peut modifier cette note")
    return note


@router.get("/children/{child_id}/notes")
async def list_notes(child_id: str, _: Access):
    return await db.child_notes.find({"child_id": child_id}, {"_id": 0}).sort("created_at", -1).to_list(500)


@router.post("/children/{child_id}/notes")
async def create_note(child_id: str, body: NoteIn, access: Access):
    user = access[0]
    doc = {
        "note_id": new_id("note"),
        "child_id": child_id,
        "text": body.text.strip(),
        "author_id": user["user_id"],
        "author_name": user["name"],
        "created_at": now_iso(),
        "updated_at": None,
    }
    await db.child_notes.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/children/{child_id}/notes/{note_id}")
async def update_note(child_id: str, note_id: str, body: NoteIn, access: Access):
    await own_note(access[0], child_id, note_id)
    await db.child_notes.update_one({"note_id": note_id}, {"$set": {"text": body.text.strip(), "updated_at": now_iso()}})
    return await db.child_notes.find_one({"note_id": note_id}, {"_id": 0})


@router.delete("/children/{child_id}/notes/{note_id}")
async def delete_note(child_id: str, note_id: str, access: Access):
    await own_note(access[0], child_id, note_id)
    await db.child_notes.delete_one({"note_id": note_id})
    return {"ok": True}
