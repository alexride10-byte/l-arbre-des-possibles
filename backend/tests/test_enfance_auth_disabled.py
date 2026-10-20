# Enfance+ regression tests with AUTH_ENABLED=false (demo-user mode): me, children CRUD, levels, quests, observations, assistant
import json
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
S = requests.Session()


@pytest.fixture(scope="module")
def child():
    r = S.post(f"{BASE_URL}/api/children", json={"name": "TEST_Demo", "age": 6, "grade": "CP"})
    assert r.status_code == 200
    c = r.json()
    yield c
    S.delete(f"{BASE_URL}/api/children/{c['child_id']}")


# --- Auth disabled ---
def test_me_demo_user():
    r = S.get(f"{BASE_URL}/api/auth/me")
    assert r.status_code == 200
    d = r.json()
    assert d["user_id"] == "demo-user" and d["auth_enabled"] is False and "_id" not in d


def test_demo_seed_leo():
    kids = S.get(f"{BASE_URL}/api/children").json()
    assert any(k["name"] == "Léo" for k in kids)
    assert all("_id" not in k for k in kids)


def test_audience_toggle():
    r = S.put(f"{BASE_URL}/api/auth/me", json={"audience": "parent"})
    assert r.status_code == 200 and r.json()["audience"] == "parent"
    assert S.get(f"{BASE_URL}/api/auth/me").json()["audience"] == "parent"
    S.put(f"{BASE_URL}/api/auth/me", json={"audience": "pro"})
    assert S.put(f"{BASE_URL}/api/auth/me", json={"audience": "x"}).status_code == 422


def test_logout_noop():
    assert S.post(f"{BASE_URL}/api/auth/logout").status_code == 200
    assert S.get(f"{BASE_URL}/api/auth/me").status_code == 200


# --- Children ---
def test_child_crud(child):
    cid = child["child_id"]
    assert child["xp"] == 0 and child["levels"]["environnement"] == 4
    u = S.put(f"{BASE_URL}/api/children/{cid}", json={"name": "TEST_Demo2", "avatar": {"face": 2, "hair": 1, "accessory": 3}})
    assert u.status_code == 200
    g = S.get(f"{BASE_URL}/api/children/{cid}").json()
    assert g["name"] == "TEST_Demo2" and g["avatar"]["face"] == 2 and g["grade"] == "CP"


def test_child_delete_404():
    c = S.post(f"{BASE_URL}/api/children", json={"name": "TEST_Del", "age": 3}).json()
    assert S.delete(f"{BASE_URL}/api/children/{c['child_id']}").status_code == 200
    assert S.get(f"{BASE_URL}/api/children/{c['child_id']}").status_code == 404


def test_child_validation():
    assert S.post(f"{BASE_URL}/api/children", json={"name": "", "age": 5}).status_code == 422
    assert S.post(f"{BASE_URL}/api/children", json={"name": "X", "age": -1}).status_code == 422


def test_levels(child):
    cid = child["child_id"]
    r = S.put(f"{BASE_URL}/api/children/{cid}/levels", json={"domain_id": "emotionnel", "level": 3})
    assert r.status_code == 200 and r.json()["levels"]["emotionnel"] == 3
    assert S.get(f"{BASE_URL}/api/children/{cid}").json()["levels"]["emotionnel"] == 3
    assert S.put(f"{BASE_URL}/api/children/{cid}/levels", json={"domain_id": "zzz", "level": 3}).status_code == 400


def test_quest_xp(child):
    cid = child["child_id"]
    base = S.get(f"{BASE_URL}/api/children/{cid}").json()["xp"]
    url = f"{BASE_URL}/api/children/{cid}/quests/q1/steps/0"
    assert S.put(url, json={"status": "fait"}).json()["xp"] == base + 50
    assert S.put(url, json={"status": "à venir"}).json()["xp"] == base


def test_observations(child):
    cid = child["child_id"]
    xp0 = S.get(f"{BASE_URL}/api/children/{cid}").json()["xp"]
    o = S.post(f"{BASE_URL}/api/children/{cid}/observations", json={"domain_id": "social", "date": "2026-01-05", "fact": "TEST_obs"}).json()
    assert S.get(f"{BASE_URL}/api/children/{cid}").json()["xp"] == xp0 + 10
    u = S.put(f"{BASE_URL}/api/children/{cid}/observations/{o['obs_id']}", json={"domain_id": "social", "date": "2026-01-06", "fact": "TEST_edit"})
    assert u.json()["fact"] == "TEST_edit"
    assert S.delete(f"{BASE_URL}/api/children/{cid}/observations/{o['obs_id']}").status_code == 200
    assert not S.get(f"{BASE_URL}/api/children/{cid}/observations").json()


def test_assistant_stream(child):
    cid = child["child_id"]
    r = S.post(f"{BASE_URL}/api/children/{cid}/assistant", json={"message": "Une piste en 2 phrases pour le social."}, stream=True, timeout=120)
    assert r.status_code == 200 and "text/event-stream" in r.headers["content-type"]
    deltas, done, err = [], False, None
    for line in r.iter_lines(decode_unicode=True):
        if line and line.startswith("data: "):
            ev = json.loads(line[6:])
            deltas.append(ev.get("delta", ""))
            err = ev.get("error", err)
            done = done or ev.get("done", False)
    assert err is None, f"LLM error: {err}"
    assert done and len("".join(deltas)) > 10
    hist = S.get(f"{BASE_URL}/api/children/{cid}/assistant").json()
    assert [m["role"] for m in hist][-2:] == ["user", "assistant"]
