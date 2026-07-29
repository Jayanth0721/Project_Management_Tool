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
async def test_register(async_client):
    data = await register(async_client, "test@tolab.dev", "Test User", "password123")
    assert data["access_token"] is not None
    assert data["refresh_token"] is not None
    assert data["email"] == "test@tolab.dev"
    assert data["full_name"] == "Test User"


@pytest.mark.asyncio
async def test_register_duplicate(async_client):
    await register(async_client, "dup@tolab.dev", "Dup User", "password123")
    resp = await async_client.post("/api/v1/auth/register", json={
        "email": "dup@tolab.dev",
        "full_name": "Dup User 2",
        "password": "password456",
    })
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_login(async_client):
    await register(async_client, "login@tolab.dev", "Login User", "password123")
    data = await login(async_client, "login@tolab.dev", "password123")
    assert data["access_token"] is not None
    assert data["email"] == "login@tolab.dev"


@pytest.mark.asyncio
async def test_login_bad_password(async_client):
    await register(async_client, "badpw@tolab.dev", "Bad PW User", "password123")
    resp = await async_client.post("/api/v1/auth/login", json={
        "email": "badpw@tolab.dev",
        "password": "wrong",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me(async_client):
    await register(async_client, "me@tolab.dev", "Me User", "password123")
    login_data = await login(async_client, "me@tolab.dev", "password123")
    token = login_data["access_token"]

    resp = await async_client.get("/api/v1/auth/me", headers={
        "Authorization": f"Bearer {token}",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "me@tolab.dev"


@pytest.mark.asyncio
async def test_me_unauthorized(async_client):
    resp = await async_client.get("/api/v1/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_refresh(async_client):
    await register(async_client, "refresh@tolab.dev", "Refresh User", "password123")
    login_data = await login(async_client, "refresh@tolab.dev", "password123")
    refresh_token = login_data["refresh_token"]

    resp = await async_client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["access_token"] is not None
    assert data["refresh_token"] is not None