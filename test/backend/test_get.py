import unittest

from utils.check_result.check_get import get_for_url, get_url_with_count_check
from utils.check_result.check_result_info import CheckResultInfo


class MyTestCase(unittest.TestCase):
    # TODO 修改方法名
    def test_something(self):
        self.assertEqual(
            True,
            get_for_url(
                "https://www.weblio.jp/content/%E9%A3%9F%E3%81%B9%E3%82%8B",
                None,
                "見出し語は見つかりませんでした",
            ),
            get_for_url(
                "https://www.weblio.jp/content/食べる",
                None,
                "見出し語は見つかりませんでした。",
            ),
        )
        self.assertEqual(
            False,
            get_for_url(
                "https://www.weblio.jp/content/XXXXXXXXXXXXXXXXXXXXXXXXXXX",
                None,
                "見出し語は見つかりませんでした。",
            ),
        )


if __name__ == "__main__":
    unittest.main()
