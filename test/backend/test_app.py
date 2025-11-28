from unittest.mock import patch, mock_open

import pytest

from app import app as quart_app


@pytest.fixture
def app():
    return quart_app


@pytest.mark.asyncio
async def test_return_index(client):
    response = await client.get("/")
    assert response.status_code == 200
    res_text = await response.get_data(as_text=True)
    assert "html" in res_text.lower()


@pytest.mark.asyncio
async def test_do_check_result(client):
    payload = [
        {
            "check_method": "get",
            "search_url": "https://www.dictionary.com/browse/test",
            "not_found_text": "No results found for",
            "url_index": 0,
        },
        {
            "check_method": "get",
            "search_url": "https://www.weblio.jp/content/test",
            "not_found_text": "見出し語は見つかりませんでした",
            "url_index": 8,
        },
    ]
    response = await client.post("/search", json=payload)
    assert response.status_code == 200
    data = await response.get_json()
    # 返回的数据结构：data[url_index] = [search_url, check_result]
    assert data["0"][0] == "https://www.dictionary.com/browse/test"
    assert data["0"][1] is True
    assert data["8"][0] == "https://www.weblio.jp/content/test"
    assert data["8"][1] is True


@pytest.mark.asyncio
@patch("builtins.open", new_callable=mock_open, read_data='{"a": 1}')
async def test_do_init_urls(mock_file, client):
    response = await client.post("/init-urls")
    assert response.status_code == 200
    data = await response.get_json(force=True)
    assert data == {"a": 1}


@pytest.mark.asyncio
async def test_full_analyze(client):
    response = await client.post("/full-analyze", json={"text": "晩御飯を食べました"})
    assert response.status_code == 200
    result = await response.get_json(force=True)
    assert result == ["晩", "御飯", "食べる"]


@pytest.mark.asyncio
async def test_word_analyze(client):
    response = await client.post("/word-analyze", json={"text": "食べました"})
    assert response.status_code == 200
    result = await response.get_json(force=True)
    assert result == ["食べる"]
