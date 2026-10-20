# Iteration 2: CORS, custom/AI quests, shares (demo mode AUTH_ENABLED=false)
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def child(s):
    r = s.post(f"{API}/children", json={"name": "TEST_Iter2", "age": 7})
    assert r.status_code == 200
    c = r.json()
    yield c
    s.delete(f"{API}/children/{c['child_id']}")


# CORS
class TestCors:
    def test_preflight_emergent_origin(self):
        o = "https://abc.preview.emergentagent.com"
        r = requests.options(f"{API}/children", headers={"Origin": o, "Access-Control-Request-Method": "POST",
                                                          "Access-Control-Request-Headers": "content-type,authorization"})
        assert r.status_code == 200, r.text
        assert r.headers.get("access-control-allow-origin") == o
        assert r.headers.get("access-control-allow-credentials") == "true"

    def test_preflight_evil_origin(self):
        r = requests.options(f"{API}/children", headers={"Origin": "https://evil.com", "Access-Control-Request-Method": "POST"})
        assert r.status_code == 400
        assert "access-control-allow-origin" not in {k.lower() for k in r.headers}

    def test_preflight_suffix_attack(self):
        r = requests.options(f"{API}/children", headers={"Origin": "https://emergentagent.com.evil.com", "Access-Control-Request-Method": "GET"})
        assert r.status_code == 400


# Custom quests
class TestQuests:
    def test_manual_save_and_delete(self, s, child):
        cid = child["child_id"]
        r = s.post(f"{API}/children/{cid}/quests", json={"title": "TEST quête", "domainId": "social",
                                                         "steps": [{"title": "Étape 1"}, {"title": "Étape 2"}]})
        assert r.status_code == 200, r.text
        q = r.json()["custom_quests"][-1]
        assert q["title"] == "TEST quête" and q["custom"] is True and q["id"].startswith("cq_")
        assert [st["status"] for st in q["steps"]] == ["à venir", "à venir"]
        # step done gives XP
        xp0 = r.json()["xp"]
        r2 = s.put(f"{API}/children/{cid}/quests/{q['id']}/steps/0", json={"status": "fait"})
        assert r2.json()["xp"] == xp0 + 50
        r3 = s.delete(f"{API}/children/{cid}/quests/{q['id']}")
        assert r3.status_code == 200
        assert all(x["id"] != q["id"] for x in r3.json()["custom_quests"])
        g = s.get(f"{API}/children/{cid}").json()
        assert all(x["id"] != q["id"] for x in g["custom_quests"])

    def test_manual_validation(self, s, child):
        cid = child["child_id"]
        assert s.post(f"{API}/children/{cid}/quests", json={"title": "x", "domainId": "social", "steps": []}).status_code == 422
        assert s.post(f"{API}/children/{cid}/quests", json={"title": "", "domainId": "social", "steps": [{"title": "a"}]}).status_code == 422
        assert s.post(f"{API}/children/{cid}/quests", json={"title": "x", "domainId": "bad", "steps": [{"title": "a"}]}).status_code == 400
        assert s.post(f"{API}/children/{cid}/quests", json={"title": "x", "domainId": "social", "steps": [{"title": "a"}] * 7}).status_code == 422

    def test_generate_ai(self, s, child):
        cid = child["child_id"]
        r = s.post(f"{API}/children/{cid}/quests/generate", json={"domain_id": "emotionnel", "goal": "mieux gérer la frustration"}, timeout=90)
        assert r.status_code == 200, r.text
        q = r.json()["custom_quests"][-1]
        assert q["domainId"] == "emotionnel" and q["title"]
        assert 1 <= len(q["steps"]) <= 6
        assert all(st["title"] for st in q["steps"])

    def test_generate_bad_domain(self, s, child):
        r = s.post(f"{API}/children/{child['child_id']}/quests/generate", json={"domain_id": "nope"}, timeout=90)
        assert r.status_code in (400, 502)


# Shares
class TestShares:
    def test_add_remove_share(self, s, child):
        cid = child["child_id"]
        r = s.post(f"{API}/children/{cid}/shares", json={"email": "TEST_Pro@Example.com", "role": "pro"})
        assert r.status_code == 200, r.text
        sh = r.json()["shares"]
        assert sh[-1]["email"] == "test_pro@example.com" and sh[-1]["role"] == "pro"
        # re-share updates role, no duplicate
        r = s.post(f"{API}/children/{cid}/shares", json={"email": "test_pro@example.com", "role": "parent"})
        assert len([x for x in r.json()["shares"] if x["email"] == "test_pro@example.com"]) == 1
        assert r.json()["shares"][-1]["role"] == "parent"
        r = s.delete(f"{API}/children/{cid}/shares/test_pro@example.com")
        assert r.status_code == 200
        assert s.get(f"{API}/children/{cid}").json()["shares"] == []

    def test_invalid_email(self, s, child):
        assert s.post(f"{API}/children/{child['child_id']}/shares", json={"email": "nope", "role": "pro"}).status_code == 422

    def test_invalid_role(self, s, child):
        assert s.post(f"{API}/children/{child['child_id']}/shares", json={"email": "a@b.co", "role": "admin"}).status_code == 422

    def test_self_share(self, s, child):
        me = s.get(f"{API}/auth/me").json()
        r = s.post(f"{API}/children/{child['child_id']}/shares", json={"email": me["email"], "role": "pro"})
        assert r.status_code == 400

    def test_observation_author(self, s, child):
        cid = child["child_id"]
        r = s.post(f"{API}/children/{cid}/observations", json={"domain_id": "social", "date": "2026-01-10", "fact": "TEST fait"})
        assert r.status_code == 200
        assert r.json()["author"] == "Mode démo"
