# Iteration 6: personalized painted tree (Gemini image edit) + fictional 12-month level_history
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"


def login(email, pwd):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": email, "password": pwd})
    if r.status_code != 200:
        pytest.skip(f"login failed {email}: {r.status_code} {r.text}")
    tok = r.json().get("session_token")
    if tok:
        s.headers["Authorization"] = f"Bearer {tok}"
    return s


@pytest.fixture(scope="module")
def admin():
    return login("admin@enfanceplus.fr", "Admin2026!")


@pytest.fixture(scope="module")
def direction():
    return login("direction@enfanceplus.fr", "Direction2026!")


@pytest.fixture(scope="module")
def educ():
    return login("educateur@enfanceplus.fr", "Educateur2026!")


# --- Seed fictional level_history
class TestSeedHistory:
    @pytest.mark.parametrize("cid", ["seed_leo", "seed_maya", "seed_noah", "seed_ines"])
    def test_fictional_history(self, admin, cid):
        r = admin.get(f"{API}/children/{cid}")
        assert r.status_code == 200
        c = r.json()
        fict = [h for h in c["level_history"] if h.get("fictional")]
        assert len(fict) >= 3, f"{cid} has {len(fict)} fictional entries"
        for h in fict:
            assert h["to"] <= c["levels"][h["domain_id"]]
        assert "_id" not in c

    def test_maya_has_tree_image(self, admin):
        c = admin.get(f"{API}/children/seed_maya").json()
        assert c.get("tree_image", "").startswith("/api/avatars/")
        img = requests.get(f"{BASE_URL}{c['tree_image']}")
        assert img.status_code == 200 and img.headers["content-type"].startswith("image/")


# --- Permissions / validation on tree endpoints
class TestTreePermissions:
    def test_direction_forbidden_generate(self, direction):
        r = direction.post(f"{API}/children/seed_leo/tree/generate")
        assert r.status_code == 403

    def test_direction_forbidden_delete(self, direction):
        r = direction.delete(f"{API}/children/seed_maya/tree")
        assert r.status_code == 403

    def test_educ_unassigned_404(self, educ):
        r = educ.post(f"{API}/children/seed_noah/tree/generate")
        assert r.status_code == 404

    def test_no_portrait_400(self, admin):
        r = admin.post(f"{API}/children", json={"name": "TEST_Arbre", "age": 7, "grade": "CE1"})
        assert r.status_code in (200, 201), r.text
        cid = r.json()["child_id"]
        try:
            g = admin.post(f"{API}/children/{cid}/tree/generate")
            assert g.status_code == 400, g.text
            assert "avatar" in g.json()["detail"].lower()
        finally:
            admin.delete(f"{API}/children/{cid}")

    def test_unknown_child_404(self, admin):
        assert admin.post(f"{API}/children/nope_xyz/tree/generate").status_code == 404


# --- Real AI generation (1 call) on Léo, then reset
class TestTreeGenerate:
    def test_generate_then_reset(self, admin):
        r = admin.post(f"{API}/children/seed_leo/tree/generate", timeout=120)
        assert r.status_code == 200, r.text
        c = r.json()
        assert c["tree_image"].startswith("/api/avatars/")
        img = requests.get(f"{BASE_URL}{c['tree_image']}")
        assert img.status_code == 200 and img.headers["content-type"].startswith("image/")
        assert len(img.content) > 10000
        g = admin.get(f"{API}/children/seed_leo").json()
        assert g["tree_image"] == c["tree_image"]
        d = admin.delete(f"{API}/children/seed_leo/tree")
        assert d.status_code == 200 and "tree_image" not in d.json()
        assert "tree_image" not in admin.get(f"{API}/children/seed_leo").json()
