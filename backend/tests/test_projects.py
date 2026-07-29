import pytest


async def register(async_client, email: str, full_name: str, password: str) -> dict:
    resp = await async_client.post("/api/v1/auth/register", json={
        "email": email,
        "full_name": full_name,
        "password": password,
    })
    return resp.json()


async def login(async_client, email: str, password: str) -> dict:
    resp = await async_client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password,
    })
    return resp.json()


@pytest.mark.asyncio
async def test_create_project(async_client):
    login_data = await login(async_client, (await register(async_client, "proj-creator@tolab.dev", "Creator", "password123"))["email"], "password123")
    token = login_data["access_token"]

    ws_resp = await async_client.post("/api/v1/workspaces", json={
        "name": "Project WS",
        "slug": "project-ws",
    }, headers={"Authorization": f"Bearer {token}"})
    ws = ws_resp.json()
    ws_id = ws["id"]

    resp = await async_client.post(f"/api/v1/workspaces/{ws_id}/projects", json={
        "key": "TEST",
        "name": "Test Project",
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["key"] == "TEST"
    assert data["name"] == "Test Project"


@pytest.mark.asyncio
async def test_list_projects(async_client):
    login_data = await login(async_client, (await register(async_client, "proj-lister@tolab.dev", "Lister", "password123"))["email"], "password123")
    token = login_data["access_token"]

    ws_resp = await async_client.post("/api/v1/workspaces", json={
        "name": "List WS",
        "slug": "list-ws",
    }, headers={"Authorization": f"Bearer {token}"})
    ws = ws_resp.json()
    ws_id = ws["id"]

    await async_client.post(f"/api/v1/workspaces/{ws_id}/projects", json={
        "key": "A", "name": "Project A",
    }, headers={"Authorization": f"Bearer {token}"})
    await async_client.post(f"/api/v1/workspaces/{ws_id}/projects", json={
        "key": "B", "name": "Project B",
    }, headers={"Authorization": f"Bearer {token}"})

    resp = await async_client.get(f"/api/v1/workspaces/{ws_id}/projects", headers={
        "Authorization": f"Bearer {token}",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 2


@pytest.mark.asyncio
async def test_create_issue(async_client):
    login_data = await login(async_client, (await register(async_client, "issue-creator@tolab.dev", "IssueCreator", "password123"))["email"], "password123")
    token = login_data["access_token"]

    ws_resp = await async_client.post("/api/v1/workspaces", json={
        "name": "Issue WS",
        "slug": "issue-ws",
    }, headers={"Authorization": f"Bearer {token}"})
    ws = ws_resp.json()
    ws_id = ws["id"]

    proj_resp = await async_client.post(f"/api/v1/workspaces/{ws_id}/projects", json={
        "key": "ISS", "name": "Issue Project",
    }, headers={"Authorization": f"Bearer {token}"})
    proj = proj_resp.json()

    resp = await async_client.post(f"/api/v1/projects/{proj['key']}/issues", json={
        "summary": "First issue",
        "description": "Description here",
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["key"].startswith("ISS-")
    assert data["summary"] == "First issue"


@pytest.mark.asyncio
async def test_unauthorized_project(async_client):
    login_data_a = await login(async_client, (await register(async_client, "proj-user-a@tolab.dev", "UserA", "password123"))["email"], "password123")
    token_a = login_data_a["access_token"]

    ws_resp = await async_client.post("/api/v1/workspaces", json={
        "name": "A Workspace",
        "slug": "a-ws",
    }, headers={"Authorization": f"Bearer {token_a}"})
    ws = ws_resp.json()
    ws_id = ws["id"]

    proj_resp = await async_client.post(f"/api/v1/workspaces/{ws_id}/projects", json={
        "key": "PRIV", "name": "Private",
    }, headers={"Authorization": f"Bearer {token_a}"})
    proj = proj_resp.json()

    login_data_b = await login(async_client, (await register(async_client, "proj-user-b@tolab.dev", "UserB", "password123"))["email"], "password123")
    token_b = login_data_b["access_token"]

    resp = await async_client.get(f"/api/v1/workspaces/{ws_id}/projects/{proj['key']}", headers={
        "Authorization": f"Bearer {token_b}",
    })
    assert resp.status_code == 403