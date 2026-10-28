"""Fonctions IA (Gemini) : quête générée, assistant, avatar manga, arbre peint."""

import base64
import json
from datetime import datetime, timedelta, UTC
from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, Field

import ai
from children import Access, Owner, QuestIn, store_quest
from core import IMG, db, fetch_child, new_id, now_iso

router = APIRouter()
BASE_TREE = IMG + "b91ed0921188bc07c45d1f4fa10d15e9e892068354fddc465e9e311a685f2dfd.jpeg"


class AskIn(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    save: bool = True


class QuestGenIn(BaseModel):
    domain_id: str = Field(max_length=40)
    goal: str = Field(default="", max_length=300)


class AvatarGenIn(BaseModel):
    gender: Literal["garçon", "fille", "neutre"] = "neutre"
    hair: str = Field(default="cheveux bruns bouclés", max_length=60)
    outfit: str = Field(default="veste beige", max_length=60)
    accessory: str = Field(default="aucun", max_length=60)
    background: str = Field(default="ciel doré au coucher du soleil", max_length=80)
    expression: str = Field(default="sourire confiant", max_length=60)


async def recent_obs(child_id: str) -> list[dict]:
    return await db.observations.find({"child_id": child_id}, {"_id": 0}).sort("date", -1).to_list(30)


def system_prompt(user: dict, child: dict, obs: list[dict]) -> str:
    audience = "un parent" if user.get("audience") == "parent" else "un professionnel de l'enfance (éducateur, psychologue, enseignant)"
    levels = ", ".join(f"{k}: {v}/5" for k, v in child["levels"].items())
    obs_txt = (
        "\n".join(f"- {o['date']} [{o['domain_id']}] {o['fact']}" + (f" (contexte : {o['context']})" if o.get("context") else "") for o in obs[:30])
        or "- Aucune observation enregistrée."
    )
    return f"""Tu es l'assistant d'Enfance+, outil d'accompagnement du développement de l'enfant. Tu t'adresses à {audience}. Réponds toujours en français, de façon chaleureuse, claire et concise (markdown léger : titres courts, listes).

Enfant suivi : {child["name"]}, {child["age"]} ans, {child.get("grade") or "niveau non précisé"}. Notes : {child.get("notes") or "—"}.
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


async def ai_call(coro, fallback: str):
    """Exécute un appel IA et transforme toute erreur en message lisible (502)."""
    try:
        return await coro
    except HTTPException:
        raise
    except ai.AiError as e:
        raise HTTPException(502, str(e))
    except Exception:
        raise HTTPException(502, fallback)


# ---------- Quête générée ----------
@router.post("/children/{child_id}/quests/generate")
async def generate_quest(child_id: str, body: QuestGenIn, access: Access):
    user, child = access
    prompt = (
        f"Crée une quête d'accompagnement pour le domaine « {body.domain_id} »"
        + (f" avec cet objectif : {body.goal}" if body.goal else "")
        + '. Réponds UNIQUEMENT avec un JSON valide : {"title": "...", "term": "Court terme (2–4 semaines)" | "Moyen terme (1–3 mois)" | "Long terme (3–6 mois)", '
        '"steps": [{"title": "1 à 3 mots", "objective": "...", "action": "...", "resource": "...", "indicator": "..."}]} avec 3 ou 4 étapes concrètes et bienveillantes.'
    )
    raw = await ai_call(
        ai.generate_text(system_prompt(user, child, await recent_obs(child_id)), prompt, json_output=True), "L'IA est indisponible pour le moment, réessayez."
    )
    try:
        quest = QuestIn(**{**json.loads(raw[raw.index("{") : raw.rindex("}") + 1]), "domainId": body.domain_id})
    except Exception:
        raise HTTPException(502, "L'IA n'a pas renvoyé une quête exploitable, réessayez.")
    await store_quest(child_id, quest)
    return await fetch_child(child_id)


# ---------- Assistant ----------
@router.get("/children/{child_id}/assistant")
async def assistant_history(child_id: str, _: Access):
    return await db.ai_messages.find({"child_id": child_id}, {"_id": 0}).sort("created_at", 1).to_list(200)


@router.delete("/children/{child_id}/assistant")
async def assistant_clear(child_id: str, _: Owner):
    await db.ai_messages.delete_many({"child_id": child_id})
    return {"ok": True}


@router.post("/children/{child_id}/assistant")
async def assistant_ask(child_id: str, body: AskIn, access: Access):
    user, child = access
    history = await db.ai_messages.find({"child_id": child_id}, {"_id": 0}).sort("created_at", -1).to_list(10) if body.save else []
    transcript = "\n\n".join(f"{'Utilisateur' if m['role'] == 'user' else 'Assistant'} : {m['text']}" for m in reversed(history))
    prompt = (f"Historique récent de la conversation :\n{transcript}\n\nNouveau message : " if transcript else "") + body.message
    system = system_prompt(user, child, await recent_obs(child_id))
    sse = lambda payload: f"data: {json.dumps(payload)}\n\n"  # noqa: E731

    async def stream():
        parts: list[str] = []
        try:
            async for delta in ai.stream_text(system, prompt):
                parts.append(delta)
                yield sse({"delta": delta})
        except ai.AiError as e:
            yield sse({"error": str(e)})
        except Exception:
            yield sse({"error": "Assistant indisponible pour le moment, réessayez."})
        if (text := "".join(parts)) and body.save:
            await db.ai_messages.insert_many(
                [
                    {"msg_id": new_id(), "child_id": child_id, "role": "user", "text": body.message, "created_at": now_iso()},
                    {"msg_id": new_id(), "child_id": child_id, "role": "assistant", "text": text, "created_at": now_iso()},
                ]
            )
        yield sse({"done": True})

    return StreamingResponse(stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


# ---------- Avatars et arbre peint ----------
async def save_image(child_id: str, mime: str, data: str, kind: str = "avatar") -> str:
    img_id = new_id()
    await db.avatars.insert_one({"avatar_id": img_id, "child_id": child_id, "mime": mime, "data": data, "kind": kind, "created_at": now_iso()})
    return f"/api/avatars/{img_id}"


async def image_b64(src: str) -> tuple[str, str]:
    """(mime, base64) d'une image. Seules nos propres images sont acceptées (pas d'URL arbitraire)."""
    if src.startswith("/api/avatars/"):
        doc = await db.avatars.find_one({"avatar_id": src.rsplit("/", 1)[1]}, {"_id": 0, "data": 1, "mime": 1})
        if not doc:
            raise HTTPException(400, "Portrait introuvable")
        return doc.get("mime", "image/png"), doc["data"]
    if not src.startswith(IMG):
        raise HTTPException(400, "Image source non autorisée")
    async with httpx.AsyncClient(timeout=30) as http:
        r = await http.get(src)
    if r.status_code != 200:
        raise HTTPException(502, "Image source indisponible")
    return r.headers.get("content-type", "image/jpeg").split(";")[0], base64.b64encode(r.content).decode()


@router.post("/children/{child_id}/avatar/generate")
async def generate_avatar(child_id: str, body: AvatarGenIn, access: Access):
    child = access[1]
    prompt = (
        f"High quality anime manga bust portrait of a {child['age']} year old child ({body.gender}), {body.hair}, wearing {body.outfit}, "
        f"accessory: {body.accessory}, expression: {body.expression}, background: {body.background}. Cinematic glowing rim light, "
        "Makoto Shinkai style, warm and kind, centered, square composition, no text, child-friendly."
    )
    mime, data = await ai_call(ai.generate_image(prompt), "La génération d'avatar a échoué, réessayez.")
    url = await save_image(child_id, mime, data)
    await db.children.update_one(
        {"child_id": child_id}, {"$set": {"avatar.portrait": url}, "$push": {"avatar_history": {"url": url, "date": now_iso(), "xp": child["xp"]}}}
    )
    return await fetch_child(child_id)


@router.get("/avatars/{avatar_id}")
async def serve_avatar(avatar_id: str):
    doc = await db.avatars.find_one({"avatar_id": avatar_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Avatar introuvable")
    return Response(base64.b64decode(doc["data"]), media_type=doc["mime"], headers={"Cache-Control": "private, max-age=31536000, immutable"})


@router.post("/children/{child_id}/tree/generate")
async def generate_tree(child_id: str, access: Access):
    child = access[1]
    recent = await db.avatars.find_one({"child_id": child_id, "kind": "tree"}, {"_id": 0, "created_at": 1})
    if recent and datetime.fromisoformat(recent["created_at"]) > datetime.now(UTC) - timedelta(seconds=60):
        raise HTTPException(429, "Patientez une minute avant de repeindre l'arbre.")
    if not (portrait := (child.get("avatar") or {}).get("portrait")):
        raise HTTPException(400, "Choisissez d'abord un avatar manga pour l'enfant")
    prompt = (
        "Edit the FIRST image (a painted anime fantasy tree of life at night). Keep the exact same composition, tree shape, branch colors and positions, "
        "sky, city and camera framing unchanged. Only replace the child sitting on the rocks at the base of the trunk (lower right of the trunk) "
        "with the child from the SECOND image: same face, hair, skin tone, clothes and accessories, drawn in the same painterly anime style, "
        "sitting in the same pose and place, seen from three quarter back looking up at the tree, lit by warm golden light. No text."
    )
    images = [await image_b64(BASE_TREE), await image_b64(portrait)]
    mime, data = await ai_call(ai.generate_image(prompt, images), "La génération de l'arbre a échoué, réessayez.")
    await db.avatars.delete_many({"child_id": child_id, "kind": "tree"})
    await db.children.update_one({"child_id": child_id}, {"$set": {"tree_image": await save_image(child_id, mime, data, "tree")}})
    return await fetch_child(child_id)


@router.delete("/children/{child_id}/tree")
async def reset_tree(child_id: str, _: Access):
    await db.children.update_one({"child_id": child_id}, {"$unset": {"tree_image": ""}})
    await db.avatars.delete_many({"child_id": child_id, "kind": "tree"})
    return await fetch_child(child_id)
