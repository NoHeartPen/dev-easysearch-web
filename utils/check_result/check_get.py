import re

import requests

from .result_info import CountCheckResult

DEFAULT_HEADER = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.70"


def get_for_url(
    url: str,
    headers: str | None,
    not_found_text: str | None,
) -> bool:
    """向网站发起请求，如果网站返回的数据中不包含指定的关键字，返回 True，否则返回 False。

    Args:
        url: 需要发起请求的网站，只支持 Get 类型的提交。
        headers: 发起请求时使用的请求头。
        not_found_text: 当返回的结果中包含该参数的文字时，视为给网站未搜索到相关内容。

    Returns:
        当返回的网页中不包含指定的文字时返回 True，否则返回 False。
    """
    if headers is not None:
        headers = {
            "User-Agent": DEFAULT_HEADER,
        }
    result = requests.get(url, headers=headers)
    if not_found_text in result.text:
        return False
    return True


def get_url_with_count_check(
    url: str,
    headers: str | None,
    not_found_text: str | None,
    check_regex: str | None,
    regex_group: str | int | None,
) -> CountCheckResult:
    """向网站发起 Get 请求，同时使用正则表达式提取返回结果中的部分内容。

    Args:
        url:
        headers:
        check_regex:
        regex_group: 提取网页中的结果数量的正则表达式分组
        not_found_text: 当返回的结果中包含该参数的文字时，将视为网站未搜索到相关内容。。
            例：見出し語は見つかりませんでした。


    Returns:

    """
    if headers is None:
        headers = {
            "User-Agent": DEFAULT_HEADER,
        }
    result = requests.get(url, headers=headers)
    result_text = result.text
    if not_found_text in result_text:
        return CountCheckResult(False, False, None)
    match = re.search(check_regex, result_text)
    if match:
        return CountCheckResult(True, True, match.group(regex_group))
    else:
        return CountCheckResult(True, False, None)
