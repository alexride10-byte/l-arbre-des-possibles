import os
import json
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Literal, Optional

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

import base64
import secrets

import bcrypt
import httpx
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from fastapi.responses import StreamingResponse, Response as RawResponse
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
    portrait: Optional[str] = None


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
EMAIL_SIMULATED = os.environ["EMAIL_MODE"] == "simulated"
DEMO_USER = {"user_id": "demo-user", "email": "demo@enfanceplus.local", "name": "Mode démo", "picture": None, "audience": "pro"}
ROLES = ["admin", "direction", "educator", "internal"]
SESSION_DAYS = 7


def public_user(u: dict) -> dict:
    return {k: v for k, v in u.items() if k not in ("password_hash", "_id")}


async def audit(user: Optional[dict], action: str, child_id: Optional[str] = None, detail: str = "", request: Optional[Request] = None):
    await db.audit_logs.insert_one({
        "log_id": uuid.uuid4().hex, "at": now_iso(), "action": action, "child_id": child_id, "detail": detail[:300],
        "user_id": (user or {}).get("user_id"), "user_email": (user or {}).get("email"), "role": (user or {}).get("role"),
        "ip": request.client.host if request and request.client else None})


def read_token(request: Request) -> Optional[str]:
    auth = request.headers.get("Authorization", "")
    return request.cookies.get("session_token") or (auth[7:] if auth.startswith("Bearer ") else None)


async def current_user(request: Request, require_active: bool = True) -> dict:
    if not AUTH_ENABLED:
        user = await db.users.find_one({"user_id": DEMO_USER["user_id"]}, {"_id": 0})
        if not user:
            await db.users.insert_one({**DEMO_USER, "created_at": now_iso()})
            user = await db.users.find_one({"user_id": DEMO_USER["user_id"]}, {"_id": 0})
        return {**public_user(user), "role": "admin", "status": "active", "email_verified": True, "auth_enabled": False}
    token = read_token(request)
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
    user = {**public_user(user), "auth_enabled": True, "status": user.get("status", "pending")}
    if require_active and user["status"] != "active":
        raise HTTPException(403, "Compte en attente de validation par la structure" if user["status"] == "pending" else "Accès révoqué")
    return user


def require_role(user: dict, *roles: str):
    if user.get("role") not in roles:
        raise HTTPException(403, "Action non autorisée pour votre rôle")


async def open_session(response: Response, user_id: str, request: Request, token: Optional[str] = None) -> str:
    token = token or secrets.token_urlsafe(32)
    await db.user_sessions.insert_one({"session_id": uuid.uuid4().hex[:12], "user_id": user_id, "session_token": token,
                                       "expires_at": datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS), "created_at": now_iso(),
                                       "user_agent": request.headers.get("user-agent", "")[:160], "ip": request.client.host if request.client else None})
    response.set_cookie("session_token", token, httponly=True, secure=True, samesite="none", path="/", max_age=SESSION_DAYS * 24 * 3600)
    return token


def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def verify_password(p: str, h: str) -> bool:
    return bcrypt.checkpw(p.encode(), h.encode())


async def issue_email_token(user: dict, kind: Literal["verify", "reset"]) -> Optional[str]:
    token = secrets.token_urlsafe(32)
    await db.email_tokens.insert_one({"token": token, "user_id": user["user_id"], "kind": kind, "used": False,
                                      "expires_at": datetime.now(timezone.utc) + timedelta(hours=24 if kind == "verify" else 1)})
    path = "verifier" if kind == "verify" else "reinitialiser"
    link = f"/{path}?token={token}"
    await db.outbox.insert_one({"to": user["email"], "kind": kind, "link": link, "created_at": now_iso()})
    return link if EMAIL_SIMULATED else None


async def consume_email_token(token: str, kind: str) -> dict:
    doc = await db.email_tokens.find_one({"token": token, "kind": kind, "used": False}, {"_id": 0})
    exp = doc and (doc["expires_at"] if doc["expires_at"].tzinfo else doc["expires_at"].replace(tzinfo=timezone.utc))
    if not doc or exp < datetime.now(timezone.utc):
        raise HTTPException(400, "Lien invalide ou expiré")
    await db.email_tokens.update_one({"token": token}, {"$set": {"used": True}})
    return doc


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=8, max_length=128)
    accept_terms: bool


class LoginIn(BaseModel):
    email: str
    password: str


class EmailIn(BaseModel):
    email: str


class ResetIn(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=128)


class TokenIn(BaseModel):
    token: str


@api.post("/auth/register")
async def register(body: RegisterIn, request: Request):
    if not body.accept_terms:
        raise HTTPException(400, "Vous devez accepter les conditions d'utilisation")
    email = body.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Un compte existe déjà avec cette adresse")
    user = {"user_id": f"user_{uuid.uuid4().hex[:12]}", "email": email, "name": body.name.strip(), "picture": None,
            "password_hash": hash_password(body.password), "email_verified": False, "status": "pending", "role": None,
            "audience": "pro", "created_at": now_iso()}
    await db.users.insert_one(user)
    await audit(user, "auth.register", request=request)
    return {"ok": True, "simulated_link": await issue_email_token(user, "verify")}


@api.post("/auth/verify-email")
async def verify_email(body: TokenIn, request: Request):
    doc = await consume_email_token(body.token, "verify")
    await db.users.update_one({"user_id": doc["user_id"]}, {"$set": {"email_verified": True}})
    await audit({"user_id": doc["user_id"]}, "auth.email_verified", request=request)
    return {"ok": True}


@api.post("/auth/resend-verification")
async def resend_verification(body: EmailIn):
    user = await db.users.find_one({"email": body.email.lower().strip(), "email_verified": False}, {"_id": 0})
    return {"ok": True, "simulated_link": await issue_email_token(user, "verify") if user else None}


@api.post("/auth/login")
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.lower().strip()
    ident = f"{request.client.host if request.client else ''}:{email}"
    att = await db.login_attempts.find_one({"identifier": ident}, {"_id": 0})
    if att and att.get("count", 0) >= 5 and datetime.fromisoformat(att["last"]) > datetime.now(timezone.utc) - timedelta(minutes=15):
        raise HTTPException(429, "Trop de tentatives. Réessayez dans 15 minutes.")
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not user.get("password_hash") or not verify_password(body.password, user["password_hash"]):
        await db.login_attempts.update_one({"identifier": ident}, {"$inc": {"count": 1}, "$set": {"last": now_iso()}}, upsert=True)
        await audit({"email": email}, "auth.login_failed", request=request)
        raise HTTPException(401, "E-mail ou mot de passe incorrect")
    await db.login_attempts.delete_one({"identifier": ident})
    if not user.get("email_verified"):
        raise HTTPException(403, "Adresse e-mail non vérifiée")
    if user.get("status") == "revoked":
        raise HTTPException(403, "Accès révoqué")
    token = await open_session(response, user["user_id"], request)
    await audit(user, "auth.login", detail="email", request=request)
    return {**public_user(user), "session_token": token}


@api.post("/auth/forgot-password")
async def forgot_password(body: EmailIn, request: Request):
    user = await db.users.find_one({"email": body.email.lower().strip()}, {"_id": 0})
    link = await issue_email_token(user, "reset") if user else None
    if user:
        await audit(user, "auth.reset_requested", request=request)
    return {"ok": True, "simulated_link": link}


@api.post("/auth/reset-password")
async def reset_password(body: ResetIn, request: Request):
    doc = await consume_email_token(body.token, "reset")
    await db.users.update_one({"user_id": doc["user_id"]}, {"$set": {"password_hash": hash_password(body.password), "email_verified": True}})
    await db.user_sessions.delete_many({"user_id": doc["user_id"]})
    await audit({"user_id": doc["user_id"]}, "auth.password_reset", request=request)
    return {"ok": True}


@api.post("/auth/session")
async def create_session(body: SessionIn, request: Request, response: Response):
    async with httpx.AsyncClient(timeout=15) as http:
        r = await http.get(AUTH_URL, headers={"X-Session-ID": body.session_id})
    if r.status_code != 200:
        raise HTTPException(401, "Session Google invalide")
    data = r.json()
    email = data["email"].lower()
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": data["name"], "picture": data.get("picture"), "email_verified": True}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({"user_id": user_id, "email": email, "name": data["name"], "picture": data.get("picture"),
                                   "email_verified": True, "status": "pending", "role": None, "audience": "pro", "created_at": now_iso()})
    token = await open_session(response, user_id, request, data["session_token"])
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    await audit(user, "auth.login", detail="google", request=request)
    return {**public_user(user), "session_token": token}


@api.get("/auth/me")
async def me(request: Request):
    return await current_user(request, require_active=False)


@api.put("/auth/me")
async def update_me(body: MeIn, request: Request):
    user = await current_user(request, require_active=False)
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"audience": body.audience}})
    return {**user, "audience": body.audience}


@api.get("/auth/sessions")
async def my_sessions(request: Request):
    user = await current_user(request, require_active=False)
    token = read_token(request)
    rows = await db.user_sessions.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return [{"session_id": s.get("session_id") or s["session_token"][:8], "created_at": s.get("created_at"), "user_agent": s.get("user_agent", ""),
             "ip": s.get("ip"), "current": s["session_token"] == token} for s in rows]


@api.delete("/auth/sessions/{sid}")
async def revoke_session(sid: str, request: Request):
    user = await current_user(request, require_active=False)
    rows = await db.user_sessions.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(50)
    for s in rows:
        if (s.get("session_id") or s["session_token"][:8]) == sid:
            await db.user_sessions.delete_one({"session_token": s["session_token"]})
            await audit(user, "auth.session_revoked", request=request)
    return {"ok": True}


@api.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = read_token(request)
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/", secure=True, samesite="none")
    return {"ok": True}


# ---------- Administration ----------
class UserAdminIn(BaseModel):
    status: Optional[Literal["pending", "active", "revoked"]] = None
    role: Optional[Literal["admin", "direction", "educator", "internal"]] = None


class AssignIn(BaseModel):
    user_ids: list[str]


@api.get("/admin/users")
async def admin_users(request: Request):
    require_role(await current_user(request), "admin")
    users = await db.users.find({"user_id": {"$ne": DEMO_USER["user_id"]}}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)
    return users


@api.put("/admin/users/{uid}")
async def admin_update_user(uid: str, body: UserAdminIn, request: Request):
    admin = await current_user(request)
    require_role(admin, "admin")
    if uid == admin["user_id"]:
        raise HTTPException(400, "Vous ne pouvez pas modifier votre propre compte")
    patch = body.model_dump(exclude_none=True)
    if patch.get("status") == "active" and not (patch.get("role") or (await db.users.find_one({"user_id": uid}) or {}).get("role")):
        raise HTTPException(400, "Choisissez un rôle avant de valider le compte")
    res = await db.users.update_one({"user_id": uid}, {"$set": patch})
    if not res.matched_count:
        raise HTTPException(404, "Utilisateur introuvable")
    if patch.get("status") in ("revoked", "pending"):
        await db.user_sessions.delete_many({"user_id": uid})
    await audit(admin, "admin.user_update", detail=f"{uid} {patch}", request=request)
    return await db.users.find_one({"user_id": uid}, {"_id": 0, "password_hash": 0})


@api.put("/admin/children/{child_id}/assign")
async def admin_assign(child_id: str, body: AssignIn, request: Request):
    admin = await current_user(request)
    require_role(admin, "admin")
    res = await db.children.update_one({"child_id": child_id}, {"$set": {"assigned": body.user_ids}})
    if not res.matched_count:
        raise HTTPException(404, "Profil introuvable")
    await audit(admin, "admin.assign", child_id, ",".join(body.user_ids), request)
    return await db.children.find_one({"child_id": child_id}, {"_id": 0})


@api.get("/admin/audit")
async def admin_audit(request: Request, limit: int = 200):
    require_role(await current_user(request), "admin")
    return await db.audit_logs.find({}, {"_id": 0}).sort("at", -1).to_list(min(limit, 1000))


@api.get("/internal/stats")
async def internal_stats(request: Request):
    require_role(await current_user(request), "internal", "admin")
    by = lambda field: db.users.aggregate([{"$group": {"_id": f"${field}", "n": {"$sum": 1}}}]).to_list(20)
    return {"children": await db.children.count_documents({}), "observations": await db.observations.count_documents({}),
            "ai_messages": await db.ai_messages.count_documents({}), "custom_quests": sum([len(c.get("custom_quests", [])) async for c in db.children.find({}, {"custom_quests": 1})]),
            "users_by_role": {str(r["_id"]): r["n"] for r in await by("role")}, "users_by_status": {str(r["_id"]): r["n"] for r in await by("status")}}


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
        "assigned": [],
        "custom_quests": [],
        "avatar_history": [],
        "xp": 0,
        "created_at": now_iso(),
    }


# ---------- Children ----------
def can_read(user: dict, child: dict) -> bool:
    role = user.get("role")
    if role in ("admin", "direction"):
        return True
    if role != "educator":
        return False
    return (child["user_id"] == user["user_id"] or user["user_id"] in child.get("assigned", [])
            or user["email"].lower() in [x["email"] for x in child.get("shares", [])])


async def get_child(request: Request, child_id: str) -> tuple[dict, dict]:
    user = await current_user(request)
    child = await db.children.find_one({"child_id": child_id}, {"_id": 0})
    if not child or not can_read(user, child):
        raise HTTPException(404, "Profil introuvable")
    if request.method != "GET" and user.get("role") == "direction":
        raise HTTPException(403, "Accès en lecture seule pour la direction")
    if request.method != "GET" or request.url.path.endswith(child_id):
        await audit(user, f"{request.method} {request.url.path.replace('/api', '', 1)}", child_id, request=request)
    return user, child


async def get_owned_child(request: Request, child_id: str) -> tuple[dict, dict]:
    user, child = await get_child(request, child_id)
    if child["user_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(403, "Réservé au responsable du dossier")
    return user, child


@api.get("/children")
async def list_children(request: Request):
    user = await current_user(request)
    role = user.get("role")
    if role == "internal":
        return []
    q = {} if role in ("admin", "direction") else {"$or": [{"user_id": user["user_id"]}, {"assigned": user["user_id"]}, {"shares.email": user["email"].lower()}]}
    kids = await db.children.find(q, {"_id": 0}).sort("created_at", 1).to_list(200)
    for k in kids:
        if k["user_id"] != user["user_id"]:
            owner = await db.users.find_one({"user_id": k["user_id"]}, {"_id": 0, "name": 1})
            k["owner_name"] = (owner or {}).get("name", "Structure")
    return kids


@api.post("/children")
async def create_child(body: ChildIn, request: Request):
    user = await current_user(request)
    require_role(user, "admin", "educator")
    doc = new_child_doc(user["user_id"], body)
    if user["role"] == "educator":
        doc["assigned"] = [user["user_id"]]
    await db.children.insert_one(doc)
    await audit(user, "child.create", doc["child_id"], request=request)
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


# ---------- Avatars IA ----------
class AvatarGenIn(BaseModel):
    gender: Literal["garçon", "fille", "neutre"] = "neutre"
    hair: str = Field(default="cheveux bruns bouclés", max_length=60)
    outfit: str = Field(default="veste beige", max_length=60)
    accessory: str = Field(default="aucun", max_length=60)
    background: str = Field(default="ciel doré au coucher du soleil", max_length=80)
    expression: str = Field(default="sourire confiant", max_length=60)


@api.post("/children/{child_id}/avatar/generate")
async def generate_avatar(child_id: str, body: AvatarGenIn, request: Request):
    _, child = await get_child(request, child_id)
    prompt = (f"High quality anime manga bust portrait of a {child['age']} year old child ({body.gender}), {body.hair}, wearing {body.outfit}, "
              f"accessory: {body.accessory}, expression: {body.expression}, background: {body.background}. Cinematic glowing rim light, "
              "Makoto Shinkai style, warm and kind, centered, square composition, no text, child-friendly.")
    chat = LlmChat(api_key=LLM_KEY, session_id=f"avatar-{uuid.uuid4().hex[:8]}", system_message="You create child-friendly manga illustrations.")
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    try:
        _, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
    except Exception:
        raise HTTPException(502, "La génération d'avatar a échoué, réessayez.")
    if not images:
        raise HTTPException(502, "Aucune image générée, réessayez.")
    avatar_id = uuid.uuid4().hex
    await db.avatars.insert_one({"avatar_id": avatar_id, "child_id": child_id, "mime": images[0]["mime_type"], "data": images[0]["data"], "created_at": now_iso()})
    url = f"/api/avatars/{avatar_id}"
    await db.children.update_one({"child_id": child_id}, {"$set": {"avatar.portrait": url},
                                 "$push": {"avatar_history": {"url": url, "date": now_iso(), "xp": child["xp"]}}})
    return (await get_child(request, child_id))[1]


@api.get("/avatars/{avatar_id}")
async def serve_avatar(avatar_id: str):
    doc = await db.avatars.find_one({"avatar_id": avatar_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Avatar introuvable")
    return RawResponse(base64.b64decode(doc["data"]), media_type=doc["mime"], headers={"Cache-Control": "public, max-age=31536000"})


# ---------- Seed ----------
IMG = "https://static.prod-images.emergentagent.com/jobs/5a8bc270-5ed8-4704-a01d-2ff7d09abd2b/images/"
SEED_USERS = [
    ("admin", os.environ["ADMIN_EMAIL"], os.environ["ADMIN_PASSWORD"], "Claire Admin", "admin", "active"),
    ("educ", "educateur@enfanceplus.fr", "Educateur2026!", "Thomas Éducateur", "educator", "active"),
    ("dir", "direction@enfanceplus.fr", "Direction2026!", "Sophie Direction", "direction", "active"),
    ("interne", "interne@enfanceplus.fr", "Interne2026!", "Équipe Enfance+", "internal", "active"),
    ("attente", "attente@enfanceplus.fr", "Attente2026!", "Julie En attente", None, "pending"),
]
SEED_CHILDREN = [
    ("seed_leo", "Léo", 8, "CE2", IMG + "1428c7fbe1ac75360614c550743093fe08b975566e34aae9c837e679651a1dd9.jpeg", {"emotionnel": 2, "social": 3, "cognitif": 4, "scolaire": 3, "sante": 3, "autonomie": 2, "environnement": 4}),
    ("seed_maya", "Maya", 6, "CP", IMG + "4b9212048f0284c034eede7d1574ede0d16dd34aacffea3f9e91028a01ac4abc.jpeg", {"emotionnel": 3, "social": 4, "cognitif": 3, "scolaire": 2, "sante": 4, "autonomie": 3, "environnement": 3}),
    ("seed_noah", "Noah", 10, "CM2", IMG + "ba2413c4dcb2323fd133c9e29cadd78d02d273d89fb5ada2a9ca355155d17419.jpeg", {"emotionnel": 3, "social": 2, "cognitif": 4, "scolaire": 4, "sante": 3, "autonomie": 4, "environnement": 2}),
    ("seed_ines", "Inès", 7, "CE1", IMG + "7425f7675be258a7763c8814297f631d2b4095b0d6f90d326908bef38391b58d.jpeg", {"emotionnel": 4, "social": 3, "cognitif": 3, "scolaire": 3, "sante": 2, "autonomie": 3, "environnement": 3}),
]


@app.on_event("startup")
async def seed():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.email_tokens.create_index("token")
    for key, email, pwd, name, role, status in SEED_USERS:
        uid = f"seed_{key}"
        existing = await db.users.find_one({"email": email})
        if not existing:
            await db.users.insert_one({"user_id": uid, "email": email, "name": name, "picture": None, "password_hash": hash_password(pwd),
                                       "email_verified": True, "status": status, "role": role, "audience": "pro", "created_at": now_iso()})
        elif not verify_password(pwd, existing.get("password_hash") or hash_password("x")):
            await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(pwd)}})
    admin_id = (await db.users.find_one({"email": os.environ["ADMIN_EMAIL"]}))["user_id"]
    for cid, name, age, grade, portrait, levels in SEED_CHILDREN:
        if not await db.children.find_one({"child_id": cid}):
            doc = new_child_doc(admin_id, ChildIn(name=name, age=age, grade=grade, notes="Profil entièrement fictif (démonstration)"))
            doc.update({"child_id": cid, "levels": levels, "initial_levels": dict(levels), "xp": 120,
                        "assigned": ["seed_educ"] if cid in ("seed_leo", "seed_maya") else [], "avatar": {"face": 0, "hair": 0, "accessory": 0, "portrait": portrait}})
            await db.children.insert_one(doc)


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
