def convert_kata_to_hira(input_text: str) -> str:
    """Convert katakana to hiragana in the given text.
        将片假名转为平假名

    Args:
        input_text: A String containing the katakana.

    Returns:
        The text with katakana converted to hiragana.
    """
    output_text = ""
    for gana in input_text:
        # 关于取值范围，请阅读下面的链接
        # Read url for why the condition is 12448 and 12534
        # https://www.unicode.org/charts/PDF/U30A0.pdf
        gana_code = int(ord(gana))
        if 12448 <= gana_code <= 12534:
            hira = chr(gana_code - 96)
            output_text = output_text + hira
        else:
            output_text = output_text + gana
    return output_text
