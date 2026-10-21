# Iteration 4: Messagerie sécurisée (threads, messages, unread, child-access checks, audit). REQUIRES AUTH_ENABLED=true.
# Test threads are titled TEST_iter4_* and removed from mongo at teardown; seed_leo assignment restored.
import os
import time
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
}
TOK = {}


def h(role):
    if role not in TOK:
        r = requests.post(f"{API}/auth/login", json={"email": CREDS[role][0], "password": CREDS[role][1]})
        assert r.status_code == 200, r.text
        TOK[role] = r.json()["session_token"]
    return {"Authorization": f"Bearer {TOK[role]}"}


def admin_id():
    return mdb.users.find_one({"email": CREDS["admin"][0]})["user_id"]


@pytest.fixture(scope="module", autouse=True)
def cleanup():
    if requests.get(f"{API}/auth/me").status_code != 401:
        pytest.skip("AUTH_ENABLED is false")
    yield
    ids = [t["thread_id"] for t in mdb.threads.find({"title": {"$regex": "^TEST_iter4"}})]
    mdb.threads.delete_many({"thread_id": {"$in": ids}})
    mdb.thread_messages.delete_many({"thread_id": {"$in": ids}})
    mdb.thread_messages.delete_many({"thread_id": "th_seed_leo", "text": {"$regex": "^TEST_iter4"}})
    mdb.children.update_one({"child_id": "seed_leo"}, {"$set": {"assigned": ["seed_educ"]}})


# --- contacts
def test_contacts_all():
    r = requests.get(f"{API}/messages/contacts", headers=h("educ"))
    assert r.status_code == 200
    ids = {u["user_id"] for u in r.json()}
    assert "seed_educ" not in ids and "seed_attente" not in ids
    assert admin_id() in ids and "seed_dir" in ids and "seed_interne" in ids
    assert all("email" not in u and "password_hash" not in u for u in r.json())


def test_contacts_child_no_access():
    assert requests.get(f"{API}/messages/contacts?child_id=seed_noah", headers=h("educ")).status_code == 404


def test_contacts_child_leo():
    r = requests.get(f"{API}/messages/contacts?child_id=seed_leo", headers=h("admin"))
    ids = {u["user_id"] for u in r.json()}
    assert "seed_educ" in ids and "seed_dir" in ids and "seed_interne" not in ids
    r = requests.get(f"{API}/messages/contacts?child_id=seed_leo", headers=h("educ"))
    ids = {u["user_id"] for u in r.json()}
    assert admin_id() in ids and "seed_interne" not in ids
    assert all(u["role"] in ("admin", "direction", "educator") for u in r.json())


def test_contacts_internal_child():
    assert requests.get(f"{API}/messages/contacts?child_id=seed_leo", headers=h("interne")).status_code == 404


# --- create thread validation
def test_create_invalid_recipients():
    base = {"title": "TEST_iter4_x", "text": "hi"}
    for pid in ["seed_attente", "nope_user"]:
        r = requests.post(f"{API}/messages/threads", json={**base, "participant_ids": [pid]}, headers=h("educ"))
        assert r.status_code == 400, (pid, r.text)
    r = requests.post(f"{API}/messages/threads", json={**base, "participant_ids": ["seed_educ"]}, headers=h("educ"))
    assert r.status_code == 400  # only self
    r = requests.post(f"{API}/messages/threads", json={**base, "participant_ids": []}, headers=h("educ"))
    assert r.status_code == 422


def test_create_recipient_without_child_access():
    r = requests.post(f"{API}/messages/threads", json={"title": "TEST_iter4_x", "child_id": "seed_leo", "participant_ids": ["seed_interne"], "text": "hi"}, headers=h("admin"))
    assert r.status_code == 403


def test_create_creator_without_child_access():
    r = requests.post(f"{API}/messages/threads", json={"title": "TEST_iter4_x", "child_id": "seed_noah", "participant_ids": [admin_id()], "text": "hi"}, headers=h("educ"))
    assert r.status_code == 404
    r = requests.post(f"{API}/messages/threads", json={"title": "TEST_iter4_x", "child_id": "seed_leo", "participant_ids": [admin_id()], "text": "hi"}, headers=h("interne"))
    assert r.status_code == 404


@pytest.fixture(scope="module")
def thread():
    r = requests.post(f"{API}/messages/threads", json={"title": "TEST_iter4_leo", "child_id": "seed_leo", "participant_ids": [admin_id()], "text": "TEST_iter4 first"}, headers=h("educ"))
    assert r.status_code == 200, r.text
    t = r.json()
    assert t["thread_id"].startswith("th_") and t["child_id"] == "seed_leo"
    assert set(t["participants"]) == {"seed_educ", admin_id()} and "read_by" not in t
    return t["thread_id"]


def test_thread_listing_and_unread(thread):
    me = requests.get(f"{API}/messages/threads", headers=h("educ")).json()
    row = next(t for t in me if t["thread_id"] == thread)
    assert row["unread"] == 0 and row["child_name"] == "Léo" and row["last_text"] == "TEST_iter4 first"
    adm = requests.get(f"{API}/messages/threads", headers=h("admin")).json()
    assert next(t for t in adm if t["thread_id"] == thread)["unread"] == 1
    # filter
    f = requests.get(f"{API}/messages/threads?child_id=seed_leo", headers=h("educ")).json()
    assert all(t["child_id"] == "seed_leo" for t in f) and any(t["thread_id"] == thread for t in f)
    assert not any(t["thread_id"] == thread for t in requests.get(f"{API}/messages/threads?child_id=seed_maya", headers=h("educ")).json())
    # non participants
    for role in ("dir", "interne"):
        assert not any(t["thread_id"] == thread for t in requests.get(f"{API}/messages/threads", headers=h(role)).json())
        assert requests.get(f"{API}/messages/threads/{thread}", headers=h(role)).status_code == 404
        assert requests.post(f"{API}/messages/threads/{thread}/messages", json={"text": "x"}, headers=h(role)).status_code == 404


def test_read_marks_read_and_unread_total(thread):
    before = requests.get(f"{API}/messages/unread", headers=h("admin")).json()["unread"]
    assert before >= 1
    r = requests.get(f"{API}/messages/threads/{thread}", headers=h("admin"))
    assert r.status_code == 200
    d = r.json()
    assert d["thread"]["title"] == "TEST_iter4_leo" and len(d["messages"]) == 1 and "read_by" not in d["thread"]
    adm = requests.get(f"{API}/messages/threads", headers=h("admin")).json()
    assert next(t for t in adm if t["thread_id"] == thread)["unread"] == 0
    assert requests.get(f"{API}/messages/unread", headers=h("admin")).json()["unread"] == before - 1


def test_send_appends(thread):
    r = requests.post(f"{API}/messages/threads/{thread}/messages", json={"text": "TEST_iter4 reply"}, headers=h("admin"))
    assert r.status_code == 200 and r.json()["ok"]
    assert requests.post(f"{API}/messages/threads/{thread}/messages", json={"text": ""}, headers=h("admin")).status_code == 422
    d = requests.get(f"{API}/messages/threads/{thread}", headers=h("educ")).json()
    assert [m["text"] for m in d["messages"]] == ["TEST_iter4 first", "TEST_iter4 reply"]
    assert d["messages"][1]["author_name"] == "Claire Admin"


def test_unassign_revokes_access(thread):
    adm = h("admin")
    r = requests.put(f"{API}/admin/children/seed_leo/assign", json={"user_ids": []}, headers=adm)
    assert r.status_code == 200
    try:
        assert requests.get(f"{API}/messages/threads/{thread}", headers=h("educ")).status_code == 403
        assert requests.post(f"{API}/messages/threads/{thread}/messages", json={"text": "x"}, headers=h("educ")).status_code == 403
        lst = requests.get(f"{API}/messages/threads", headers=h("educ")).json()
        assert not any(t["thread_id"] in (thread, "th_seed_leo") for t in lst)
        # admin can still read
        assert requests.get(f"{API}/messages/threads/{thread}", headers=adm).status_code == 200
    finally:
        r = requests.put(f"{API}/admin/children/seed_leo/assign", json={"user_ids": ["seed_educ"]}, headers=adm)
        assert r.status_code == 200 and r.json()["assigned"] == ["seed_educ"]
    assert requests.get(f"{API}/messages/threads/{thread}", headers=h("educ")).status_code == 200


def test_non_child_thread_with_internal(thread):
    r = requests.post(f"{API}/messages/threads", json={"title": "TEST_iter4_general", "participant_ids": ["seed_interne", "seed_interne"], "text": "TEST_iter4 hello"}, headers=h("educ"))
    assert r.status_code == 200, r.text
    tid = r.json()["thread_id"]
    assert r.json()["participants"] == ["seed_educ", "seed_interne"]
    assert requests.get(f"{API}/messages/threads/{tid}", headers=h("interne")).status_code == 200


def test_audit_entries(thread):
    logs = requests.get(f"{API}/admin/audit?limit=500", headers=h("admin")).json()
    actions = {l["action"] for l in logs if l.get("detail") == thread}
    assert {"message.thread_create", "message.thread_read", "message.send"} <= actions, actions
    assert requests.get(f"{API}/admin/audit", headers=h("educ")).status_code == 403


def test_unauthenticated():
    assert requests.get(f"{API}/messages/threads").status_code == 401
    assert requests.get(f"{API}/messages/unread").status_code == 401
