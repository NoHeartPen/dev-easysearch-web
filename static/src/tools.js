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

  const word = textareaText.substring(start, end);
  if (!word.includes('_')) {
    // 单词中不包含下划线，直接返回单词
    return [word];
  }
  // 按照下划线分割单词
  let wordArray = word.split('_');
  return wordArray;
}