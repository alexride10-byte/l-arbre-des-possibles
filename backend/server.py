import os
import json
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Literal, Optional

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

import httpx
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]
LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

app = FastAPI(title="Enfance+ API")
api = APIRouter(prefix="/api")

DOMAIN_IDS = ["emotionnel", "social", "cognitif", "scolaire", "sante", "autonomie", "environnement"]
DEFAULT_LEVELS = {"emotionnel": 2, "social": 3, "cognitif": 3, "scolaire": 3, "sante": 3, "autonomie": 2, "environnement": 4}
XP_STEP = 50
XP_OBS = 10


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- Models ----------
class Avatar(BaseModel):
    face: int = 0
    hair: int = 0
    accessory: int = 0


class ChildIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    age: int = Field(ge=0, le=21)
    grade: str = ""
    notes: str = ""
    avatar: Avatar = Avatar()


class ChildPatch(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    grade: Optional[str] = None
    notes: Optional[str] = None
    avatar: Optional[Avatar] = None


class LevelIn(BaseModel):
    domain_id: str
    level: int = Field(ge=1, le=5)


class StepIn(BaseModel):
    status: Literal["fait", "en cours", "à venir"]


class ObservationIn(BaseModel):
    domain_id: str
    date: str
    fact: str = Field(min_length=1)
    context: str = ""


class SessionIn(BaseModel):
    session_id: str


class MeIn(BaseModel):
    audience: Literal["pro", "parent"]


class AskIn(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    save: bool = True


# ---------- Auth ----------
AUTH_ENABLED = os.environ["AUTH_ENABLED"].lower() == "true"
DEMO_USER = {"user_id": "demo-user", "email": "demo@enfanceplus.local", "name": "Mode démo", "picture": None, "audience": "pro"}


async def current_user(request: Request) -> dict:
    if not AUTH_ENABLED:
        user = await db.users.find_one({"user_id": DEMO_USER["user_id"]}, {"_id": 0})
        if not user:
            await db.users.insert_one({**DEMO_USER, "created_at": now_iso()})
            user = await db.users.find_one({"user_id": DEMO_USER["user_id"]}, {"_id": 0})
        return {**user, "auth_enabled": False}
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        token = auth[7:] if auth.startswith("Bearer ") else None
    if not token:
        raise HTTPException(401, "Non authentifié")
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(401, "Session invalide")
    exp = session["expires_at"]
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc):
        raise HTTPException(401, "Session expirée")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(401, "Utilisateur introuvable")
    return user


def new_child_doc(user_id: str, data: ChildIn) -> dict:
    return {
        "child_id": f"child_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        **data.model_dump(),
        "levels": dict(DEFAULT_LEVELS),
        "initial_levels": dict(DEFAULT_LEVELS),
        "level_history": [],
        "quest_steps": {},
        "shares": [],
        "custom_quests": [],
        "xp": 0,
        "created_at": now_iso(),
    }


async def seed_demo_child(user_id: str):
    if await db.children.count_documents({"user_id": user_id}) == 0:
        doc = new_child_doc(user_id, ChildIn(name="Léo", age=8, grade="CE2", notes="Profil fictif de démonstration"))
        doc["xp"] = 120
        await db.children.insert_one(doc)


@api.post("/auth/session")
async def create_session(body: SessionIn, response: Response):
    async with httpx.AsyncClient(timeout=15) as http:
        r = await http.get(AUTH_URL, headers={"X-Session-ID": body.session_id})
    if r.status_code != 200:
        raise HTTPException(401, "Session Google invalide")
    data = r.json()
    existing = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": data["name"], "picture": data.get("picture")}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({"user_id": user_id, "email": data["email"], "name": data["name"],
                                   "picture": data.get("picture"), "audience": "pro", "created_at": now_iso()})
    await db.user_sessions.insert_one({"user_id": user_id, "session_token": data["session_token"],
                                       "expires_at": datetime.now(timezone.utc) + timedelta(days=7), "created_at": now_iso()})
    response.set_cookie("session_token", data["session_token"], httponly=True, secure=True, samesite="none",
                        path="/", max_age=7 * 24 * 3600)
    await seed_demo_child(user_id)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {**user, "session_token": data["session_token"]}


@api.get("/auth/me")
async def me(request: Request):
    user = await current_user(request)
    await seed_demo_child(user["user_id"])
    return user


@api.put("/auth/me")
async def update_me(body: MeIn, request: Request):
    user = await current_user(request)
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"audience": body.audience}})
    return {**user, "audience": body.audience}


@api.post("/auth/logout")
async def logout(request: Request, response: Response):
    auth = request.headers.get("Authorization", "")
    token = request.cookies.get("session_token") or (auth[7:] if auth.startswith("Bearer ") else None)
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/", secure=True, samesite="none")
    return {"ok": True}


# ---------- Children ----------
async def get_child(request: Request, child_id: str) -> tuple[dict, dict]:
    user = await current_user(request)
    child = await db.children.find_one({"child_id": child_id}, {"_id": 0})
    shared = child and user["email"].lower() in [x["email"] for x in child.get("shares", [])]
    if not child or (child["user_id"] != user["user_id"] and not shared):
        raise HTTPException(404, "Profil introuvable")
    return user, child


async def get_owned_child(request: Request, child_id: str) -> tuple[dict, dict]:
    user, child = await get_child(request, child_id)
    if child["user_id"] != user["user_id"]:
        raise HTTPException(403, "Réservé au propriétaire du profil")
    return user, child


@api.get("/children")
async def list_children(request: Request):
    user = await current_user(request)
    q = {"$or": [{"user_id": user["user_id"]}, {"shares.email": user["email"].lower()}]}
    kids = await db.children.find(q, {"_id": 0}).sort("created_at", 1).to_list(100)
    for k in kids:
        if k["user_id"] != user["user_id"]:
            owner = await db.users.find_one({"user_id": k["user_id"]}, {"_id": 0, "name": 1})
            k["owner_name"] = (owner or {}).get("name", "Inconnu")
    return kids


@api.post("/children")
async def create_child(body: ChildIn, request: Request):
    user = await current_user(request)
    doc = new_child_doc(user["user_id"], body)
    await db.children.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/children/{child_id}")
async def read_child(child_id: str, request: Request):
    return (await get_child(request, child_id))[1]


@api.put("/children/{child_id}")
async def update_child(child_id: str, body: ChildPatch, request: Request):
    await get_child(request, child_id)
    patch = body.model_dump(exclude_none=True)
    if patch:
        await db.children.update_one({"child_id": child_id}, {"$set": patch})
    return (await get_child(request, child_id))[1]


@api.delete("/children/{child_id}")
async def delete_child(child_id: str, request: Request):
    await get_owned_child(request, child_id)
    await db.children.delete_one({"child_id": child_id})
    await db.observations.delete_many({"child_id": child_id})
    await db.ai_messages.delete_many({"child_id": child_id})
    return {"ok": True}


@api.put("/children/{child_id}/levels")
async def set_level(child_id: str, body: LevelIn, request: Request):
    _, child = await get_child(request, child_id)
    if body.domain_id not in DOMAIN_IDS:
        raise HTTPException(400, "Domaine inconnu")
    prev = child["levels"].get(body.domain_id, 1)
    entry = {"domain_id": body.domain_id, "from": prev, "to": body.level, "date": now_iso()}
    await db.children.update_one({"child_id": child_id},
                                 {"$set": {f"levels.{body.domain_id}": body.level}, "$push": {"level_history": entry}})
    return (await get_child(request, child_id))[1]


@api.put("/children/{child_id}/quests/{quest_id}/steps/{idx}")
async def set_step(child_id: str, quest_id: str, idx: int, body: StepIn, request: Request):
    _, child = await get_child(request, child_id)
    key = f"{quest_id}:{idx}"
    prev = child["quest_steps"].get(key, {}).get("status")
    delta = (XP_STEP if body.status == "fait" else 0) - (XP_STEP if prev == "fait" else 0)
    await db.children.update_one({"child_id": child_id}, {
        "$set": {f"quest_steps.{key}": {"status": body.status, "date": now_iso()}},
        "$inc": {"xp": delta}})
    return (await get_child(request, child_id))[1]


# ---------- Observations ----------
@api.get("/children/{child_id}/observations")
async def list_obs(child_id: str, request: Request, domain_id: Optional[str] = None):
    await get_child(request, child_id)
    q = {"child_id": child_id, **({"domain_id": domain_id} if domain_id else {})}
    return await db.observations.find(q, {"_id": 0}).sort("date", -1).to_list(1000)


@api.post("/children/{child_id}/observations")
async def create_obs(child_id: str, body: ObservationIn, request: Request):
    user, _ = await get_child(request, child_id)
    doc = {"obs_id": f"obs_{uuid.uuid4().hex[:12]}", "child_id": child_id, **body.model_dump(), "author": user["name"], "created_at": now_iso()}
    await db.observations.insert_one(doc)
    await db.children.update_one({"child_id": child_id}, {"$inc": {"xp": XP_OBS}})
    doc.pop("_id", None)
    return doc


@api.put("/children/{child_id}/observations/{obs_id}")
async def update_obs(child_id: str, obs_id: str, body: ObservationIn, request: Request):
    await get_child(request, child_id)
    res = await db.observations.update_one({"obs_id": obs_id, "child_id": child_id}, {"$set": body.model_dump()})
    if not res.matched_count:
        raise HTTPException(404, "Observation introuvable")
    return await db.observations.find_one({"obs_id": obs_id}, {"_id": 0})


@api.delete("/children/{child_id}/observations/{obs_id}")
async def delete_obs(child_id: str, obs_id: str, request: Request):
    await get_child(request, child_id)
    res = await db.observations.delete_one({"obs_id": obs_id, "child_id": child_id})
    if res.deleted_count:
        await db.children.update_one({"child_id": child_id, "xp": {"$gte": XP_OBS}}, {"$inc": {"xp": -XP_OBS}})
    return {"ok": True}


# ---------- Assistant IA ----------
def system_prompt(user: dict, child: dict, obs: list[dict]) -> str:
    audience = "un parent" if user.get("audience") == "parent" else "un professionnel de l'enfance (éducateur, psychologue, enseignant)"
    levels = ", ".join(f"{k}: {v}/5" for k, v in child["levels"].items())
    obs_txt = "\n".join(f"- {o['date']} [{o['domain_id']}] {o['fact']}" + (f" (contexte : {o['context']})" if o.get("context") else "") for o in obs[:30]) or "- Aucune observation enregistrée."
    return f"""Tu es l'assistant d'Enfance+, outil d'accompagnement du développement de l'enfant. Tu t'adresses à {audience}. Réponds toujours en français, de façon chaleureuse, claire et concise (markdown léger : titres courts, listes).

Enfant suivi : {child['name']}, {child['age']} ans, {child.get('grade') or 'niveau non précisé'}. Notes : {child.get('notes') or '—'}.
Niveaux d'épanouissement estimés par l'adulte (1 à 5) : {levels}.
Observations enregistrées :
{obs_txt}

Règles impératives :
- Ne pose jamais de diagnostic. Une fragilité décrit un moment et un contexte, jamais l'enfant lui-même.
- Distingue clairement : faits observés, hypothèses à examiner, pistes d'accompagnement.
- Aucune relation présentée comme causale sans preuve. Les projections sont illustratives, jamais des prédictions.
- Propose des pistes concrètes, bienveillantes, avec un horizon (court / moyen terme) et des indicateurs d'évolution.
- Oriente vers les professionnels adaptés (médecin, psychologue, PMI, école) quand c'est pertinent.
- En cas de suspicion de danger ou de maltraitance : priorité à la sécurité, appeler le 119 (Allô Enfance en Danger) ou le 15/17 en urgence."""


# ---------- Partage ----------
class ShareIn(BaseModel):
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    role: Literal["parent", "pro"]


@api.post("/children/{child_id}/shares")
async def add_share(child_id: str, body: ShareIn, request: Request):
    user, child = await get_owned_child(request, child_id)
    email = body.email.lower()
    if email == user["email"].lower():
        raise HTTPException(400, "Vous êtes déjà propriétaire de ce profil")
    shares = [x for x in child.get("shares", []) if x["email"] != email] + [{"email": email, "role": body.role, "date": now_iso()}]
    await db.children.update_one({"child_id": child_id}, {"$set": {"shares": shares}})
    return (await get_child(request, child_id))[1]


@api.delete("/children/{child_id}/shares/{email}")
async def remove_share(child_id: str, email: str, request: Request):
    _, child = await get_owned_child(request, child_id)
    shares = [x for x in child.get("shares", []) if x["email"] != email.lower()]
    await db.children.update_one({"child_id": child_id}, {"$set": {"shares": shares}})
    return (await get_child(request, child_id))[1]


# ---------- Quêtes personnalisées ----------
class QuestStepIn(BaseModel):
    title: str = Field(min_length=1, max_length=80)
    objective: str = ""
    action: str = ""
    resource: str = ""
    indicator: str = ""


class QuestIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    domainId: str
    term: str = "Moyen terme (1–3 mois)"
    steps: list[QuestStepIn] = Field(min_length=1, max_length=6)


class QuestGenIn(BaseModel):
    domain_id: str
    goal: str = Field(default="", max_length=300)


async def store_quest(child_id: str, q: QuestIn) -> dict:
    if q.domainId not in DOMAIN_IDS:
        raise HTTPException(400, "Domaine inconnu")
    quest = {"id": f"cq_{uuid.uuid4().hex[:10]}", **q.model_dump(), "custom": True,
             "steps": [{**s.model_dump(), "status": "à venir"} for s in q.steps]}
    await db.children.update_one({"child_id": child_id}, {"$push": {"custom_quests": quest}})
    return quest


@api.post("/children/{child_id}/quests")
async def save_quest(child_id: str, body: QuestIn, request: Request):
    await get_child(request, child_id)
    await store_quest(child_id, body)
    return (await get_child(request, child_id))[1]


@api.post("/children/{child_id}/quests/generate")
async def generate_quest(child_id: str, body: QuestGenIn, request: Request):
    user, child = await get_child(request, child_id)
    obs = await db.observations.find({"child_id": child_id}, {"_id": 0}).sort("date", -1).to_list(30)
    chat = LlmChat(api_key=LLM_KEY, session_id=f"quest-{uuid.uuid4().hex[:8]}",
                   system_message=system_prompt(user, child, obs)).with_model("anthropic", "claude-sonnet-5-5")
    prompt = (f"Crée une quête d'accompagnement pour le domaine « {body.domain_id} »"
              + (f" avec cet objectif : {body.goal}" if body.goal else "")
              + '. Réponds UNIQUEMENT avec un JSON valide, sans texte autour : {"title": "...", "term": "Court terme (2–4 semaines)" | "Moyen terme (1–3 mois)" | "Long terme (3–6 mois)", '
              '"steps": [{"title": "1 à 3 mots", "objective": "...", "action": "...", "resource": "...", "indicator": "..."}]} avec 3 ou 4 étapes concrètes et bienveillantes.')
    try:
        raw = await chat.send_message(UserMessage(text=prompt))
        data = json.loads(raw[raw.index("{"): raw.rindex("}") + 1])
        quest = QuestIn(**{**data, "domainId": body.domain_id})
    except Exception:
        raise HTTPException(502, "L'IA n'a pas renvoyé une quête exploitable, réessayez.")
    await store_quest(child_id, quest)
    return (await get_child(request, child_id))[1]


@api.delete("/children/{child_id}/quests/{quest_id}")
async def delete_quest(child_id: str, quest_id: str, request: Request):
    _, child = await get_owned_child(request, child_id)
    keys = [k for k in child.get("quest_steps", {}) if k.startswith(f"{quest_id}:")]
    done = sum(1 for k in keys if child["quest_steps"][k].get("status") == "fait")
    update = {"$pull": {"custom_quests": {"id": quest_id}}, "$inc": {"xp": -min(done * XP_STEP, child["xp"])}}
    if keys:
        update["$unset"] = {f"quest_steps.{k}": "" for k in keys}
    await db.children.update_one({"child_id": child_id}, update)
    return (await get_child(request, child_id))[1]


@api.get("/children/{child_id}/assistant")
async def assistant_history(child_id: str, request: Request):
    await get_child(request, child_id)
    return await db.ai_messages.find({"child_id": child_id}, {"_id": 0}).sort("created_at", 1).to_list(200)


@api.delete("/children/{child_id}/assistant")
async def assistant_clear(child_id: str, request: Request):
    await get_owned_child(request, child_id)
    await db.ai_messages.delete_many({"child_id": child_id})
    return {"ok": True}


@api.post("/children/{child_id}/assistant")
async def assistant_ask(child_id: str, body: AskIn, request: Request):
    user, child = await get_child(request, child_id)
    obs = await db.observations.find({"child_id": child_id}, {"_id": 0}).sort("date", -1).to_list(30)
    history = await db.ai_messages.find({"child_id": child_id}, {"_id": 0}).sort("created_at", -1).to_list(10) if body.save else []
    transcript = "\n\n".join(f"{'Utilisateur' if m['role'] == 'user' else 'Assistant'} : {m['text']}" for m in reversed(history))
    prompt = (f"Historique récent de la conversation :\n{transcript}\n\nNouveau message : " if transcript else "") + body.message
    chat = LlmChat(api_key=LLM_KEY, session_id=f"{child_id}-{uuid.uuid4().hex[:6]}",
                   system_message=system_prompt(user, child, obs)).with_model("anthropic", "claude-sonnet-5-5")

    async def stream():
        parts: list[str] = []
        try:
            async for ev in chat.stream_message(UserMessage(text=prompt)):
                if isinstance(ev, TextDelta):
                    parts.append(ev.content)
                    yield f"data: {json.dumps({'delta': ev.content})}\n\n"
                elif isinstance(ev, StreamDone):
                    break
        except Exception as e:  # surfaced to the UI
            yield f"data: {json.dumps({'error': str(e)[:200]})}\n\n"
        text = "".join(parts)
        if text and body.save:
            await db.ai_messages.insert_many([
                {"msg_id": uuid.uuid4().hex, "child_id": child_id, "role": "user", "text": body.message, "created_at": now_iso()},
                {"msg_id": uuid.uuid4().hex, "child_id": child_id, "role": "assistant", "text": text, "created_at": now_iso()}])
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@api.get("/")
async def root():
    return {"app": "Enfance+", "status": "ok"}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ["CORS_ORIGINS"].split(","),
    allow_origin_regex=os.environ["CORS_ORIGIN_REGEX"],
    allow_methods=["*"],
    allow_headers=["*"],
)
