# Iteration 10: security fixes (portrait SSRF, private avatars, read-only sharing, cascade delete)
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
LIB_PORTRAIT = "https://static.prod-images.emergentagent.com/jobs/5a8bc270-5ed8-4704-a01d-2ff7d09abd2b/images/1428c7fbe1ac75360614c550743093fe08b975566e34aae9c837e679651a1dd9.jpeg"
CREDS = {
    "admin": ("admin@enfanceplus.fr", "Admin2026!"),
    "educ": ("educateur@enfanceplus.fr", "Educateur2026!"),
}


def login(email, password):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": email, "password": password})
    if r.status_code != 200:
        pytest.skip(f"login failed {email}: {r.status_code} {r.text}")
    s.headers["Authorization"] = f"Bearer {r.json()['session_token']}"
    return s


@pytest.fixture(scope="module")
def admin():
    return login(*CREDS["admin"])


@pytest.fixture(scope="module")
def educ():
    return login(*CREDS["educ"])


@pytest.fixture()
def child(educ):
    r = educ.post(f"{API}/children", json={"name": "TEST_Secu", "age": 7})
    assert r.status_code == 200
    c = r.json()
    yield c
    educ.delete(f"{API}/children/{c['child_id']}")


@pytest.fixture(scope="module")
def parent(admin):
    # Needs EMAIL_MODE=simulated (dev) to read the verification link
    email, pwd = f"test_parent_{uuid.uuid4().hex[:6]}@x.fr", "Parent2026!"
    r = requests.post(f"{API}/auth/register", json={"name": "TEST Parent", "email": email, "password": pwd, "accept_terms": True})
    link = r.json().get("simulated_link")
    if not link:
        pytest.skip("EMAIL_MODE n'est pas simulated")
    assert requests.post(f"{API}/auth/verify-email", json={"token": link.split("token=")[1]}).status_code == 200
    uid = next(u["user_id"] for u in admin.get(f"{API}/admin/users").json() if u["email"] == email)
    assert admin.put(f"{API}/admin/users/{uid}", json={"status": "active", "role": "parent"}).status_code == 200
    s = login(email, pwd)
    s.email = email
    return s


class TestPortraitSsrf:
    @pytest.mark.parametrize("url", ["http://169.254.169.254/latest/meta-data/", "http://localhost:27017/", "file:///etc/passwd",
                                     "https://evil.example/x.jpeg", "/api/avatars/../../setup"])
    def test_foreign_portrait_rejected(self, educ, child, url):
        r = educ.put(f"{API}/children/{child['child_id']}", json={"avatar": {"face": 0, "hair": 0, "accessory": 0, "portrait": url}})
        assert r.status_code == 422

    def test_library_portrait_accepted(self, educ, child):
        r = educ.put(f"{API}/children/{child['child_id']}", json={"avatar": {"face": 0, "hair": 0, "accessory": 0, "portrait": LIB_PORTRAIT}})
        assert r.status_code == 200
        assert r.json()["avatar"]["portrait"] == LIB_PORTRAIT


class TestPrivateAvatars:
    def test_avatar_requires_auth(self):
        assert requests.get(f"{API}/avatars/{uuid.uuid4().hex}").status_code == 401


class TestSetupCode:
    def test_status_exposes_code_flag(self):
        assert "code_required" in requests.get(f"{API}/setup/status").json()


class TestReadOnlyShare:
    def test_parent_reads_but_cannot_write(self, educ, parent, child):
        cid = child["child_id"]
        assert educ.post(f"{API}/children/{cid}/shares", json={"email": parent.email, "role": "parent"}).status_code == 200
        r = parent.get(f"{API}/children/{cid}")
        assert r.status_code == 200
        listed = next(c for c in parent.get(f"{API}/children").json() if c["child_id"] == cid)
        assert listed["access"] == "readonly"
        assert parent.put(f"{API}/children/{cid}", json={"name": "Pirate"}).status_code == 403
        obs = {"domain_id": "social", "date": "2026-10-01", "fact": "TEST"}
        assert parent.post(f"{API}/children/{cid}/observations", json=obs).status_code == 403
        assert parent.post(f"{API}/children/{cid}/notes", json={"text": "TEST"}).status_code == 403

    def test_unshared_parent_sees_nothing(self, parent, child):
        assert parent.get(f"{API}/children/{child['child_id']}").status_code == 404


class TestCascadeDelete:
    def test_delete_removes_related_data(self, admin, educ):
        cid = educ.post(f"{API}/children", json={"name": "TEST_Cascade", "age": 5}).json()["child_id"]
        assert educ.post(f"{API}/children/{cid}/notes", json={"text": "TEST note"}).status_code == 200
        assert educ.post(f"{API}/children/{cid}/events", json={"title": "TEST rdv", "start": "2026-11-02T10:00"}).status_code == 200
        assert educ.delete(f"{API}/children/{cid}").status_code == 200
        assert admin.get(f"{API}/events", params={"child_id": cid}).json() == []
        assert any(a["action"] == "child.delete" and a["child_id"] == cid for a in admin.get(f"{API}/admin/audit").json())
