# Iteration 9: shared calendar events, reminders, roots/factor content
import os
import datetime as dt
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
CREDS = {
    "admin": ("admin@enfanceplus.fr", "Admin2026!"),
    "educ": ("educateur@enfanceplus.fr", "Educateur2026!"),
    "dir": ("direction@enfanceplus.fr", "Direction2026!"),
}
TODAY = dt.date.today()
MONTH = TODAY.strftime("%Y-%m")
START = f"{TODAY.isoformat()}T09:30"


def login(who):
    s = requests.Session()
    e, p = CREDS[who]
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": e, "password": p})
    if r.status_code != 200:
        pytest.skip(f"login failed {who}: {r.status_code}")
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


def ev(title="TEST_evt", **kw):
    return {"title": title, "kind": "rdv", "start": START, "duration": 45, "location": "Salle A", "notes": "", **kw}


# --- Calendar ---
class TestEvents:
    def test_requires_auth(self):
        assert requests.get(f"{BASE_URL}/api/events").status_code == 401

    def test_educator_crud(self, educ, direction, admin):
        r = educ.post(f"{BASE_URL}/api/children/seed_leo/events", json=ev(kind="reunion"))
        assert r.status_code == 200, r.text
        e = r.json()
        assert e["event_id"].startswith("evt_") and e["child_name"] and e["kind"] == "reunion" and "_id" not in e
        eid = e["event_id"]
        try:
            lst = educ.get(f"{BASE_URL}/api/events", params={"child_id": "seed_leo", "start": f"{MONTH}-01", "end": "2999-01-01"}).json()
            assert any(x["event_id"] == eid for x in lst)
            # direction + admin can read
            assert any(x["event_id"] == eid for x in direction.get(f"{BASE_URL}/api/events").json())
            assert any(x["event_id"] == eid for x in admin.get(f"{BASE_URL}/api/events?child_id=seed_leo").json())
            # direction cannot write
            assert direction.put(f"{BASE_URL}/api/children/seed_leo/events/{eid}", json=ev("TEST_x")).status_code == 403
            assert direction.delete(f"{BASE_URL}/api/children/seed_leo/events/{eid}").status_code == 403
            # update
            u = educ.put(f"{BASE_URL}/api/children/seed_leo/events/{eid}", json=ev("TEST_evt_upd", duration=90))
            assert u.status_code == 200 and u.json()["title"] == "TEST_evt_upd" and u.json()["duration"] == 90
            # wrong child id for event -> 404
            assert educ.put(f"{BASE_URL}/api/children/seed_maya/events/{eid}", json=ev()).status_code == 404
            # previous month filter excludes it
            first = TODAY.replace(day=1)
            prev = (first - dt.timedelta(days=1)).replace(day=1)
            lp = educ.get(f"{BASE_URL}/api/events", params={"child_id": "seed_leo", "start": prev.isoformat(), "end": first.isoformat()}).json()
            assert not any(x["event_id"] == eid for x in lp)
        finally:
            assert educ.delete(f"{BASE_URL}/api/children/seed_leo/events/{eid}").status_code == 200
        lst = educ.get(f"{BASE_URL}/api/events?child_id=seed_leo").json()
        assert not any(x["event_id"] == eid for x in lst)

    def test_direction_post_403(self, direction):
        assert direction.post(f"{BASE_URL}/api/children/seed_leo/events", json=ev()).status_code == 403

    def test_educator_unassigned_404(self, educ):
        assert educ.get(f"{BASE_URL}/api/events?child_id=seed_noah").status_code == 404
        assert educ.post(f"{BASE_URL}/api/children/seed_noah/events", json=ev()).status_code == 404

    def test_educator_list_scope(self, educ, admin):
        r = admin.post(f"{BASE_URL}/api/children/seed_noah/events", json=ev("TEST_noah"))
        assert r.status_code == 200
        eid = r.json()["event_id"]
        try:
            assert not any(x["child_id"] == "seed_noah" for x in educ.get(f"{BASE_URL}/api/events").json())
        finally:
            admin.delete(f"{BASE_URL}/api/children/seed_noah/events/{eid}")

    @pytest.mark.parametrize("bad", [{"title": ""}, {"kind": "xx"}, {"start": "2026-01-01"}, {"duration": 1}, {"duration": 1000}])
    def test_validation(self, educ, bad):
        assert educ.post(f"{BASE_URL}/api/children/seed_leo/events", json=ev(**bad)).status_code == 422


# --- Reminders ---
class TestReminders:
    def test_direction_empty(self, direction):
        r = direction.get(f"{BASE_URL}/api/reminders")
        assert r.status_code == 200 and r.json() == []

    def test_educator_maya_then_note_clears(self, educ):
        ids = [x["child_id"] for x in educ.get(f"{BASE_URL}/api/reminders").json()]
        assert "seed_maya" in ids
        assert "seed_noah" not in ids  # not assigned
        n = educ.post(f"{BASE_URL}/api/children/seed_maya/notes", json={"text": "TEST_reminder note"})
        assert n.status_code == 200
        nid = n.json()["note_id"]
        try:
            ids2 = [x["child_id"] for x in educ.get(f"{BASE_URL}/api/reminders").json()]
            assert "seed_maya" not in ids2
        finally:
            educ.delete(f"{BASE_URL}/api/children/seed_maya/notes/{nid}")
        assert "seed_maya" in [x["child_id"] for x in educ.get(f"{BASE_URL}/api/reminders").json()]

    def test_admin_sees_all(self, admin):
        ids = [x["child_id"] for x in admin.get(f"{BASE_URL}/api/reminders").json()]
        assert "seed_maya" in ids and "seed_noah" in ids


# --- Roots / factor content ---
ROOTS = ["Cadre familial", "Relations", "École", "Repos", "Événements"]


class TestRootsFactor:
    def test_roots_save_reset(self, admin, educ):
        assert educ.put(f"{BASE_URL}/api/admin/content/roots/all", json={"data": {"id": "all", "labels": ROOTS}}).status_code == 403
        r = admin.put(f"{BASE_URL}/api/admin/content/roots/all", json={"data": {"id": "all", "labels": ROOTS}})
        assert r.status_code == 200 and r.json()["data"]["labels"][0] == "Cadre familial"
        try:
            c = educ.get(f"{BASE_URL}/api/content").json()
            assert any(x["kind"] == "roots" and x["data"]["labels"][0] == "Cadre familial" for x in c)
            assert admin.put(f"{BASE_URL}/api/admin/content/roots/all", json={"data": {"id": "all", "labels": ["", *ROOTS[1:]]}}).status_code == 400
            assert admin.put(f"{BASE_URL}/api/admin/content/roots/all", json={"data": {"id": "all", "labels": ROOTS[:4]}}).status_code == 400
            assert admin.put(f"{BASE_URL}/api/admin/content/roots/x", json={"data": {"id": "x", "labels": ROOTS}}).status_code == 400
        finally:
            assert admin.delete(f"{BASE_URL}/api/admin/content/roots/all").status_code == 200
        assert not any(x["kind"] == "roots" for x in admin.get(f"{BASE_URL}/api/content").json())

    def test_factor_save_reset(self, admin):
        d = {"id": "famille", "label": "TEST_Contexte familial", "description": "TEST desc"}
        r = admin.put(f"{BASE_URL}/api/admin/content/factor/famille", json={"data": d})
        assert r.status_code == 200 and r.json()["data"]["label"] == "TEST_Contexte familial"
        assert admin.put(f"{BASE_URL}/api/admin/content/factor/famille", json={"data": {**d, "label": ""}}).status_code == 400
        assert admin.delete(f"{BASE_URL}/api/admin/content/factor/famille").status_code == 200
        audit = admin.get(f"{BASE_URL}/api/admin/audit").json()
        items = audit if isinstance(audit, list) else audit.get("items", audit.get("logs", []))
        txt = str(items)
        assert "roots:all" in txt and "factor:famille" in txt
