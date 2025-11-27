import asyncio
import re
from typing import Optional

import httpx
import requests

from .result_info import CountCheckResult

DEFAULT_HEADER = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.70"


def get_for_url(
    url: str,
    headers: dict | None,
    not_found_text: str,
) -> bool:
    """向网站发起请求，如果网站返回的数据中不包含指定的关键字，返回 True，否则返回 False。

    Args:
        url: 需要发起请求的网站，只支持 Get 类型的提交。
        headers: 发起请求时使用的请求头。
        not_found_text: 当返回的结果中包含该参数的文字时，视为给网站未搜索到相关内容。

    Returns:
        当返回的网页中不包含指定的文字时返回 True，否则返回 False。
    """
    result_text = do_get_request(headers, url)
    if not_found_text in result_text:
        return False
    return True


def get_url_with_count_check(
    url: str,
    headers: dict | None,
    not_found_text: str,
    check_regex: str,
    regex_group: str | int,
) -> CountCheckResult:
    """向网站发起 Get 请求，同时使用正则表达式提取返回结果中的搜索结果数量。

    Args:
        url: 需要发起请求的网站，只支持 Get 类型的提交。
        headers: 发起请求时使用的请求头。
        not_found_text: 当返回的结果中包含该参数的文字时，将视为网站未搜索到相关内容。
            例：見出し語は見つかりませんでした。
        check_regex: 提取网页中指定内容的正则表达式。
        regex_group: 提取网页中的结果数量的正则表达式分组。


    Returns:
        CountCheckResult:
            result: 搜索结果，网站返回的内容中不含 not_found_text 时为 True，否则为 False。
            check_result: 是否提取到搜索结果数量。
            regex_group_text: 提取到的搜索结果数量，未提取到时返回 None。
    """
    result_text = do_get_request(headers, url)
    if not_found_text in result_text:
        return CountCheckResult(False, False, None)
    match = re.search(check_regex, result_text)
    if match:
        return CountCheckResult(True, True, match.group(regex_group))
    else:
        return CountCheckResult(True, False, None)


def do_get_request(headers: dict | None, url: str) -> str:
    """向网站发起 Get 请求，返回网页内容。
    Args:
        headers: 发起请求时使用的请求头。
        url: 需要发起请求的网站，只支持 Get 类型的提交。

    Returns:
            网站返回的内容。
    """
    if headers is None:
        headers = {
            "User-Agent": DEFAULT_HEADER,
        }
    result = requests.get(url, headers=headers)
    return result.text


async def async_do_get_request(url: str, headers: Optional[dict] = None) -> str:
    """
    向网站发起异步 Get 请求，返回网页内容。
    Args:
        headers: 发起请求时使用的请求头。
        url: 需要发起请求的网站，只支持 Get 类型的提交。

    Returns:
            网站返回的内容。
    """
    if headers is None:
        headers = {"User-Agent": DEFAULT_HEADER}
    try:
        async with asyncio.timeout(15.0):
            async with httpx.AsyncClient(follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 404 or resp.status_code == 403:
                    return ""

                resp.raise_for_status()
                return resp.text
    except TimeoutError:
        return ""


async def async_get_for_url(
        url: str,
        headers: Optional[dict],
        not_found_text: Optional[str] = None,
) -> bool:
    """
    返回 True 表示“有结果”，False 表示“无结果”。
    """
    text = await async_do_get_request(url, headers)
    if not_found_text:
        return not_found_text not in text
    # 未提供任何判定条件时，默认视为“有结果”
    return True
