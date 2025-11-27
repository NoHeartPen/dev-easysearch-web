import json

import MeCab  # type: ignore
import ipadic  # type: ignore
from quart import Quart, render_template, jsonify, request

from utils.check_result.check_get import get_for_url
from utils.langs.mecab_utls import get_full_jishokei, get_word_jishokei

app = Quart(__name__)


@app.route("/")
async def return_index():
    return await render_template("index.html")


@app.route("/search", methods=["POST"])
async def do_check_result():
    try:
        input_data: list = await request.get_json()  # type: ignore
        result_data = {}
        # TODO 多线程处理
        for item in input_data:
            if item["check_method"] == "get":
                check_result = get_for_url(item["search_url"], headers=None, not_found_text=item["not_found_text"])
                result_data.setdefault(item["url_index"], [item["search_url"], check_result])
        return result_data
    except Exception as e:
        print("错误:", e)
        return (jsonify({""}),)


@app.route("/init-urls", methods=["POST"])
async def do_init_urls() -> dict:
    """
    返回初始化的网页链接配置
    :return: dict json 格式的网页链接配置文件数据
    """
    with open("static/init-url.json", "r") as f:
        data = json.load(f)
        return data


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
