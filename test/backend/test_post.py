import unittest

from check_post import post_with_count_check


class MyTestCase(unittest.TestCase):
    def test_post_url_with_count_check(self):
        self.assertEqual(
            CheckResultInfo(True, True, "5"),
            post_with_count_check(
                "https://grammar.izaodao.com/grammar.php?action=search",
                "あいだ",
                None,
                "keyword",
                "抱歉，没找到相关内容。请您尝试以下操作：",
                r'<span class="count">当前共有 (\d+) 条语法</span>',
                1,
            ),
        )
        self.assertEqual(
            CheckResultInfo(False, False, None),
            post_with_count_check(
                "https://grammar.izaodao.com/grammar.php?action=search",
                "XXXXXXXXXXXXXXXXXXXXXXXXXXX",
                None,
                "keyword",
                "抱歉，没找到相关内容。请您尝试以下操作：",
                r'<span class="count">当前共有 (\d+) 条语法</span>',
                1,
            ),
        )


if __name__ == "__main__":
    unittest.main()
