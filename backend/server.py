"""Enfance+ — API. Démarrage : uvicorn server:app (voir render.yaml)."""

import os
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI, Request
from starlette.middleware.cors import CORSMiddleware

import admin
import ai
import assistant
import auth
import calendar_routes
import children
import install
import messages
from core import db


@asynccontextmanager
async def lifespan(_: FastAPI):
    await install.create_indexes()
    yield


app = FastAPI(title="Enfance+ API", lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)
api = APIRouter(prefix="/api")


@api.get("/")
async def health():
    await db.command("ping")  # le contrôle de santé de Render vérifie aussi la base
    return {"app": "Enfance+", "status": "ok", "ai": ai.enabled()}


for module in (auth, install, admin, children, assistant, messages, calendar_routes):
    api.include_router(module.router)
app.include_router(api)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.update(
        {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Referrer-Policy": "no-referrer",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        }
    )
    if not request.url.path.startswith("/api/avatars/"):
        response.headers.setdefault("Cache-Control", "no-store")
    return response


# Seul le site Enfance+ peut appeler l'API (adresse(s) dans CORS_ORIGINS, séparées par des virgules).
origins = [o if o.startswith("http") else f"https://{o}" for o in (x.strip().rstrip("/") for x in os.environ.get("CORS_ORIGINS", "").split(",")) if o]
if not origins:
    print("ATTENTION : CORS_ORIGINS est vide, le site ne pourra pas appeler l'API.", flush=True)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
