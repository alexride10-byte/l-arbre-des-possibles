"""Administration : comptes, attributions, journal, statistiques, contenus modifiables."""

from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, ValidationError

from auth import DEMO_USER, Admin, User, issue_reset_link, role
from core import DOMAIN_IDS, audit, db, now_iso

router = APIRouter()
Txt = Annotated[str, Field(min_length=1, max_length=400)]
Items = list[Annotated[str, Field(max_length=400)]]
NO_SECRET = {"_id": 0, "password_hash": 0}


class UserAdminIn(BaseModel):
    status: Literal["pending", "active", "revoked"] | None = None
    role: Literal["admin", "direction", "educator", "internal"] | None = None


class AssignIn(BaseModel):
    user_ids: list[str] = Field(max_length=100)


# ---------- Comptes ----------
@router.get("/admin/users")
async def admin_users(_: Admin):
    return await db.users.find({"user_id": {"$ne": DEMO_USER["user_id"]}}, NO_SECRET).sort("created_at", -1).to_list(500)


@router.put("/admin/users/{uid}")
async def admin_update_user(uid: str, body: UserAdminIn, request: Request, admin: Admin):
    if uid == admin["user_id"]:
        raise HTTPException(400, "Vous ne pouvez pas modifier votre propre compte")
    target = await db.users.find_one({"user_id": uid}, NO_SECRET)
    if not target:
        raise HTTPException(404, "Utilisateur introuvable")
    patch = body.model_dump(exclude_none=True)
    if patch.get("status") == "active" and not (patch.get("role") or target.get("role")):
        raise HTTPException(400, "Choisissez un rôle avant de valider le compte")
    await db.users.update_one({"user_id": uid}, {"$set": patch})
    if patch.get("status") in ("revoked", "pending"):
        await db.user_sessions.delete_many({"user_id": uid})
    await audit(admin, "admin.user_update", detail=f"{uid} {patch}", request=request)
    return {**target, **patch}


@router.post("/admin/users/{uid}/reset-link")
async def admin_reset_link(uid: str, request: Request, admin: Admin):
    user = await db.users.find_one({"user_id": uid}, NO_SECRET)
    if not user:
        raise HTTPException(404, "Utilisateur introuvable")
    link = await issue_reset_link(user)
    await audit(admin, "admin.reset_link", detail=user["email"], request=request)
    return {"link": link}


@router.put("/admin/children/{child_id}/assign")
async def admin_assign(child_id: str, body: AssignIn, request: Request, admin: Admin):
    child = await db.children.find_one_and_update({"child_id": child_id}, {"$set": {"assigned": body.user_ids}}, projection={"_id": 0}, return_document=True)
    if not child:
        raise HTTPException(404, "Profil introuvable")
    await audit(admin, "admin.assign", child_id, ",".join(body.user_ids), request)
    return child


@router.get("/admin/audit")
async def admin_audit(_: Admin, limit: int = 200):
    return await db.audit_logs.find({}, {"_id": 0}).sort("at", -1).to_list(max(1, min(limit, 1000)))


@router.get("/internal/stats")
async def internal_stats(_: Annotated[dict, role("internal", "admin")]):
    async def count_by(field: str) -> dict:
        return {str(r["_id"]): r["n"] async for r in db.users.aggregate([{"$group": {"_id": f"${field}", "n": {"$sum": 1}}}])}

    quests = [r async for r in db.children.aggregate([{"$project": {"n": {"$size": {"$ifNull": ["$custom_quests", []]}}}}])]
    return {
        "children": await db.children.count_documents({}),
        "observations": await db.observations.count_documents({}),
        "ai_messages": await db.ai_messages.count_documents({}),
        "custom_quests": sum(r["n"] for r in quests),
        "users_by_role": await count_by("role"),
        "users_by_status": await count_by("status"),
    }


# ---------- Contenus modifiables (textes de l'arbre) ----------
class NodeContent(BaseModel):
    id: str = Field(min_length=1, max_length=40)
    label: Txt
    kind: Literal["ressource", "competence", "difficulte", "besoin"]
    note: str = Field(max_length=400)


class DomainContent(BaseModel):
    model_config = {"extra": "ignore"}
    id: str
    name: str = Field(min_length=1, max_length=80)
    intro: str = Field(max_length=1000)
    nodes: list[NodeContent] = Field(min_length=1, max_length=4)
    strengths: Items = []
    fragilities: Items = []
    pistes: Items = []
    resources: Items = []


class FragilityContent(BaseModel):
    model_config = {"extra": "ignore"}
    id: str
    label: str = Field(min_length=1, max_length=80)
    intro: str = Field(max_length=1000)
    hypotheses: Items = []
    interventions: Items = []


class FactorContent(BaseModel):
    model_config = {"extra": "ignore"}
    id: str
    label: str = Field(min_length=1, max_length=80)
    description: str = Field(max_length=1000)
    hypotheses: Items = []
    resources: Items = []
    actions: Items = []
    indicators: Items = []


class RootsContent(BaseModel):
    id: str
    labels: list[Annotated[str, Field(min_length=1, max_length=80, pattern=r"\S")]] = Field(min_length=5, max_length=5)


class ContentIn(BaseModel):
    data: dict


CONTENT = {  # type → (modèle, identifiants autorisés)
    "domain": (DomainContent, DOMAIN_IDS),
    "fragility": (FragilityContent, ["f-anxiete", "f-impulsivite", "f-concentration", "f-sommeil", "f-regulation", "f-conflits"]),
    "factor": (FactorContent, ["famille", "relations", "ecole", "repos", "evenements", "protection"]),
    "roots": (RootsContent, ["all"]),
}


def content_model(kind: str, item_id: str) -> type[BaseModel]:
    model, ids = CONTENT.get(kind, (None, []))
    if item_id not in ids:
        raise HTTPException(400, "Contenu inconnu")
    return model


@router.get("/content")
async def list_content(_: User):
    return await db.content.find({}, {"_id": 0}).to_list(200)


@router.put("/admin/content/{kind}/{item_id}")
async def save_content(kind: str, item_id: str, body: ContentIn, request: Request, admin: Admin):
    model = content_model(kind, item_id)
    try:
        data = model(**body.data).model_dump()
    except (ValidationError, TypeError):
        raise HTTPException(400, "Contenu incomplet ou invalide (nom et sous-branches obligatoires)")
    if data["id"] != item_id:
        raise HTTPException(400, "Identifiant incohérent")
    doc = {"kind": kind, "item_id": item_id, "data": data, "updated_at": now_iso(), "updated_by": admin["name"]}
    await db.content.update_one({"kind": kind, "item_id": item_id}, {"$set": doc}, upsert=True)
    await audit(admin, "content.update", detail=f"{kind}:{item_id}", request=request)
    return doc


@router.delete("/admin/content/{kind}/{item_id}")
async def reset_content(kind: str, item_id: str, request: Request, admin: Admin):
    content_model(kind, item_id)
    await db.content.delete_one({"kind": kind, "item_id": item_id})
    await audit(admin, "content.reset", detail=f"{kind}:{item_id}", request=request)
    return {"ok": True}
