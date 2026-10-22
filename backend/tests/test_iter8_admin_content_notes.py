# Iteration 8: setup status, editable content, child notes, audit log
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
CREDS = {
    "admin": ("admin@enfanceplus.fr", "Admin2026!"),
    "educ": ("educateur@enfanceplus.fr", "Educateur2026!"),
    "dir": ("direction@enfanceplus.fr", "Direction2026!"),
}


def login(who):
    s = requests.Session()
    e, p = CREDS[who]
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": e, "password": p})
    if r.status_code != 200:
        pytest.skip(f"login failed {who}: {r.status_code} {r.text}")
    return s


@pytest.fixture(scope="module")
def admin():
    return login("admin")


@pytest.fixture(scope="module")
def educ():
    return login("educ")


@pytest.fixture(scope="module")
def direction():
    return login("dir")


# --- Setup ---
class TestSetup:
    def test_status(self):
        r = requests.get(f"{BASE_URL}/api/setup/status")
        assert r.status_code == 200
        assert r.json()["needs_setup"] is False

    def test_setup_forbidden_when_admin_exists(self):
        r = requests.post(f"{BASE_URL}/api/setup", json={"name": "TEST X", "email": "test_setup@x.fr", "password": "Password123", "demo": False})
        assert r.status_code == 403

    def test_setup_validation(self):
        r = requests.post(f"{BASE_URL}/api/setup", json={"name": "T", "email": "bad", "password": "1"})
        assert r.status_code in (403, 422)


# --- Content ---
class TestContent:
    def test_content_requires_auth(self):
        assert requests.get(f"{BASE_URL}/api/content").status_code == 401

    def test_non_admin_cannot_put(self, educ, direction):
        for s in (educ, direction):
            r = s.put(f"{BASE_URL}/api/admin/content/domain/social", json={"data": {"name": "hack"}})
            assert r.status_code == 403
            r = s.delete(f"{BASE_URL}/api/admin/content/domain/social")
            assert r.status_code == 403

    def test_bad_kind(self, admin):
        r = admin.put(f"{BASE_URL}/api/admin/content/bogus/x", json={"data": {}})
        assert r.status_code == 400

    def test_save_get_reset(self, admin, educ):
        # unknown ids are now rejected (whitelist); use a real fragility id with full payload
        assert admin.put(f"{BASE_URL}/api/admin/content/fragility/TEST_item", json={"data": {"intro": "x"}}).status_code == 400
        item = "f-sommeil"
        r = admin.put(f"{BASE_URL}/api/admin/content/fragility/{item}", json={"data": {"id": item, "label": "Sommeil", "intro": "TEST intro"}})
        assert r.status_code == 200 and r.json()["updated_by"]
        docs = educ.get(f"{BASE_URL}/api/content").json()
        d = [x for x in docs if x["item_id"] == item]
        assert d and d[0]["data"]["intro"] == "TEST intro" and "_id" not in d[0]
        assert admin.delete(f"{BASE_URL}/api/admin/content/fragility/{item}").status_code == 200
        docs = admin.get(f"{BASE_URL}/api/content").json()
        assert not [x for x in docs if x["item_id"] == item]


# --- Notes ---
class TestNotes:
    def test_crud_and_permissions(self, admin, educ, direction):
        base = f"{BASE_URL}/api/children/seed_leo/notes"
        r = admin.post(base, json={"text": "TEST_note admin"})
        assert r.status_code == 200
        note = r.json()
        nid = note["note_id"]
        assert note["author_name"] and note["updated_at"] is None
        try:
            # educator & direction can read
            for s in (educ, direction):
                lst = s.get(base)
                assert lst.status_code == 200
                assert any(n["note_id"] == nid for n in lst.json())
            # educator cannot edit/delete admin note
            assert educ.put(f"{base}/{nid}", json={"text": "x"}).status_code == 403
            assert educ.delete(f"{base}/{nid}").status_code == 403
            # direction read-only
            assert direction.post(base, json={"text": "TEST dir"}).status_code == 403
            assert direction.put(f"{base}/{nid}", json={"text": "x"}).status_code == 403
            # admin update
            r = admin.put(f"{base}/{nid}", json={"text": "TEST_note edited"})
            assert r.status_code == 200 and r.json()["text"] == "TEST_note edited" and r.json()["updated_at"]
            # empty text rejected
            assert admin.post(base, json={"text": ""}).status_code == 422
            # educator own note
            r = educ.post(base, json={"text": "TEST_note educ"})
            assert r.status_code == 200
            enid = r.json()["note_id"]
            assert educ.put(f"{base}/{enid}", json={"text": "TEST_note educ2"}).status_code == 200
            assert educ.delete(f"{base}/{enid}").status_code == 200
        finally:
            assert admin.delete(f"{base}/{nid}").status_code == 200
        assert not any(n["note_id"] == nid for n in admin.get(base).json())

    def test_educ_unassigned_child(self, educ):
        assert educ.get(f"{BASE_URL}/api/children/seed_noah/notes").status_code == 404
        assert educ.post(f"{BASE_URL}/api/children/seed_noah/notes", json={"text": "x"}).status_code == 404

    def test_note_wrong_child(self, admin):
        base = f"{BASE_URL}/api/children/seed_leo/notes"
        nid = admin.post(base, json={"text": "TEST_cross"}).json()["note_id"]
        try:
            assert admin.put(f"{BASE_URL}/api/children/seed_maya/notes/{nid}", json={"text": "x"}).status_code == 404
        finally:
            admin.delete(f"{base}/{nid}")


# --- Audit ---
class TestAudit:
    def test_audit_admin_only(self, admin, educ):
        assert educ.get(f"{BASE_URL}/api/admin/audit").status_code == 403
        logs = admin.get(f"{BASE_URL}/api/admin/audit?limit=300").json()
        actions = {l["action"] for l in logs}
        assert "auth.login" in actions
        assert any(a.startswith("POST /children/seed_leo/notes") for a in actions)
        assert "content.update" in actions and "content.reset" in actions
        assert all("_id" not in l for l in logs)
