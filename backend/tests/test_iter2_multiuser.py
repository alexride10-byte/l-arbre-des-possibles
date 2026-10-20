# Multi-user sharing permissions. REQUIRES AUTH_ENABLED=true + sessions tsess_owner / tsess_guest / tsess_other in mongo.
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"


def h(tok):
    return {"Authorization": f"Bearer {tok}"}


@pytest.fixture(scope="module", autouse=True)
def check_auth():
    if requests.get(f"{API}/auth/me").status_code != 401:
        pytest.skip("AUTH_ENABLED is false")


@pytest.fixture(scope="module")
def child():
    r = requests.post(f"{API}/children", json={"name": "TEST_Shared", "age": 9}, headers=h("tsess_owner"))
    assert r.status_code == 200
    c = r.json()
    r = requests.post(f"{API}/children/{c['child_id']}/shares", json={"email": "Guest.User@example.com", "role": "pro"}, headers=h("tsess_owner"))
    assert r.status_code == 200
    yield c
    requests.delete(f"{API}/children/{c['child_id']}", headers=h("tsess_owner"))


def test_guest_lists_shared(child):
    kids = requests.get(f"{API}/children", headers=h("tsess_guest")).json()
    k = next(x for x in kids if x["child_id"] == child["child_id"])
    assert k["owner_name"] == "Owner User"


def test_owner_list_no_owner_name(child):
    kids = requests.get(f"{API}/children", headers=h("tsess_owner")).json()
    k = next(x for x in kids if x["child_id"] == child["child_id"])
    assert "owner_name" not in k


def test_guest_read_write_obs(child):
    cid = child["child_id"]
    assert requests.get(f"{API}/children/{cid}", headers=h("tsess_guest")).status_code == 200
    r = requests.post(f"{API}/children/{cid}/observations", json={"domain_id": "social", "date": "2026-01-10", "fact": "TEST guest"}, headers=h("tsess_guest"))
    assert r.status_code == 200 and r.json()["author"] == "Guest User"
    obs = requests.get(f"{API}/children/{cid}/observations", headers=h("tsess_owner")).json()
    assert any(o["fact"] == "TEST guest" for o in obs)


def test_guest_cannot_delete_child(child):
    assert requests.delete(f"{API}/children/{child['child_id']}", headers=h("tsess_guest")).status_code == 403


def test_guest_cannot_manage_shares(child):
    cid = child["child_id"]
    assert requests.post(f"{API}/children/{cid}/shares", json={"email": "x@y.co", "role": "pro"}, headers=h("tsess_guest")).status_code == 403
    assert requests.delete(f"{API}/children/{cid}/shares/guest.user@example.com", headers=h("tsess_guest")).status_code == 403


def test_other_user_404(child):
    assert requests.get(f"{API}/children/{child['child_id']}", headers=h("tsess_other")).status_code == 404
    kids = requests.get(f"{API}/children", headers=h("tsess_other")).json()
    assert all(k["child_id"] != child["child_id"] for k in kids)


def test_unshare_revokes(child):
    cid = child["child_id"]
    requests.delete(f"{API}/children/{cid}/shares/guest.user@example.com", headers=h("tsess_owner"))
    assert requests.get(f"{API}/children/{cid}", headers=h("tsess_guest")).status_code == 404
