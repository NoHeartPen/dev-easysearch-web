import json

import ipadic  # type: ignore
import MeCab  # type: ignore
from flask import Flask, jsonify, render_template, request, send_from_directory

from utils.check_result.check_get import get_for_url
from utils.langs.mecab_utls import get_full_jishokei, get_word_jishokei

app = Flask(__name__)


@app.route("/")
def return_index():
    return render_template("index.html")


@app.route("/sw.js")
def return_service_worker():
    # 由于 ServiceWorker 限制，必须在网站根目录注册才能控制全局
    return send_from_directory("static/src", "sw.js")


@app.route("/search", methods=["POST"])
def do_check_result():
    try:
        input_data: list = request.get_json()  # type: ignore
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
def do_init_urls() -> dict:
    """
    返回初始化的网页链接配置
    :return: dict json 格式的网页链接配置文件数据
    """
    with open("static/init-url.json", "r") as f:
        data = json.load(f)
        return data


@app.route("/word-analyze", methods=["POST"])
def word_analyze():
    """
    分析用户输入的文本，返回其中的第一个单词。
    """
    data = request.get_json()
    input_text = data.get("text", "")
    tagger = MeCab.Tagger(ipadic.MECAB_ARGS)
    jishokei_result = get_word_jishokei(tagger, input_text)
    return jsonify(jishokei_result)


@app.route("/full-analyze", methods=["POST"])
def full_analyze():
    """
    分析用户输入的文本，返回其中所有的单词。
    """
    data = request.get_json()
    input_text = data.get("text", "")
    tagger = MeCab.Tagger(ipadic.MECAB_ARGS)
    jishokei_result = get_full_jishokei(tagger, input_text)
    return jsonify(jishokei_result)


if __name__ == "__main__":
    app.run()
