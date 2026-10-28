"""Première installation (compte administrateur), données de démonstration et index MongoDB."""

import secrets
from datetime import datetime, timedelta, UTC

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, Field
from pymongo.errors import DuplicateKeyError

from auth import Password, hash_password, open_session, public_user
from children import ChildIn, new_child_doc
from core import IMG, Email, audit, db, fetch_child, new_id, now_iso

router = APIRouter()


async def create_indexes():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.email_tokens.create_index("token")
    await db.email_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.user_sessions.create_index("session_token")
    await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)  # sessions expirées purgées par MongoDB
    await db.child_notes.create_index("child_id")
    await db.events.create_index([("child_id", 1), ("start", 1)])


class SetupIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: Email
    password: Password
    demo: bool = False


async def has_admin() -> bool:
    return bool(await db.users.find_one({"role": "admin", "status": "active"}, {"_id": 1}))


@router.get("/setup/status")
async def setup_status():
    return {"needs_setup": not await has_admin()}


@router.post("/setup")
async def setup(body: SetupIn, request: Request, response: Response):
    if await has_admin():
        raise HTTPException(403, "L'installation a déjà été effectuée")
    try:  # verrou : une seule installation possible, même en cas de double clic
        await db.app_settings.insert_one({"_id": "setup", "at": now_iso()})
    except DuplicateKeyError:
        raise HTTPException(409, "Installation déjà en cours ou terminée")
    email = body.email.lower().strip()
    user = {
        "user_id": new_id("user"),
        "email": email,
        "name": body.name.strip(),
        "picture": None,
        "password_hash": hash_password(body.password),
        "email_verified": True,
        "status": "active",
        "role": "admin",
        "audience": "pro",
        "created_at": now_iso(),
    }
    if existing := await db.users.find_one({"email": email}, {"_id": 0, "user_id": 1}):
        user["user_id"] = existing["user_id"]
        await db.users.update_one({"email": email}, {"$set": {k: v for k, v in user.items() if k != "created_at"}})
    else:
        await db.users.insert_one(user)
    if body.demo:
        await seed_demo(user["user_id"], user["name"])
    token = await open_session(response, user["user_id"], request)
    await audit(user, "setup.admin_created", detail="avec données de démo" if body.demo else "base vide", request=request)
    return {**public_user(user), "session_token": token}


# ---------- Données de démonstration (entièrement fictives) ----------
# Comptes fictifs : mot de passe aléatoire jamais communiqué, donc impossible de s'y connecter.
SEED_USERS = [
    ("educ", "educateur@enfanceplus.fr", "Thomas Éducateur", "educator", "active"),
    ("dir", "direction@enfanceplus.fr", "Sophie Direction", "direction", "active"),
    ("interne", "interne@enfanceplus.fr", "Équipe Enfance+", "internal", "active"),
    ("attente", "attente@enfanceplus.fr", "Julie En attente", None, "pending"),
]
SEED_CHILDREN = [
    (
        "seed_leo",
        "Léo",
        8,
        "CE2",
        "1428c7fbe1ac75360614c550743093fe08b975566e34aae9c837e679651a1dd9",
        {"emotionnel": 2, "social": 3, "cognitif": 4, "scolaire": 3, "sante": 3, "autonomie": 2, "environnement": 4},
    ),
    (
        "seed_maya",
        "Maya",
        6,
        "CP",
        "4b9212048f0284c034eede7d1574ede0d16dd34aacffea3f9e91028a01ac4abc",
        {"emotionnel": 3, "social": 4, "cognitif": 3, "scolaire": 2, "sante": 4, "autonomie": 3, "environnement": 3},
    ),
    (
        "seed_noah",
        "Noah",
        10,
        "CM2",
        "ba2413c4dcb2323fd133c9e29cadd78d02d273d89fb5ada2a9ca355155d17419",
        {"emotionnel": 3, "social": 2, "cognitif": 4, "scolaire": 4, "sante": 3, "autonomie": 4, "environnement": 2},
    ),
    (
        "seed_ines",
        "Inès",
        7,
        "CE1",
        "7425f7675be258a7763c8814297f631d2b4095b0d6f90d326908bef38391b58d",
        {"emotionnel": 4, "social": 3, "cognitif": 3, "scolaire": 3, "sante": 2, "autonomie": 3, "environnement": 3},
    ),
]


def fictional_history(levels: dict) -> tuple[list[dict], dict]:
    """Progression fictive sur ~10 mois pour illustrer les graphiques."""
    hist, initial, now = [], {}, datetime.now(UTC)
    for i, (dom, lvl) in enumerate(levels.items()):
        start = initial[dom] = max(1, lvl - 1 - i % 2)
        for step, months in enumerate(range(10 - i % 3, 0, -4)):
            frm = min(lvl, start + step)
            if (to := min(lvl, frm + 1)) > frm:
                hist.append({"domain_id": dom, "from": frm, "to": to, "date": (now - timedelta(days=30 * months + i * 3)).isoformat(), "fictional": True})
    return sorted(hist, key=lambda h: h["date"]), initial


async def seed_demo(admin_id: str, admin_name: str):
    for key, email, name, user_role, status in SEED_USERS:
        if not await db.users.find_one({"email": email}):
            await db.users.insert_one(
                {
                    "user_id": f"seed_{key}",
                    "email": email,
                    "name": name,
                    "picture": None,
                    "password_hash": hash_password(secrets.token_urlsafe(24)),
                    "email_verified": True,
                    "status": status,
                    "role": user_role,
                    "audience": "pro",
                    "created_at": now_iso(),
                }
            )
    for cid, name, age, grade, img, levels in SEED_CHILDREN:
        if await fetch_child(cid):
            continue
        hist, initial = fictional_history(levels)
        doc = new_child_doc(admin_id, ChildIn(name=name, age=age, grade=grade, notes="Profil entièrement fictif (démonstration)"))
        doc.update(
            {
                "child_id": cid,
                "levels": levels,
                "initial_levels": initial,
                "level_history": hist,
                "xp": 120,
                "assigned": ["seed_educ"] if cid in ("seed_leo", "seed_maya") else [],
                "avatar": {"face": 0, "hair": 0, "accessory": 0, "portrait": f"{IMG}{img}.jpeg"},
            }
        )
        await db.children.insert_one(doc)
    if await db.threads.find_one({"thread_id": "th_seed_leo"}):
        return
    msgs = [
        (admin_id, admin_name, "Bonjour Thomas, comment se passent les transitions avec le minuteur visuel ?"),
        ("seed_educ", "Thomas Éducateur", "Mieux ! Le refus dure moins longtemps cette semaine. J'ai ajouté une observation dans le dossier."),
    ]
    at = now_iso()
    await db.threads.insert_one(
        {
            "thread_id": "th_seed_leo",
            "title": "Point sur les transitions de Léo",
            "child_id": "seed_leo",
            "participants": [admin_id, "seed_educ"],
            "participant_names": [admin_name, "Thomas Éducateur"],
            "created_by": admin_id,
            "created_at": at,
            "last_at": at,
            "last_text": msgs[-1][2][:140],
            "last_author": msgs[-1][1],
            "read_by": {},
        }
    )
    await db.thread_messages.insert_many(
        [{"msg_id": new_id(), "thread_id": "th_seed_leo", "author_id": a, "author_name": n, "text": t, "created_at": now_iso()} for a, n, t in msgs]
    )
