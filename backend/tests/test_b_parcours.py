"""Parcours complet de l'appli, lancé par GitHub après test_a_securite.py (même base, admin déjà créé)."""

import os
import uuid

import pytest
import requests

API = os.environ.get("API_URL", "http://localhost:8001").rstrip("/") + "/api"


def call(method, path, token=None, **kw):
    return requests.request(method, API + path, headers={"Authorization": f"Bearer {token}"} if token else {}, timeout=30, **kw)


def new_user(admin, role):
    email = f"{role}_{uuid.uuid4().hex[:6]}@test.fr"
    call("POST", "/auth/register", json={"name": f"Test {role}", "email": email, "password": "MotDePasse!2026", "accept_terms": True})
    uid = next(u["user_id"] for u in call("GET", "/admin/users", admin).json() if u["email"] == email)
    assert call("PUT", f"/admin/users/{uid}", admin, json={"status": "active", "role": role}).status_code == 200
    return uid, call("POST", "/auth/login", json={"email": email, "password": "MotDePasse!2026"}).json()["session_token"]


@pytest.fixture(scope="module")
def ctx():
    from test_a_securite import ADMIN  # admin créé par test_a_securite (exécuté avant)

    admin = call("POST", "/auth/login", json={"email": ADMIN["email"], "password": ADMIN["password"]}).json()["session_token"]
    educ_id, educ = new_user(admin, "educator")
    _, direction = new_user(admin, "direction")
    child = call("POST", "/children", educ, json={"name": "Zoé", "age": 7, "grade": "CE1"}).json()
    return {"admin": admin, "educ": educ, "educ_id": educ_id, "dir": direction, "cid": child["child_id"]}


def test_dossier_cree_et_visible(ctx):
    kids = call("GET", "/children", ctx["educ"]).json()
    assert [k["access"] for k in kids if k["child_id"] == ctx["cid"]] == ["owner"]
    assert call("GET", f"/children/{ctx['cid']}", ctx["admin"]).status_code == 200
    assert call("PUT", f"/children/{ctx['cid']}", ctx["educ"], json={"grade": "CE2"}).json()["grade"] == "CE2"


def test_portrait_externe_refuse(ctx):
    r = call("PUT", f"/children/{ctx['cid']}", ctx["educ"], json={"avatar": {"portrait": "https://pirate.example/x.png"}})
    assert r.status_code == 400


def test_direction_lecture_seule(ctx):
    assert call("GET", f"/children/{ctx['cid']}", ctx["dir"]).status_code == 200
    assert call("PUT", f"/children/{ctx['cid']}", ctx["dir"], json={"grade": "CM1"}).status_code == 403
    assert call("POST", "/children", ctx["dir"], json={"name": "X", "age": 5}).status_code == 403


def test_niveaux_et_etapes(ctx):
    c = call("PUT", f"/children/{ctx['cid']}/levels", ctx["educ"], json={"domain_id": "social", "level": 5}).json()
    assert c["levels"]["social"] == 5 and c["level_history"][-1]["to"] == 5
    assert call("PUT", f"/children/{ctx['cid']}/levels", ctx["educ"], json={"domain_id": "inconnu", "level": 2}).status_code == 400
    c = call("PUT", f"/children/{ctx['cid']}/quests/q-transitions/steps/0", ctx["educ"], json={"status": "fait"}).json()
    assert c["xp"] == 50
    c = call("PUT", f"/children/{ctx['cid']}/quests/q-transitions/steps/0", ctx["educ"], json={"status": "fait"}).json()
    assert c["xp"] == 50  # pas de double comptage
    assert call("PUT", f"/children/{ctx['cid']}/quests/a.b/steps/0", ctx["educ"], json={"status": "fait"}).status_code == 422


def test_quete_personnalisee(ctx):
    quest = {"title": "Respirer", "domainId": "emotionnel", "steps": [{"title": "Souffle"}]}
    c = call("POST", f"/children/{ctx['cid']}/quests", ctx["educ"], json=quest).json()
    qid = c["custom_quests"][-1]["id"]
    call("PUT", f"/children/{ctx['cid']}/quests/{qid}/steps/0", ctx["educ"], json={"status": "fait"})
    c = call("DELETE", f"/children/{ctx['cid']}/quests/{qid}", ctx["educ"]).json()
    assert not c["custom_quests"] and c["xp"] == 50


def test_observations(ctx):
    base = f"/children/{ctx['cid']}/observations"
    obs = call("POST", base, ctx["educ"], json={"domain_id": "social", "date": "2026-10-01", "fact": "Joue avec deux camarades"}).json()
    assert call("PUT", f"{base}/{obs['obs_id']}", ctx["educ"], json={**obs, "fact": "Joue avec trois camarades"}).json()["fact"].startswith("Joue avec trois")
    assert len(call("GET", base, ctx["educ"], params={"domain_id": "social"}).json()) == 1
    assert call("DELETE", f"{base}/{obs['obs_id']}", ctx["educ"]).json() == {"ok": True}


def test_partage(ctx):
    c = call("POST", f"/children/{ctx['cid']}/shares", ctx["educ"], json={"email": "Parent@Test.fr", "role": "parent"}).json()
    assert c["shares"][0]["email"] == "parent@test.fr"
    assert call("DELETE", f"/children/{ctx['cid']}/shares/parent@test.fr", ctx["educ"]).json()["shares"] == []


def test_notes_et_auteur(ctx):
    base = f"/children/{ctx['cid']}/notes"
    note = call("POST", base, ctx["educ"], json={"text": "Bonne journée"}).json()
    assert call("PUT", f"{base}/{note['note_id']}", ctx["educ"], json={"text": "Très bonne journée"}).json()["text"] == "Très bonne journée"
    assert call("GET", base, ctx["admin"]).json()[0]["note_id"] == note["note_id"]
    assert call("DELETE", f"{base}/{note['note_id']}", ctx["admin"]).json() == {"ok": True}  # l'admin peut supprimer
    assert isinstance(call("GET", "/reminders", ctx["educ"]).json(), list)


def test_calendrier(ctx):
    base = f"/children/{ctx['cid']}/events"
    ev = call("POST", base, ctx["educ"], json={"title": "RDV école", "start": "2026-11-03T10:00"}).json()
    assert (
        call("PUT", f"{base}/{ev['event_id']}", ctx["educ"], json={"title": "RDV école", "start": "2026-11-03T11:00"})
        .json()["start"]
        .startswith("2026-11-03T11")
    )
    assert [e["event_id"] for e in call("GET", "/events", ctx["educ"], params={"child_id": ctx["cid"]}).json()] == [ev["event_id"]]
    assert call("DELETE", f"{base}/{ev['event_id']}", ctx["educ"]).status_code == 200
    assert call("DELETE", f"{base}/{ev['event_id']}", ctx["educ"]).status_code == 404


def test_messagerie(ctx):
    contacts = call("GET", "/messages/contacts", ctx["admin"], params={"child_id": ctx["cid"]}).json()
    assert ctx["educ_id"] in [c["user_id"] for c in contacts]
    t = call(
        "POST", "/messages/threads", ctx["admin"], json={"title": "Point", "child_id": ctx["cid"], "participant_ids": [ctx["educ_id"]], "text": "Bonjour"}
    ).json()
    assert call("GET", "/messages/unread", ctx["educ"]).json()["unread"] >= 1
    assert call("POST", f"/messages/threads/{t['thread_id']}/messages", ctx["educ"], json={"text": "Salut"}).json() == {"ok": True}
    assert len(call("GET", f"/messages/threads/{t['thread_id']}", ctx["educ"]).json()["messages"]) == 2
    assert call("GET", f"/messages/threads/{t['thread_id']}", ctx["dir"]).status_code == 404


def test_contenus(ctx):
    roots = {"data": {"id": "all", "labels": ["A", "B", "C", "D", "E"]}}
    assert call("PUT", "/admin/content/roots/all", ctx["admin"], json=roots).status_code == 200
    assert call("PUT", "/admin/content/roots/all", ctx["educ"], json=roots).status_code == 403
    assert call("PUT", "/admin/content/roots/inconnu", ctx["admin"], json=roots).status_code == 400
    assert any(c["kind"] == "roots" for c in call("GET", "/content", ctx["educ"]).json())
    assert call("DELETE", "/admin/content/roots/all", ctx["admin"]).json() == {"ok": True}


def test_admin_divers(ctx):
    assert call("PUT", f"/admin/children/{ctx['cid']}/assign", ctx["admin"], json={"user_ids": [ctx["educ_id"]]}).json()["assigned"] == [ctx["educ_id"]]
    assert call("GET", "/admin/audit", ctx["admin"]).json()
    assert call("GET", "/internal/stats", ctx["admin"]).json()["children"] >= 1
    assert call("GET", "/admin/audit", ctx["educ"]).status_code == 403


def test_sessions_et_deconnexion(ctx):
    sessions = call("GET", "/auth/sessions", ctx["dir"]).json()
    assert any(s["current"] for s in sessions)
    assert call("POST", "/auth/logout", ctx["dir"]).json() == {"ok": True}
    assert call("GET", "/auth/me", ctx["dir"]).status_code == 401


def test_suppression_dossier(ctx):
    assert call("DELETE", f"/children/{ctx['cid']}", ctx["educ"]).json() == {"ok": True}
    assert call("GET", f"/children/{ctx['cid']}", ctx["admin"]).status_code == 404
