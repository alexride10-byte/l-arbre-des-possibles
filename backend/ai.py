"""Appels à Google Gemini (clé gratuite sur https://aistudio.google.com/apikey).

Remplace la librairie privée « emergentintegrations » : on parle directement
à l'API REST de Gemini avec httpx, déjà utilisé par le serveur.
"""

import json
import os
from collections.abc import AsyncIterator

import httpx

API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
TEXT_MODEL = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")
IMAGE_MODEL = os.environ.get("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image")
BASE = "https://generativelanguage.googleapis.com/v1beta/models"


class AiError(Exception):
    """Erreur affichable telle quelle à l'utilisateur."""


def enabled() -> bool:
    return bool(API_KEY)


def _body(system: str | None, prompt: str, images: list[tuple[str, str]], config: dict) -> dict:
    parts: list[dict] = [{"text": prompt}] + [{"inlineData": {"mimeType": m, "data": d}} for m, d in images]
    body: dict = {"contents": [{"role": "user", "parts": parts}], "generationConfig": config}
    if system:
        body["systemInstruction"] = {"parts": [{"text": system}]}
    return body


def _check(r: httpx.Response):
    if r.status_code == 200:
        return
    if r.status_code == 429:
        raise AiError("Quota gratuit de l'IA atteint pour le moment, réessayez dans une minute.")
    if r.status_code in (401, 403):
        raise AiError("Clé Gemini invalide : vérifiez GEMINI_API_KEY sur Render.")
    raise AiError(f"L'IA a répondu une erreur ({r.status_code}), réessayez.")


async def _post(model: str, body: dict, timeout: float = 60) -> dict:
    if not enabled():
        raise AiError("L'IA n'est pas configurée : ajoutez GEMINI_API_KEY sur Render.")
    async with httpx.AsyncClient(timeout=timeout) as http:
        r = await http.post(f"{BASE}/{model}:generateContent", json=body, headers={"x-goog-api-key": API_KEY})
    _check(r)
    return r.json()


def _parts(data: dict) -> list[dict]:
    try:
        return data["candidates"][0]["content"]["parts"]
    except (KeyError, IndexError):
        raise AiError("L'IA n'a rien renvoyé (contenu filtré ?), reformulez la demande.")


async def generate_text(system: str | None, prompt: str, json_output: bool = False) -> str:
    config = {"responseMimeType": "application/json"} if json_output else {}
    data = await _post(TEXT_MODEL, _body(system, prompt, [], config))
    return "".join(p.get("text", "") for p in _parts(data))


async def stream_text(system: str | None, prompt: str) -> AsyncIterator[str]:
    if not enabled():
        raise AiError("L'IA n'est pas configurée : ajoutez GEMINI_API_KEY sur Render.")
    url = f"{BASE}/{TEXT_MODEL}:streamGenerateContent?alt=sse"
    async with httpx.AsyncClient(timeout=httpx.Timeout(120, connect=15)) as http:
        async with http.stream("POST", url, json=_body(system, prompt, [], {}), headers={"x-goog-api-key": API_KEY}) as r:
            if r.status_code != 200:
                await r.aread()
                _check(r)
            async for line in r.aiter_lines():
                if not line.startswith("data:"):
                    continue
                try:
                    chunk = json.loads(line[5:].strip())
                    for p in chunk["candidates"][0]["content"]["parts"]:
                        if p.get("text"):
                            yield p["text"]
                except (ValueError, KeyError, IndexError):
                    continue


async def generate_image(prompt: str, images: tuple[tuple[str, str], ...] = ()) -> tuple[str, str]:
    """Renvoie (mime_type, données base64) de la première image produite."""
    data = await _post(IMAGE_MODEL, _body(None, prompt, images, {"responseModalities": ["TEXT", "IMAGE"]}), timeout=120)
    for p in _parts(data):
        img = p.get("inlineData") or p.get("inline_data")
        if img and img.get("data"):
            return img.get("mimeType") or img.get("mime_type") or "image/png", img["data"]
    raise AiError("Aucune image générée. La génération d'images peut ne pas être incluse dans l'offre gratuite de Gemini.")
