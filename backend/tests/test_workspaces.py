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
async def test_create_workspace(async_client):
    login_data = await login(async_client, (await register(async_client, "ws-owner@tolab.dev", "Owner", "password123"))["email"], "password123")
    token = login_data["access_token"]

    resp = await async_client.post("/api/v1/workspaces", json={
        "name": "My Workspace",
        "slug": "my-workspace",
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "My Workspace"
    assert data["slug"] == "my-workspace"


@pytest.mark.asyncio
async def test_create_workspace_duplicate_slug(async_client):
    login_data = await login(async_client, (await register(async_client, "ws-dup@tolab.dev", "Dupper", "password123"))["email"], "password123")
    token = login_data["access_token"]

    resp1 = await async_client.post("/api/v1/workspaces", json={
        "name": "First",
        "slug": "same-slug",
    }, headers={"Authorization": f"Bearer {token}"})

    resp2 = await async_client.post("/api/v1/workspaces", json={
        "name": "Second",
        "slug": "same-slug",
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp2.status_code == 409


@pytest.mark.asyncio
async def test_invite_accept(async_client):
    login_data1 = await login(async_client, (await register(async_client, "inviter@tolab.dev", "Inviter", "password123"))["email"], "password123")
    token1 = login_data1["access_token"]

    result = await async_client.post("/api/v1/workspaces", json={
        "name": "Invite WS",
        "slug": "invite-ws",
    }, headers={"Authorization": f"Bearer {token1}"})
    ws = result.json()
    ws_id = ws["id"]

    invite_resp = await async_client.post(f"/api/v1/workspaces/{ws_id}/invitations", json={
        "email": "invitee@tolab.dev",
        "role": "member",
    }, headers={"Authorization": f"Bearer {token1}"})
    assert invite_resp.status_code == 201
    invite = invite_resp.json()
    invite_token = invite["token"]

    login_data2 = await login(async_client, (await register(async_client, "invitee@tolab.dev", "Invitee", "password123"))["email"], "password123")
    token2 = login_data2["access_token"]

    accept_resp = await async_client.post(f"/api/v1/invitations/{invite_token}/accept", headers={
        "Authorization": f"Bearer {token2}",
    })
    assert accept_resp.status_code == 200
    assert accept_resp.json()["message"] == "Invitation accepted"


@pytest.mark.asyncio
async def test_unauthorized_member_list(async_client):
    login_data1 = await login(async_client, (await register(async_client, "ws-a-owner@tolab.dev", "OwnerA", "password123"))["email"], "password123")
    token1 = login_data1["access_token"]

    result = await async_client.post("/api/v1/workspaces", json={
        "name": "WS A",
        "slug": "ws-a",
    }, headers={"Authorization": f"Bearer {token1}"})
    ws_id = result.json()["id"]

    login_data2 = await login(async_client, (await register(async_client, "ws-b-owner@tolab.dev", "OwnerB", "password123"))["email"], "password123")
    token2 = login_data2["access_token"]

    result2 = await async_client.post("/api/v1/workspaces", json={
        "name": "WS B",
        "slug": "ws-b",
    }, headers={"Authorization": f"Bearer {token2}"})

    resp = await async_client.get(f"/api/v1/workspaces/{ws_id}/members", headers={
        "Authorization": f"Bearer {token2}",
    })
    assert resp.status_code == 403