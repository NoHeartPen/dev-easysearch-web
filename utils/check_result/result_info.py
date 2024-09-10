"""

"""

from typing import NamedTuple


class CountCheckResult(NamedTuple):
    """
    Args:
        result: 搜索结果
        check_result: 是否提取到搜索结果数量
        regex_group_text: 提取到的搜索结果条数
    """

    result: bool
    check_result: bool
    regex_group_text: str | None
