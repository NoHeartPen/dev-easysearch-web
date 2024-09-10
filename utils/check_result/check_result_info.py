"""

"""

from typing import NamedTuple


class CheckResultInfo(NamedTuple):
    """
    Args:
        result: 搜索结果
        check_result: 自定义的搜索结果
        check_count: 搜索结果条数
    """

    result: bool
    check_result: bool
    check_count: str | None
