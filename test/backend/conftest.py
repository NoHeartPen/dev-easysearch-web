import pytest

from app import app as quart_app


@pytest.fixture
async def client():
    async with quart_app.test_client() as client:
        yield client
