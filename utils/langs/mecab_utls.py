import MeCab

from .tools.jp_tools import convert_kata_to_hira


def _convert_word_by_mecab(tagger: MeCab, input_text: str) -> list[str]:
    """

    Args:
        tagger: MeCab 解析器
        input_text:

    Returns:

    """
    if not input_text:
        return []
    try:
        parsed_all_result = tagger.parse(input_text).splitlines()
        jishokei_parsed_result = parsed_all_result[0].split("\t")

        orth_base = jishokei_parsed_result[3]  # 書字形基本形
        jishokei_list = [orth_base]

        pron_base = jishokei_parsed_result[2]  # 発音基本形
        if orth_base != pron_base:
            # 如果相等，说明是外来语，不用转换，同时也不用返回発音基本形（和外来语的書字形基本形一致）
            pron_base = convert_kata_to_hira(pron_base)
            if pron_base not in jishokei_list:
                jishokei_list.append(pron_base)
    except Exception as e:
        raise RuntimeError(f"解析过程中发生错误: {e}")
    return jishokei_list


def _convert_full_text_by_mecab(tagger: MeCab, input_text: str) -> list[str]:
    """

    Args:
        tagger: MeCab 解析器
        input_text:

    Returns:

    """
    if not input_text:
        return []
    try:
        parsed_all_result = tagger.parse(input_text).splitlines()
        jishokei_list = []
        for parsed_result in parsed_all_result[0:-1]:
            jishokei_parsed_result = parsed_result.split("\t")
            # FIXME 注意应该用第一个\t分割，如果用户输入的文字中包含【数詞】这样的词，会被误判为时解析结果
            if "数詞" in parsed_result or "助詞-" in parsed_result or "助動詞-" in parsed_result or "接続詞-" in parsed_result or "記号-" in parsed_result:
                continue
            orth_base = jishokei_parsed_result[3]  # 書字形基本形
            jishokei_list.append(orth_base)
            pron_base = jishokei_parsed_result[2]  # 発音基本形
            if orth_base != pron_base:
                # 如果相等，说明是外来语，不用转换，同时也不用返回発音基本形（和外来语的書字形基本形一致）
                pron_base = convert_kata_to_hira(pron_base)
                if pron_base not in jishokei_list:
                    jishokei_list.append(pron_base)
    except Exception as e:
        raise RuntimeError(f"解析过程中发生错误: {e}")
    return jishokei_list


def get_word_jishokei(tagger: MeCab, nonjishokei_text: str) -> list[str]:
    # TODO 不含日语字符时，返回空列表
    if not nonjishokei_text:
        return []
    return _convert_word_by_mecab(tagger, nonjishokei_text)


def get_full_jishokei(tagger: MeCab, full_text: str) -> list[str]:
    # TODO 不含日语字符时，返回空列表
    if not full_text:
        return []
    return _convert_full_text_by_mecab(tagger, full_text)
