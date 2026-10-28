"""Tests de bout en bout lancés par GitHub (voir .github/workflows/verification.yml)."""

import os
import uuid

import requests

API = os.environ.get("API_URL", "http://localhost:8001").rstrip("/") + "/api"
ADMIN = {"name": "Admin Test", "email": f"admin_{uuid.uuid4().hex[:6]}@test.fr", "password": "MotDePasse!2026"}
S = requests.Session()


def post(path, json=None, token=None):
    return S.post(API + path, json=json or {}, headers={"Authorization": f"Bearer {token}"} if token else {})


def get(path, token=None):
    return S.get(API + path, headers={"Authorization": f"Bearer {token}"} if token else {})


def test_01_sante():
    r = get("/")
    assert r.status_code == 200 and r.json()["status"] == "ok"
    assert r.headers["X-Frame-Options"] == "DENY"


def test_02_installation_unique():
    assert get("/setup/status").json()["needs_setup"] is True
    r = post("/setup", {**ADMIN, "demo": True})
    assert r.status_code == 200, r.text
    ADMIN["token"] = r.json()["session_token"]
    assert post("/setup", {**ADMIN, "email": "autre@test.fr", "demo": False}).status_code in (403, 409)


def test_03_connexion_et_mauvais_mot_de_passe():
    assert post("/auth/login", {"email": ADMIN["email"], "password": "faux-mot-de-passe"}).status_code == 401
    r = post("/auth/login", {"email": ADMIN["email"], "password": ADMIN["password"]})
    assert r.status_code == 200
    assert get("/auth/me", r.json()["session_token"]).json()["role"] == "admin"


def test_04_mot_de_passe_oublie_ne_donne_aucun_lien():
    r = post("/auth/forgot-password", {"email": ADMIN["email"]})
    assert r.status_code == 200 and "simulated_link" not in r.json() and "link" not in r.json()


def test_05_comptes_demo_inaccessibles():
    for email, pwd in [("educateur@enfanceplus.fr", "Educateur2026!"), ("direction@enfanceplus.fr", "Direction2026!")]:
        assert post("/auth/login", {"email": email, "password": pwd}).status_code == 401


def test_06_inscription_en_attente_puis_validation():
    email = f"educ_{uuid.uuid4().hex[:6]}@test.fr"
    assert post("/auth/register", {"name": "Éduc Test", "email": email, "password": "MotDePasse!2026", "accept_terms": True}).status_code == 200
    tok = post("/auth/login", {"email": email, "password": "MotDePasse!2026"}).json()["session_token"]
    assert get("/children", tok).status_code == 403  # pas d'accès tant que l'admin n'a pas validé
    uid = get("/auth/me", tok).json()["user_id"]
    r = S.put(f"{API}/admin/users/{uid}", json={"status": "active", "role": "educator"}, headers={"Authorization": f"Bearer {ADMIN['token']}"})
    assert r.status_code == 200
    assert get("/children", tok).status_code == 200


def test_07_lien_de_reinitialisation_admin():
    email = f"reset_{uuid.uuid4().hex[:6]}@test.fr"
    post("/auth/register", {"name": "Reset Test", "email": email, "password": "MotDePasse!2026", "accept_terms": True})
    users = get("/admin/users", ADMIN["token"]).json()
    uid = next(u["user_id"] for u in users if u["email"] == email)
    link = post(f"/admin/users/{uid}/reset-link", token=ADMIN["token"]).json()["link"]
    token = link.split("token=")[1]
    assert post("/auth/reset-password", {"token": token, "password": "NouveauMdp!2026"}).status_code == 200
    assert post("/auth/reset-password", {"token": token, "password": "EncoreUn!2026"}).status_code == 400  # lien à usage unique
    assert post("/auth/login", {"email": email, "password": "NouveauMdp!2026"}).status_code == 200


def test_08_non_admin_ne_peut_pas_creer_de_lien():
    assert post("/admin/users/x/reset-link").status_code == 401


def test_09_cors_limite_au_site():
    ok = S.options(API + "/auth/me", headers={"Origin": "https://enfance-plus.onrender.com", "Access-Control-Request-Method": "GET"})
    bad = S.options(API + "/auth/me", headers={"Origin": "https://pirate.onrender.com", "Access-Control-Request-Method": "GET"})
    assert ok.headers.get("access-control-allow-origin") == "https://enfance-plus.onrender.com"
    assert "access-control-allow-origin" not in bad.headers


def test_10_ia_sans_cle_message_clair():
    children = get("/children", ADMIN["token"]).json()
    cid = children[0]["child_id"]
    r = post(f"/children/{cid}/quests/generate", {"domain_id": "social"}, ADMIN["token"])
    assert r.status_code == 502 and "GEMINI_API_KEY" in r.json()["detail"]
