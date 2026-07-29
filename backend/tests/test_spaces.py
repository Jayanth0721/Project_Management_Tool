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
async def test_create_space(async_client):
    login_data = await login(async_client, (await register(async_client, "space-creator@tolab.dev", "Creator", "password123"))["email"], "password123")
    token = login_data["access_token"]

    ws_resp = await async_client.post("/api/v1/workspaces", json={
        "name": "Space WS",
        "slug": "space-ws",
    }, headers={"Authorization": f"Bearer {token}"})
    ws = ws_resp.json()
    ws_id = ws["id"]

    resp = await async_client.post(f"/api/v1/workspaces/{ws_id}/spaces", json={
        "key": "docs",
        "name": "Documentation",
        "description": "Project docs",
        "icon": "book",
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["key"] == "docs"
    assert data["name"] == "Documentation"
    assert data["description"] == "Project docs"
    assert data["icon"] == "book"


@pytest.mark.asyncio
async def test_get_spaces(async_client):
    login_data = await login(async_client, (await register(async_client, "space-lister@tolab.dev", "Lister", "password123"))["email"], "password123")
    token = login_data["access_token"]

    ws_resp = await async_client.post("/api/v1/workspaces", json={
        "name": "List WS",
        "slug": "list-ws",
    }, headers={"Authorization": f"Bearer {token}"})
    ws = ws_resp.json()
    ws_id = ws["id"]

    await async_client.post(f"/api/v1/workspaces/{ws_id}/spaces", json={
        "key": "notes",
        "name": "Notes",
    }, headers={"Authorization": f"Bearer {token}"})

    resp = await async_client.get(f"/api/v1/workspaces/{ws_id}/spaces", headers={
        "Authorization": f"Bearer {token}",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    keys = [s["key"] for s in data]
    assert "notes" in keys


@pytest.mark.asyncio
async def test_unauthorized_space_access(async_client):
    # User A creates workspace and space
    login_data_a = await login(async_client, (await register(async_client, "user-a@tolab.dev", "UserA", "password123"))["email"], "password123")
    token_a = login_data_a["access_token"]

    ws_resp = await async_client.post("/api/v1/workspaces", json={
        "name": "A Workspace",
        "slug": "a-workspace",
    }, headers={"Authorization": f"Bearer {token_a}"})
    ws = ws_resp.json()
    ws_id = ws["id"]

    await async_client.post(f"/api/v1/workspaces/{ws_id}/spaces", json={
        "key": "private",
        "name": "Private Space",
    }, headers={"Authorization": f"Bearer {token_a}"})

    # User B is not a member
    login_data_b = await login(async_client, (await register(async_client, "user-b@tolab.dev", "UserB", "password123"))["email"], "password123")
    token_b = login_data_b["access_token"]

    resp = await async_client.get(f"/api/v1/workspaces/{ws_id}/spaces/private", headers={
        "Authorization": f"Bearer {token_b}",
    })
    assert resp.status_code == 403