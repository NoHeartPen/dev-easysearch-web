import asyncio
import time
import unittest

from utils.check_result.check_get import async_get_for_url, get_for_url


class MyTestCase(unittest.TestCase):
    def test_not_found(self):
        self.assertFalse(
            get_for_url(
                "https://www.weblio.jp/content/XXXXXXXXXXXXXXXXXXXXXXXXXXX",
                None,
                "見出し語は見つかりませんでした。",
            ),
        )

    def test_bulk_need_check_links(self):
        """
        从 static/init-url.json 提取 need_check=true 且 check_method='get' 的链接，
        统一用测试词执行一次大量查询并统计结果。
        """

        items = [
            {
                "title": "Dictionary.com",
                "search_url": "https://www.dictionary.com/browse/{w}",
                "not_found_text": "No results found for",
            },
            {
                "title": "Weblio辞書",
                "search_url": "https://www.weblio.jp/content/{w}",
                "not_found_text": "見出し語は見つかりませんでした",
            },
            {
                "title": "Weblio 古語辞典",
                "search_url": "https://kobun.weblio.jp/content/{w}",
                "not_found_text": "に一致する見出し語は見つかりませんでした。",
            },
            {
                "title": "IT用語辞典",
                "search_url": "https://e-words.jp/search?q={w}",
                "not_found_text": "一致する結果はありません",
            },
            {
                "title": "Immersion Kit",
                "search_url": "https://www.immersionkit.com/dictionary?keyword={w}",
                "not_found_text": "No results found for",
            },
            {
                "title": "白水社中国語辞典",
                "search_url": "https://cjjc.weblio.jp/content/{w}",
                "not_found_text": "に一致する見出し語は見つかりませんでした。",
            },
            {
                "title": "実用日本語表現辞典",
                "search_url": "https://www.weblio.jp/content/{w}?dictCode=JTNHJ",
                "not_found_text": "に一致する見出し語は見つかりませんでした。",
            },
            {
                "title": "方言大辞典",
                "search_url": "https://hougen-dictionary.packana.info/?s={w}",
                "not_found_text": "投稿が見つかりませんでした。",
            },
            {
                "title": "漢字の正しい書き順",
                "search_url": "https://kakijun.jp/main/u_kensaku.php?kjonesearchtext=/{w}/",
                "not_found_text": "検索した下記の漢字は見つかりませんでした。",
            },
            {
                "title": "北辞郎",
                "search_url": "https://www.ctrans.org/search.php?word={w}&opts=fw&optext=%E4%B8%AD%E5%9B%BD%E8%AA%9E%E5%89%8D%E6%96%B9%E4%B8%80%E8%87%B4",
                "not_found_text": "該当するデータはありませんでした。",
            },
            {
                "title": "Google とは",
                "search_url": "https://www.google.com/search?q={w} とは",
                "not_found_text": "該当するデータはありませんでした。",
            },
            {
                "title": "毎日のんびり日本語教師",
                "search_url": "https://mainichi-nonbiri.com/?s={w}",
                "not_found_text": "記事が見つかりませんでした。",
            },
            {
                "title": "辞書に載ってない中国語",
                "search_url": "https://chineself.com/?s={w}",
                "not_found_text": "投稿が見つかりませんでした。",
            },
            {
                "title": "人人词典",
                "search_url": "https://www.91dict.com/words?w={w}",
                "not_found_text": "查不到该词",
            },
            {
                "title": "Urban Dictionary",
                "search_url": "https://www.urbandictionary.com/define.php?term={w}",
                "not_found_text": "No definitions found for",
            },
            {
                "title": "American Heritage Dictionary",
                "search_url": "https://www.ahdictionary.com/word/search.html?q={w}",
                "not_found_text": "No word definition found",
            },
            {
                "title": "朗文当代英语在线",
                "search_url": "https://www.ldoceonline.com/dictionary/{w}",
                "not_found_text": "Sorry, there are no results for",
            },
            {
                "title": "forvo",
                "search_url": "https://forvo.com/search/{w}/",
                "not_found_text": "Wow, you actually found a word not on Forvo!",
            },
            {
                "title": "YouGlish",
                "search_url": "https://youglish.com/pronounce/{w}/english/",
                "not_found_text": "No result found in ",
            },
            {
                "title": "YouGlish 日语",
                "search_url": "https://youglish.com/pronounce/{w}/japanese",
                "not_found_text": "No result found in ",
            },
        ]

        # 统一测试词，可按需调整
        test_word = "test"
        ok = 0
        fail = 0
        total = len(items)

        start_all = time.time()
        for t in items:
            url = t["search_url"].replace("{w}", test_word)
            not_found_text = t["not_found_text"]

            t0 = time.time()
            try:
                result = get_for_url(url, None, not_found_text)
                ok += 1 if result in (True, False) else 0
            except Exception as e:
                fail += 1
                errors.append((t["title"], f"{type(e).__name__}: {e}"))
            finally:
                elapsed = (time.time() - t0) * 1000
                print(f"[{t['title']}] {url} - done in {elapsed:.1f} ms")

        sync_elapsed = time.time() - start_all
        print(
            f"Bulk checked {total} items: ok={ok}, fail={fail}, time={sync_elapsed:.2f}s"
        )

        # 允许个别失败，但若失败比例过高则判定为失败（例如超过 30%）
        if total > 0 and fail / total > 0.3:
            msg = "失败过多:\n" + "\n".join(
                f"- {title}: {err}" for title, err in errors[:10]
            )
            self.fail(msg)

        # 异步并发测试（与 items 相同数据集）
        async def _run_bulk():
            import asyncio as _a
            import time as _t

            async def one(t):
                url = t["search_url"].replace("{w}", test_word)
                t0 = _t.time()
                try:
                    r = await async_get_for_url(url, None, t["not_found_text"])
                    return (t["title"], True, r, (_t.time() - t0) * 1000)
                except Exception as e:
                    return (
                        t["title"],
                        False,
                        f"{type(e).__name__}: {e}",
                        (_t.time() - t0) * 1000,
                    )

            tasks = [one(t) for t in items]
            return await _a.gather(*tasks)

        start_async = time.time()
        results = asyncio.run(_run_bulk())
        async_elapsed = time.time() - start_async
        print(f"async total: {async_elapsed:.2f}s")

        # 粗略对比
        speedup = sync_elapsed / async_elapsed if async_elapsed > 0 else float("inf")
        print(f"speedup (sync/async): {speedup:.2f}x")


if __name__ == "__main__":
    unittest.main()
