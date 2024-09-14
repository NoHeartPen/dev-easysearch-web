import json

from flask import Flask, send_from_directory
from flask import render_template, request, jsonify

from utils.check_result.check_get import get_for_url
app = Flask(__name__)


@app.route('/')
def return_index():
    return render_template("index.html")


@app.route('/sw.js')
def return_service_worker():
    # 由于 ServiceWorker 限制，必须在网站根目录注册才能控制全局
    return send_from_directory('static/src', 'sw.js')


@app.route('/search', methods=['POST'])
def do_check_result():
    try:
        input_data: list = request.get_json()
        result_data = {}
        # TODO 多线程处理
        for item in input_data:
            if item["check_method"] == "get":
                check_result = get_for_url(item['search_url'], headers=None, not_found_text=item['not_found_text'])
                result_data.setdefault(item['url_index'], [item['search_url'], check_result])
        return result_data
    except Exception as e:
        print('错误:', e)
        return jsonify({""}),


@app.route("/init-urls", methods=['POST'])
def do_init_urls() -> dict:
    """
    返回初始化的网页链接配置
    :return: dict json 格式的网页链接配置文件数据
    """
    with open("static/init-url.json", "r") as f:
        data = json.load(f)
        return data


if __name__ == '__main__':
    app.run()
