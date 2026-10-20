# Enfance+ backend regression tests (auth, children CRUD, levels, quests XP, observations, assistant, isolation)
import json
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
H1 = {"Authorization": "Bearer test_session_1"}
H2 = {"Authorization": "Bearer test_session_2"}


@pytest.fixture(scope="module")
def child():
    r = requests.post(f"{BASE_URL}/api/children", headers=H1, json={"name": "TEST_Enfant", "age": 6, "grade": "CP"})
    assert r.status_code == 200
    c = r.json()
    yield c
    requests.delete(f"{BASE_URL}/api/children/{c['child_id']}", headers=H1)


# --- Auth ---
def test_root():
    assert requests.get(f"{BASE_URL}/api/").json()["status"] == "ok"


def test_me_unauth():
    assert requests.get(f"{BASE_URL}/api/auth/me").status_code == 401


def test_me_and_seed():
    r = requests.get(f"{BASE_URL}/api/auth/me", headers=H1)
    assert r.status_code == 200 and r.json()["user_id"] == "test-user-1"
    assert "_id" not in r.json()
    kids = requests.get(f"{BASE_URL}/api/children", headers=H1).json()
    assert any(k["name"] == "Léo" for k in kids)


def test_update_audience():
    r = requests.put(f"{BASE_URL}/api/auth/me", headers=H1, json={"audience": "parent"})
    assert r.status_code == 200 and r.json()["audience"] == "parent"
    assert requests.get(f"{BASE_URL}/api/auth/me", headers=H1).json()["audience"] == "parent"
    requests.put(f"{BASE_URL}/api/auth/me", headers=H1, json={"audience": "pro"})
    assert requests.put(f"{BASE_URL}/api/auth/me", headers=H1, json={"audience": "x"}).status_code == 422


# --- Children CRUD ---
def test_child_create_get_update(child):
    cid = child["child_id"]
    assert child["levels"]["emotionnel"] == 2 and child["xp"] == 0
    g = requests.get(f"{BASE_URL}/api/children/{cid}", headers=H1)
    assert g.status_code == 200 and g.json()["name"] == "TEST_Enfant"
    u = requests.put(f"{BASE_URL}/api/children/{cid}", headers=H1, json={"name": "TEST_Renamed", "age": 7})
    assert u.json()["name"] == "TEST_Renamed" and u.json()["age"] == 7
    assert requests.get(f"{BASE_URL}/api/children/{cid}", headers=H1).json()["grade"] == "CP"


def test_child_validation():
    assert requests.post(f"{BASE_URL}/api/children", headers=H1, json={"name": "", "age": 5}).status_code == 422
    assert requests.post(f"{BASE_URL}/api/children", headers=H1, json={"name": "X", "age": 50}).status_code == 422


def test_child_delete():
    c = requests.post(f"{BASE_URL}/api/children", headers=H1, json={"name": "TEST_Del", "age": 4}).json()
    assert requests.delete(f"{BASE_URL}/api/children/{c['child_id']}", headers=H1).status_code == 200
    assert requests.get(f"{BASE_URL}/api/children/{c['child_id']}", headers=H1).status_code == 404


# --- Levels ---
def test_levels(child):
    cid = child["child_id"]
    r = requests.put(f"{BASE_URL}/api/children/{cid}/levels", headers=H1, json={"domain_id": "social", "level": 5})
    assert r.status_code == 200
    d = r.json()
    assert d["levels"]["social"] == 5
    assert d["level_history"][-1]["from"] == 3 and d["level_history"][-1]["to"] == 5
    assert requests.put(f"{BASE_URL}/api/children/{cid}/levels", headers=H1, json={"domain_id": "foo", "level": 3}).status_code == 400
    assert requests.put(f"{BASE_URL}/api/children/{cid}/levels", headers=H1, json={"domain_id": "social", "level": 6}).status_code == 422
    assert requests.put(f"{BASE_URL}/api/children/{cid}/levels", headers=H1, json={"domain_id": "social", "level": 0}).status_code == 422


# --- Quest steps XP ---
def test_quest_xp(child):
    cid = child["child_id"]
    base = requests.get(f"{BASE_URL}/api/children/{cid}", headers=H1).json()["xp"]
    url = f"{BASE_URL}/api/children/{cid}/quests/q-emotions/steps/0"
    r = requests.put(url, headers=H1, json={"status": "fait"})
    assert r.json()["xp"] == base + 50
    r = requests.put(url, headers=H1, json={"status": "fait"})
    assert r.json()["xp"] == base + 50, "setting fait twice must not double XP"
    r = requests.put(url, headers=H1, json={"status": "en cours"})
    assert r.json()["xp"] == base
    assert r.json()["quest_steps"]["q-emotions:0"]["status"] == "en cours"
    assert requests.put(url, headers=H1, json={"status": "bad"}).status_code == 422


# --- Observations ---
def test_observations_crud(child):
    cid = child["child_id"]
    xp0 = requests.get(f"{BASE_URL}/api/children/{cid}", headers=H1).json()["xp"]
    o = requests.post(f"{BASE_URL}/api/children/{cid}/observations", headers=H1,
                      json={"domain_id": "emotionnel", "date": "2026-01-10", "fact": "TEST_fait", "context": "maison"})
    assert o.status_code == 200
    obs = o.json()
    assert requests.get(f"{BASE_URL}/api/children/{cid}", headers=H1).json()["xp"] == xp0 + 10
    lst = requests.get(f"{BASE_URL}/api/children/{cid}/observations?domain_id=emotionnel", headers=H1).json()
    assert any(x["obs_id"] == obs["obs_id"] for x in lst)
    u = requests.put(f"{BASE_URL}/api/children/{cid}/observations/{obs['obs_id']}", headers=H1,
                     json={"domain_id": "emotionnel", "date": "2026-01-11", "fact": "TEST_edit"})
    assert u.json()["fact"] == "TEST_edit"
    assert requests.put(f"{BASE_URL}/api/children/{cid}/observations/nope", headers=H1,
                        json={"domain_id": "emotionnel", "date": "2026-01-11", "fact": "x"}).status_code == 404
    assert requests.delete(f"{BASE_URL}/api/children/{cid}/observations/{obs['obs_id']}", headers=H1).status_code == 200
    lst = requests.get(f"{BASE_URL}/api/children/{cid}/observations", headers=H1).json()
    assert not any(x["obs_id"] == obs["obs_id"] for x in lst)
    assert requests.post(f"{BASE_URL}/api/children/{cid}/observations", headers=H1,
                         json={"domain_id": "emotionnel", "date": "2026-01-10", "fact": ""}).status_code == 422


# --- Isolation ---
def test_isolation(child):
    cid = child["child_id"]
    assert requests.get(f"{BASE_URL}/api/children/{cid}", headers=H2).status_code == 404
    assert requests.put(f"{BASE_URL}/api/children/{cid}", headers=H2, json={"name": "hack"}).status_code == 404
    assert requests.delete(f"{BASE_URL}/api/children/{cid}", headers=H2).status_code == 404
    assert requests.get(f"{BASE_URL}/api/children/{cid}/observations", headers=H2).status_code == 404
    assert all(k["child_id"] != cid for k in requests.get(f"{BASE_URL}/api/children", headers=H2).json())


# --- Assistant (1 LLM call) ---
def test_assistant_stream(child):
    cid = child["child_id"]
    r = requests.post(f"{BASE_URL}/api/children/{cid}/assistant", headers=H1,
                      json={"message": "Donne une piste courte (2 phrases) pour l'émotionnel."}, stream=True, timeout=120)
    assert r.status_code == 200
    assert "text/event-stream" in r.headers["content-type"]
    deltas, done, err = [], False, None
    for line in r.iter_lines(decode_unicode=True):
        if line and line.startswith("data: "):
            ev = json.loads(line[6:])
            if "delta" in ev: deltas.append(ev["delta"])
            if "error" in ev: err = ev["error"]
            if ev.get("done"): done = True
    assert err is None, f"LLM error: {err}"
    assert done and len("".join(deltas)) > 10
    hist = requests.get(f"{BASE_URL}/api/children/{cid}/assistant", headers=H1).json()
    assert [m["role"] for m in hist][-2:] == ["user", "assistant"]
    assert requests.delete(f"{BASE_URL}/api/children/{cid}/assistant", headers=H1).status_code == 200
    assert requests.get(f"{BASE_URL}/api/children/{cid}/assistant", headers=H1).json() == []
