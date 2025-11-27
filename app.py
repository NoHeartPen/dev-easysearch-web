import asyncio
import json

import MeCab  # type: ignore
import anyio
import ipadic  # type: ignore
from quart import Quart, render_template, jsonify, request

from utils.check_result.check_get import async_get_for_url
from utils.langs.mecab_utls import get_full_jishokei, get_word_jishokei

app = Quart(__name__)


@app.route("/")
async def return_index():
    return await render_template("index.html")


async def _fetch_all_urls(items: list[dict]) -> list[bool]:
    """并发获取所有URL的检查结果"""
    tasks = [
        async_get_for_url(
            item["search_url"],
            headers=None,
            not_found_text=item.get("not_found_text"),
        )
        for item in items
    ]
    return await asyncio.gather(*tasks)


def _build_result_data(items: list[dict], results: list[bool]) -> dict[str, list]:
    """构建结果数据字典"""
    result_data = {}
    for item, ok in zip(items, results):
        url_index = str(item["url_index"])
        result_data[url_index] = [item["search_url"], ok]
    return result_data


@app.route("/search", methods=["POST"])
async def do_check_result():
    try:
        input_data = await request.get_json()
        filtered_items = [
            item for item in input_data if item.get("check_method") == "get"
        ]
        results = await _fetch_all_urls(filtered_items)
        return _build_result_data(filtered_items, results)
    except Exception as e:
        print("错误:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/init-urls", methods=["POST"])
async def do_init_urls() -> dict:
    """
    返回初始化的网页链接配置
    :return: dict json 格式的网页链接配置文件数据
    """
    async with await anyio.open_file("static/init-url.json", "r") as f:
        return json.loads(await f.read())


@app.route("/word-analyze", methods=["POST"])
async def word_analyze():
    """
    分析用户输入的文本，返回其中的第一个单词。
    """
    data = await request.get_json()
    input_text = data.get("text", "")
    tagger = MeCab.Tagger(ipadic.MECAB_ARGS)
    jishokei_result = get_word_jishokei(tagger, input_text)
    return jsonify(jishokei_result)


@app.route("/full-analyze", methods=["POST"])
async def full_analyze():
    """
    分析用户输入的文本，返回其中所有的单词。
    """
    data = await request.json
    input_text = data.get("text", "")
    tagger = MeCab.Tagger(ipadic.MECAB_ARGS)
    jishokei_result = get_full_jishokei(tagger, input_text)
    return jsonify(jishokei_result)


if __name__ == "__main__":
    app.run()
