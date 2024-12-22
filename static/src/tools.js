// 纯工具模块，无任何依赖关系

/**
 * 获取光标处附近的英文单词
 * @param {string} textareaText 文本框内容
 * @param {number} position 光标位置
 * @returns {Array<string>} 光标处附近的英文单词
 */
export function getCursorEnglishWord(textareaText, position) {
  let start = position, end = position;

  // 向前扫描，寻找单词的起始位置
  while (start > 0 && /\w/.test(textareaText[start - 1])) {
    // 查找单词边界
    start--;
  }
  // 向后扫描，寻找单词的结束位置
  while (end < textareaText.length && /\w/.test(textareaText[end])) {
    end++;
  }

  let word;
  if (position === (textareaText.length)) {
    // 说明光标位于句尾
    let matchWord = textareaText.match(/\w+/g);
    if (matchWord) {
      // 返回离句尾最近的一个单词即可
      word = matchWord[matchWord.length - 1];
    } else {
      // 理论上来说不可能匹配不到，因为调用这个方法的前提是存在英文字符
      new Error('光标位于句尾，但是未匹配到单词');
    }
  } else {
    word = textareaText.substring(start, end);
  }

  if (!word.includes('_')) {
    // 单词中不包含下划线，直接返回单词
    return [word];
  }
  // 按照下划线分割单词
  return word.split('_');
}

/**
 * 获取光标处的单词。
 *
 * @param text{string} 完整的上下文文本
 * @param cursorText{string} 光标前方或者后方的所有文字
 * @param position{number} 光标的位置
 * @param pattern{string} 基于光标的查找方向。after：查询光标后的单词，before查询光标前的单词。
 * @returns {Array<string>|undefined} 返回单词。如果光标位于句首或句尾，则返回 undefined。
 */
export function getCursorWord(text, cursorText, position, pattern) {
  if (text === '') {
    return;
  }

  if (position > text.length) {
    // 光标位置超出文本长度
    throw new Error('光标位置超出文本长度');
  }

  if (pattern === 'after') {
    if (position === text.length) {
      // 光标位于句尾，但用户要求查询光标后的单词，所以返回 undefined
      return;
    }
  } else {
    if (position === 0) {
      // 光标位于句首，但用户要求查询光标前的单词，所以返回 undefined
      return;
    }
  }

  if (/^[A-Za-z\s.,!?]+$/.test(text)) {
    // 如果光标前后全是英文，会尽量使用空格自动判断单词边界
    return getCursorEnglishWord(text, position);
  }

  // 完整的上下文并非纯英文文本
  if (/^[a-zA-Z]+$/.test(cursorText) && cursorText.includes(' ')) {
    // 如果光标后是纯英文文本，且有空格，那么基于空格分割单词
    let start = position, end = position;
    while (start > 0 && /\S/.test(text[start - 1])) {
      start--;
    }
    while (end < text.length && /\S/.test(text[end])) {
      end++;
    }
    return [text.substring(start, end)];
  } else {
    // 不全是英文，且没有空格，基于中英文直接分割单词
    // 注意【test1中文test2测试】如果光标在【测试】，那么返回应该返回test2
    const CursorWords = cursorText.match(/[a-zA-Z]+/g);
    if (CursorWords === null) {
      // 全中文
      if (pattern === 'after') {
        // 返回光标后的所有文字
        return [text.substring(position, text.length)];
      } else {
        // 返回光标前的所有文字
        return [text.substring(0, position)];
      }
    } else {
      if (pattern === 'after') {
        // 查找光标后的第一个单词
        return [CursorWords[0]];
      } else {
        // 查找光标前的第一个单词，是提取的单词中的最后一个
        return [CursorWords[CursorWords.length - 1]];
      }
    }
  }
}