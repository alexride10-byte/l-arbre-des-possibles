"""Comptes, sessions et rôles. Pas d'envoi d'e-mail : l'administrateur valide les comptes
et crée les liens de réinitialisation de mot de passe."""

import hashlib
import os
import secrets
from datetime import datetime, timedelta, UTC
from typing import Annotated, Literal

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field
from pymongo.errors import DuplicateKeyError

from core import Email, audit, client_ip, db, new_id, now_iso

router = APIRouter()

# Mode « sans connexion » (tout le monde admin) : uniquement en local, jamais sur Render.
AUTH_ENABLED = os.environ.get("AUTH_ENABLED", "true").lower() != "false" or bool(os.environ.get("RENDER"))
DEMO_USER = {"user_id": "demo-user", "email": "demo@enfanceplus.local", "name": "Mode démo", "picture": None, "audience": "pro"}
SESSION_DAYS = 7
MAX_ATTEMPTS, LOCK_MINUTES = 5, 15
Password = Annotated[str, Field(min_length=8, max_length=128)]


# ---------- Outils ----------
def public_user(u: dict) -> dict:
    return {k: v for k, v in u.items() if k not in ("password_hash", "_id")}


def token_hash(token: str) -> str:
    """Jetons de session / réinitialisation : seule leur empreinte est stockée en base."""
    return hashlib.sha256(token.encode()).hexdigest()


def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def verify_password(p: str, h: str | None) -> bool:
    try:
        return bool(h) and bcrypt.checkpw(p.encode(), h.encode())
    except ValueError:
        return False


def utc(d: datetime) -> datetime:
    return d if d.tzinfo else d.replace(tzinfo=UTC)


def read_token(request: Request) -> str | None:
    auth = request.headers.get("Authorization", "")
    return (auth[7:] if auth.startswith("Bearer ") else None) or request.cookies.get("session_token")


async def open_session(response: Response, user_id: str, request: Request) -> str:
    token = secrets.token_urlsafe(32)
    await db.user_sessions.insert_one(
        {
            "session_id": new_id()[:12],
            "user_id": user_id,
            "session_token": token_hash(token),
            "expires_at": datetime.now(UTC) + timedelta(days=SESSION_DAYS),
            "created_at": now_iso(),
            "user_agent": request.headers.get("user-agent", "")[:160],
            "ip": client_ip(request),
        }
    )
    response.set_cookie("session_token", token, httponly=True, secure=True, samesite="none", path="/", max_age=SESSION_DAYS * 86400)
    return token


async def issue_reset_link(user: dict) -> str:
    token = secrets.token_urlsafe(32)
    await db.email_tokens.insert_one(
        {"token": token_hash(token), "user_id": user["user_id"], "kind": "reset", "used": False, "expires_at": datetime.now(UTC) + timedelta(hours=24)}
    )
    return f"/reinitialiser?token={token}"


# ---------- Dépendances FastAPI ----------
async def any_user(request: Request) -> dict:
    """Utilisateur connecté, même en attente de validation."""
    if not AUTH_ENABLED:
        if not await db.users.find_one({"user_id": DEMO_USER["user_id"]}):
            await db.users.insert_one({**DEMO_USER, "created_at": now_iso()})
        user = await db.users.find_one({"user_id": DEMO_USER["user_id"]}, {"_id": 0})
        return {**public_user(user), "role": "admin", "status": "active", "email_verified": True, "auth_enabled": False}
    token = read_token(request)
    if not token:
        raise HTTPException(401, "Non authentifié")
    session = await db.user_sessions.find_one({"session_token": token_hash(token)}, {"_id": 0})
    if not session:
        raise HTTPException(401, "Session invalide")
    if utc(session["expires_at"]) < datetime.now(UTC):
        raise HTTPException(401, "Session expirée")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(401, "Utilisateur introuvable")
    return {**public_user(user), "auth_enabled": True, "status": user.get("status", "pending")}


async def active_user(user: Annotated[dict, Depends(any_user)]) -> dict:
    if user["status"] != "active":
        raise HTTPException(403, "Compte en attente de validation par la structure" if user["status"] == "pending" else "Accès révoqué")
    return user


def role(*roles: str):
    async def check(user: Annotated[dict, Depends(active_user)]) -> dict:
        if user.get("role") not in roles:
            raise HTTPException(403, "Action non autorisée pour votre rôle")
        return user

    return Depends(check)


AnyUser = Annotated[dict, Depends(any_user)]
User = Annotated[dict, Depends(active_user)]
Admin = Annotated[dict, role("admin")]


# ---------- Routes /auth ----------
class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: Email
    password: Password
    accept_terms: bool


class LoginIn(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(max_length=128)


class EmailIn(BaseModel):
    email: str = Field(max_length=254)


class ResetIn(BaseModel):
    token: str = Field(max_length=200)
    password: Password


class MeIn(BaseModel):
    audience: Literal["pro", "parent"]


@router.post("/auth/register")
async def register(body: RegisterIn, request: Request):
    if not body.accept_terms:
        raise HTTPException(400, "Vous devez accepter les conditions d'utilisation")
    user = {
        "user_id": new_id("user"),
        "email": body.email.lower().strip(),
        "name": body.name.strip(),
        "picture": None,
        "password_hash": hash_password(body.password),
        "email_verified": True,
        "status": "pending",
        "role": None,
        "audience": "pro",
        "created_at": now_iso(),
    }
    try:
        await db.users.insert_one(user)
    except DuplicateKeyError:
        raise HTTPException(400, "Un compte existe déjà avec cette adresse")
    await audit(user, "auth.register", request=request)
    return {"ok": True}


@router.post("/auth/login")
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.lower().strip()
    ident = f"email:{email}"
    att = await db.login_attempts.find_one({"identifier": ident}, {"_id": 0})
    if att and datetime.fromisoformat(att["last"]) < datetime.now(UTC) - timedelta(minutes=LOCK_MINUTES):
        await db.login_attempts.delete_one({"identifier": ident})
    elif att and att.get("count", 0) >= MAX_ATTEMPTS:
        raise HTTPException(429, f"Trop de tentatives. Réessayez dans {LOCK_MINUTES} minutes.")
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(body.password, user.get("password_hash")):
        await db.login_attempts.update_one({"identifier": ident}, {"$inc": {"count": 1}, "$set": {"last": now_iso()}}, upsert=True)
        await audit({"email": email}, "auth.login_failed", request=request)
        raise HTTPException(401, "E-mail ou mot de passe incorrect")
    await db.login_attempts.delete_one({"identifier": ident})
    if user.get("status") == "revoked":
        raise HTTPException(403, "Accès révoqué")
    token = await open_session(response, user["user_id"], request)
    await audit(user, "auth.login", detail="email", request=request)
    return {**public_user(user), "session_token": token}


@router.post("/auth/forgot-password")
async def forgot_password(body: EmailIn, request: Request):
    # Ne renvoie JAMAIS de lien ici : sinon n'importe qui pourrait prendre n'importe quel compte.
    if user := await db.users.find_one({"email": body.email.lower().strip()}, {"_id": 0}):
        await audit(user, "auth.reset_requested", request=request)
    return {"ok": True}


@router.post("/auth/reset-password")
async def reset_password(body: ResetIn, request: Request):
    doc = await db.email_tokens.find_one_and_update({"token": token_hash(body.token), "kind": "reset", "used": False}, {"$set": {"used": True}})
    if not doc or utc(doc["expires_at"]) < datetime.now(UTC):
        raise HTTPException(400, "Lien invalide ou expiré")
    await db.users.update_one({"user_id": doc["user_id"]}, {"$set": {"password_hash": hash_password(body.password)}})
    await db.user_sessions.delete_many({"user_id": doc["user_id"]})
    await audit({"user_id": doc["user_id"]}, "auth.password_reset", request=request)
    return {"ok": True}


@router.get("/auth/me")
async def me(user: AnyUser):
    return user


@router.put("/auth/me")
async def update_me(body: MeIn, user: AnyUser):
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"audience": body.audience}})
    return {**user, "audience": body.audience}


def session_id(s: dict) -> str:
    return s.get("session_id") or s["session_token"][:8]


@router.get("/auth/sessions")
async def my_sessions(request: Request, user: AnyUser):
    current = token_hash(read_token(request) or "")
    rows = await db.user_sessions.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return [
        {
            "session_id": session_id(s),
            "created_at": s.get("created_at"),
            "user_agent": s.get("user_agent", ""),
            "ip": s.get("ip"),
            "current": s["session_token"] == current,
        }
        for s in rows
    ]


@router.delete("/auth/sessions/{sid}")
async def revoke_session(sid: str, request: Request, user: AnyUser):
    for s in await db.user_sessions.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(50):
        if session_id(s) == sid:
            await db.user_sessions.delete_one({"session_token": s["session_token"]})
            await audit(user, "auth.session_revoked", request=request)
    return {"ok": True}


@router.post("/auth/logout")
async def logout(request: Request, response: Response):
    if (token := read_token(request)) and (session := await db.user_sessions.find_one_and_delete({"session_token": token_hash(token)})):
        await audit(await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0}), "auth.logout", request=request)
    response.delete_cookie("session_token", path="/", secure=True, samesite="none")
    return {"ok": True}
