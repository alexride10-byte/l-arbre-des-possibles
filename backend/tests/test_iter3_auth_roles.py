# Iteration 3: email/password auth, simulated email, lockout, sessions, roles (admin/educator/direction/internal/pending), admin, audit, avatar IA.
# REQUIRES AUTH_ENABLED=true. Test users are prefixed test_iter3_ and removed from mongo at teardown.
import os
import uuid
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
mdb = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))[os.environ.get("DB_NAME", "test_database")]

CREDS = {
    "admin": ("admin@enfanceplus.fr", "Admin2026!"),
    "educ": ("educateur@enfanceplus.fr", "Educateur2026!"),
    "dir": ("direction@enfanceplus.fr", "Direction2026!"),
    "interne": ("interne@enfanceplus.fr", "Interne2026!"),
    "attente": ("attente@enfanceplus.fr", "Attente2026!"),
}
SEEDS = {"seed_leo", "seed_maya", "seed_noah", "seed_ines"}


def h(tok):
    return {"Authorization": f"Bearer {tok}"}


def login(email, pwd):
    return requests.post(f"{API}/auth/login", json={"email": email, "password": pwd})


@pytest.fixture(scope="module", autouse=True)
def setup_module_cleanup():
    if requests.get(f"{API}/auth/me").status_code != 401:
        pytest.skip("AUTH_ENABLED is false")
    yield
    ids = [u["user_id"] for u in mdb.users.find({"email": {"$regex": "^test_iter3_"}})]
    mdb.users.delete_many({"user_id": {"$in": ids}})
    mdb.user_sessions.delete_many({"user_id": {"$in": ids}})
    mdb.login_attempts.delete_many({"identifier": {"$regex": "test_iter3_"}})
    mdb.observations.delete_many({"fact": {"$regex": "^TEST_iter3"}})
    for cid in ("seed_leo", "seed_maya"):
        mdb.children.update_one({"child_id": cid}, {"$pull": {"assigned": {"$in": ids}}})


@pytest.fixture(scope="module")
def tok():
    out = {}
    for k, (e, p) in CREDS.items():
        r = login(e, p)
        assert r.status_code == 200, f"{k}: {r.status_code} {r.text}"
        out[k] = r.json()["session_token"]
    return out


# --- Login ---
def test_login_seeded_sets_cookie_and_hash():
    r = login(*CREDS["admin"])
    assert r.status_code == 200
    d = r.json()
    assert d["role"] == "admin" and "password_hash" not in d and isinstance(d["session_token"], str)
    sc = r.headers.get("set-cookie", "").lower()
    assert "session_token=" in sc and "httponly" in sc
    assert mdb.users.find_one({"email": CREDS["admin"][0]})["password_hash"].startswith("$2b$")


def test_wrong_password_401():
    r = login(CREDS["admin"][0], "WrongPass!!")
    assert r.status_code == 401
    assert "incorrect" in r.json()["detail"]
    mdb.login_attempts.delete_many({"identifier": {"$regex": "admin@enfanceplus.fr"}})


def test_bruteforce_lockout():
    email = f"test_iter3_lock_{uuid.uuid4().hex[:6]}@example.com"
    codes = [login(email, "badpass123").status_code for _ in range(6)]
    assert codes[:5] == [401] * 5, codes
    assert codes[5] == 429, codes


# --- Register / verify / pending ---
@pytest.fixture(scope="module")
def newuser():
    email = f"test_iter3_reg_{uuid.uuid4().hex[:6]}@example.com"
    return {"email": email, "password": "Passw0rd!x"}


def test_register_terms_required(newuser):
    r = requests.post(f"{API}/auth/register", json={"name": "Test U", "email": newuser["email"], "password": newuser["password"], "accept_terms": False})
    assert r.status_code == 400


def test_register_verify_pending(newuser, tok):
    r = requests.post(f"{API}/auth/register", json={"name": "TEST Iter3", "email": newuser["email"], "password": newuser["password"], "accept_terms": True})
    assert r.status_code == 200
    link = r.json()["simulated_link"]
    assert link.startswith("/verifier?token=")
    # duplicate
    assert requests.post(f"{API}/auth/register", json={"name": "TEST Iter3", "email": newuser["email"], "password": newuser["password"], "accept_terms": True}).status_code == 400
    r = login(newuser["email"], newuser["password"])
    assert r.status_code == 403 and "non vérifiée" in r.json()["detail"]
    token = link.split("token=")[1]
    assert requests.post(f"{API}/auth/verify-email", json={"token": token}).status_code == 200
    assert requests.post(f"{API}/auth/verify-email", json={"token": token}).status_code == 400  # single use
    r = login(newuser["email"], newuser["password"])
    assert r.status_code == 200
    t = r.json()["session_token"]
    me = requests.get(f"{API}/auth/me", headers=h(t)).json()
    assert me["status"] == "pending" and me["role"] is None
    assert requests.get(f"{API}/children", headers=h(t)).status_code == 403
    newuser["token"] = t
    newuser["user_id"] = me["user_id"]


def test_forgot_reset_revokes_sessions(newuser):
    r = requests.post(f"{API}/auth/forgot-password", json={"email": newuser["email"]})
    link = r.json()["simulated_link"]
    assert link.startswith("/reinitialiser?token=")
    assert requests.post(f"{API}/auth/forgot-password", json={"email": "nobody_x@example.com"}).json()["simulated_link"] is None
    r = requests.post(f"{API}/auth/reset-password", json={"token": link.split("token=")[1], "password": "NewPassw0rd!"})
    assert r.status_code == 200
    assert requests.get(f"{API}/auth/me", headers=h(newuser["token"])).status_code == 401
    assert login(newuser["email"], newuser["password"]).status_code == 401
    r = login(newuser["email"], "NewPassw0rd!")
    assert r.status_code == 200
    newuser["password"] = "NewPassw0rd!"
    newuser["token"] = r.json()["session_token"]


# --- Admin ---
def test_admin_validate_assign_revoke(newuser, tok):
    uid = newuser["user_id"]
    users = requests.get(f"{API}/admin/users", headers=h(tok["admin"])).json()
    assert any(u["user_id"] == uid for u in users) and all("password_hash" not in u for u in users)
    # active without role -> 400
    assert requests.put(f"{API}/admin/users/{uid}", json={"status": "active"}, headers=h(tok["admin"])).status_code == 400
    r = requests.put(f"{API}/admin/users/{uid}", json={"status": "active", "role": "educator"}, headers=h(tok["admin"]))
    assert r.status_code == 200 and r.json()["status"] == "active"
    assert requests.get(f"{API}/children", headers=h(newuser["token"])).json() == []
    leo = requests.get(f"{API}/children/seed_leo", headers=h(tok["admin"])).json()
    r = requests.put(f"{API}/admin/children/seed_leo/assign", json={"user_ids": leo["assigned"] + [uid]}, headers=h(tok["admin"]))
    assert r.status_code == 200
    kids = requests.get(f"{API}/children", headers=h(newuser["token"])).json()
    assert [k["child_id"] for k in kids] == ["seed_leo"]
    # revoke -> sessions killed, login 403
    requests.put(f"{API}/admin/users/{uid}", json={"status": "revoked"}, headers=h(tok["admin"]))
    assert requests.get(f"{API}/auth/me", headers=h(newuser["token"])).status_code == 401
    assert login(newuser["email"], newuser["password"]).status_code == 403
    # reactivate
    assert requests.put(f"{API}/admin/users/{uid}", json={"status": "active"}, headers=h(tok["admin"])).json()["status"] == "active"
    assert login(newuser["email"], newuser["password"]).status_code == 200
    # restore assignment
    requests.put(f"{API}/admin/children/seed_leo/assign", json={"user_ids": leo["assigned"]}, headers=h(tok["admin"]))


def test_admin_cannot_edit_self(tok):
    me = requests.get(f"{API}/auth/me", headers=h(tok["admin"])).json()
    assert requests.put(f"{API}/admin/users/{me['user_id']}", json={"status": "revoked"}, headers=h(tok["admin"])).status_code == 400


def test_audit_log(tok):
    requests.get(f"{API}/children/seed_noah", headers=h(tok["admin"]))
    logs = requests.get(f"{API}/admin/audit", headers=h(tok["admin"])).json()
    actions = {l["action"] for l in logs}
    assert "auth.login" in actions and "GET /children/seed_noah" in actions
    assert all("_id" not in l for l in logs)


# --- Educator ---
def test_educator_scope(tok):
    kids = requests.get(f"{API}/children", headers=h(tok["educ"])).json()
    assert sorted(k["child_id"] for k in kids) == ["seed_leo", "seed_maya"]
    assert requests.get(f"{API}/children/seed_noah", headers=h(tok["educ"])).status_code == 404
    r = requests.post(f"{API}/children/seed_leo/observations", json={"domain_id": "social", "date": "2026-01-10", "fact": "TEST_iter3 obs"}, headers=h(tok["educ"]))
    assert r.status_code == 200 and r.json()["author"] == "Thomas Éducateur"
    assert requests.delete(f"{API}/children/seed_leo/observations/{r.json()['obs_id']}", headers=h(tok["educ"])).status_code == 200
    lv = requests.get(f"{API}/children/seed_leo", headers=h(tok["educ"])).json()["levels"]["social"]
    r = requests.put(f"{API}/children/seed_leo/levels", json={"domain_id": "social", "level": lv}, headers=h(tok["educ"]))
    assert r.status_code == 200
    assert requests.get(f"{API}/admin/users", headers=h(tok["educ"])).status_code == 403


# --- Direction ---
def test_direction_readonly(tok):
    kids = requests.get(f"{API}/children", headers=h(tok["dir"])).json()
    assert SEEDS.issubset({k["child_id"] for k in kids})
    assert requests.get(f"{API}/children/seed_noah", headers=h(tok["dir"])).status_code == 200
    assert requests.put(f"{API}/children/seed_noah/levels", json={"domain_id": "social", "level": 3}, headers=h(tok["dir"])).status_code == 403
    assert requests.post(f"{API}/children/seed_noah/observations", json={"domain_id": "social", "date": "2026-01-10", "fact": "TEST_iter3 x"}, headers=h(tok["dir"])).status_code == 403
    assert requests.put(f"{API}/children/seed_noah/quests/q1/steps/0", json={"status": "fait"}, headers=h(tok["dir"])).status_code == 403
    assert requests.post(f"{API}/children", json={"name": "TEST_x", "age": 5}, headers=h(tok["dir"])).status_code == 403
    assert requests.get(f"{API}/admin/audit", headers=h(tok["dir"])).status_code == 403


# --- Internal ---
def test_internal(tok):
    assert requests.get(f"{API}/children", headers=h(tok["interne"])).json() == []
    assert requests.get(f"{API}/children/seed_leo", headers=h(tok["interne"])).status_code == 404
    assert requests.get(f"{API}/admin/users", headers=h(tok["interne"])).status_code == 403
    r = requests.get(f"{API}/internal/stats", headers=h(tok["interne"]))
    assert r.status_code == 200 and r.json()["children"] >= 4 and "users_by_role" in r.json()
    assert requests.get(f"{API}/internal/stats", headers=h(tok["educ"])).status_code == 403


# --- Pending seeded ---
def test_pending_seed(tok):
    me = requests.get(f"{API}/auth/me", headers=h(tok["attente"])).json()
    assert me["status"] == "pending"
    assert requests.get(f"{API}/children", headers=h(tok["attente"])).status_code == 403


# --- Sessions ---
def test_sessions_revoke_other():
    t1 = login(*CREDS["educ"]).json()["session_token"]
    t2 = login(*CREDS["educ"]).json()["session_token"]
    rows = requests.get(f"{API}/auth/sessions", headers=h(t1)).json()
    cur = [r for r in rows if r["current"]]
    assert len(cur) == 1
    # find t2 session id from t2 perspective
    sid2 = next(r["session_id"] for r in requests.get(f"{API}/auth/sessions", headers=h(t2)).json() if r["current"])
    assert requests.delete(f"{API}/auth/sessions/{sid2}", headers=h(t1)).status_code == 200
    assert requests.get(f"{API}/auth/me", headers=h(t2)).status_code == 401
    assert requests.get(f"{API}/auth/me", headers=h(t1)).status_code == 200
    requests.post(f"{API}/auth/logout", headers=h(t1))
    assert requests.get(f"{API}/auth/me", headers=h(t1)).status_code == 401


# --- Avatar IA (Nano Banana) ---
def test_avatar_generate(tok):
    before = requests.get(f"{API}/children/seed_ines", headers=h(tok["admin"])).json()
    r = requests.post(f"{API}/children/seed_ines/avatar/generate", json={"gender": "fille"}, headers=h(tok["admin"]), timeout=120)
    assert r.status_code == 200, r.text
    d = r.json()
    url = d["avatar"]["portrait"]
    assert url.startswith("/api/avatars/")
    assert len(d["avatar_history"]) == len(before.get("avatar_history", [])) + 1
    img = requests.get(f"{BASE_URL}{url}")
    assert img.status_code == 200 and img.headers["content-type"].startswith("image/") and len(img.content) > 1000
    # restore original portrait
    requests.put(f"{API}/children/seed_ines", json={"avatar": before["avatar"]}, headers=h(tok["admin"]))
