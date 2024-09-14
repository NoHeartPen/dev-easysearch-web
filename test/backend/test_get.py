import unittest

from utils.check_result.check_get import get_for_url
from utils.check_result.check_get import get_url_with_count_check
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

    def test_something_with_check(self):
        self.assertEqual(
            CheckResultInfo(True, True, "25,302"),
            get_url_with_count_check(
                "https://yourei.jp/食べる",
                None,
                "見出し語は見つかりませんでした。",
                r'<span id="num-examples" class="btn-default badge">(.*?)</span>',
                1,
            ),
        )


if __name__ == "__main__":
    unittest.main()
