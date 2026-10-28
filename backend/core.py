"""Base commune : connexion MongoDB, constantes, journal d'audit."""

import os
import sys
import uuid
from datetime import datetime, UTC
from pathlib import Path
from typing import Annotated

from dotenv import load_dotenv
from fastapi import Request
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import Field

load_dotenv(Path(__file__).parent / ".env")

MONGO_URL = os.environ.get("MONGO_URL", "").strip()
if not MONGO_URL:
    sys.exit("ERREUR DE CONFIGURATION : MONGO_URL est vide. Ajoutez l'adresse mongodb+srv://… de MongoDB Atlas dans Render → enfance-plus-api → Environment.")
db = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=10_000)[os.environ.get("DB_NAME", "enfance_plus")]

DOMAIN_IDS = ["emotionnel", "social", "cognitif", "scolaire", "sante", "autonomie", "environnement"]
DEFAULT_LEVELS = {"emotionnel": 2, "social": 3, "cognitif": 3, "scolaire": 3, "sante": 3, "autonomie": 2, "environnement": 4}
XP_STEP, XP_OBS = 50, 10
# Images d'illustration (hébergées chez Emergent pour l'instant)
IMG = "https://static.prod-images.emergentagent.com/jobs/5a8bc270-5ed8-4704-a01d-2ff7d09abd2b/images/"

Email = Annotated[str, Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=254)]
Id = Annotated[str, Field(pattern=r"^[\w-]{1,64}$")]  # identifiant sûr (pas de « . » ni « $ » dans les clés Mongo)


def now_iso() -> str:
    return datetime.now(UTC).isoformat()


def new_id(prefix: str = "") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}" if prefix else uuid.uuid4().hex


def client_ip(request: Request) -> str | None:
    fwd = request.headers.get("x-forwarded-for", "")
    return fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else None)


async def audit(user: dict | None, action: str, child_id: str | None = None, detail: str = "", request: Request | None = None):
    u = user or {}
    await db.audit_logs.insert_one(
        {
            "log_id": new_id(),
            "at": now_iso(),
            "action": action,
            "child_id": child_id,
            "detail": detail[:300],
            "user_id": u.get("user_id"),
            "user_email": u.get("email"),
            "role": u.get("role"),
            "ip": client_ip(request) if request else None,
        }
    )


async def fetch_child(child_id: str) -> dict | None:
    return await db.children.find_one({"child_id": child_id}, {"_id": 0})
