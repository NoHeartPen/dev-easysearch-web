import re

import requests

from .result_info import CountCheckResult

DEFAULT_HEADER = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.70"


def post_url(
    url: str,
    word: str,
    headers: dict | None,
    data_word_key: str | None,
    check_text: str,
) -> bool:
    """向网站发起 POST 请求，如果网站返回的数据中不包含指定的关键字，返回 True，否则返回 False。

    Args:
        url:
        headers:
        data_word_key: 构造 Header 中的搜索词的键名
        word: 搜索词
        check_text: 当返回的结果中包含这些文字时，视为不存在相应的结果。


    Returns:
        当返回的网页中不包含指定的文字时返回 True，否则返回 False。
    """
    if headers is None:
        headers = {
            "User-Agent": DEFAULT_HEADER,
        }
    result = requests.post(url, data={data_word_key: word}, headers=headers)
    result_text = result.text
    if check_text in result_text:
        return False
    return True


def post_with_count_check(
    url: str,
    word: str,
    headers: dict | None,
    data_word_key: str | None,
    not_found_text: str,
    check_regex: str,
    regex_group: str,
) -> CountCheckResult:
    """向网站发起 POST 请求，同时使用正则表达式提取返回结果中的部分内容。

    Args:
        url: 需要发起请求的网站，只支持 POST 类型的提交。
        headers: 发起请求时使用的请求头。
        data_word_key: 构造 Header 中的搜索词的键名。
        word: 搜索词。
        not_found_text: 当返回的结果中包含该参数的文字时，将视为网站未搜索到相关内容。例：見出し語は見つかりませんでした。
        check_regex: 提取网页中指定内容的正则表达式。
        regex_group: 返回指定内容的分组。

    Returns:
        CountCheckResult:
            result: 搜索结果。网站返回的内容中不含 not_found_text 时为 True，否则为 False。
            check_result: 是否提取到指定内容。
            regex_group_text: 指定正则表达式分组的文本内容。未提取到时返回 None。
    """
    if headers is None:
        headers = {
            "User-Agent": DEFAULT_HEADER,
        }
    result = requests.post(url, data={data_word_key: word}, headers=headers)
    result_text = result.text
    if not_found_text in result_text:
        return CountCheckResult(False, False, None)
    match = re.search(check_regex, result_text)
    if match:
        return CountCheckResult(True, True, match.group(regex_group))
    else:
        return CountCheckResult(True, False, None)
