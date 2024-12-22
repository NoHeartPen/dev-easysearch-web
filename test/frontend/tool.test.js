import {describe, expect, it} from 'vitest';
import {getCursorEnglishWord, getCursorWord} from 'static/src/tools';

describe('测试 getCursorEnglishWord', () => {
  const testCases = [
    {
      description: '光标在H之后',
      text: 'H world',
      position: 1,
      expected: ['H'],
    }, {
      description: '光标在world之前',
      text: 'H world',
      position: 3,
      expected: ['world'],
    }, {
      description: '光标在最开始的位置',
      text: 'Example text',
      position: 0,
      expected: ['Example'],
    }, {
      description: '光标在最后一个单词后，最后一个单词最后有空格',
      text: 'Testing ',
      position: 7,
      expected: ['Testing'],
    }, {
      description: '光标在多个单词中的最后一个单词后，且最后一个单词最后有标点',
      text: 'a t! ',
      position: 5,
      expected: ['t'],
    }, {
      description: '光标在最后一个单词后，最后一个单词最后有标点',
      text: 't! ',
      position: 3,
      expected: ['t'],
    }, {
      description: '光标，最后一个单词最后有标点',
      text: 't!',
      position: 2,
      expected: ['t'],
    }, {
      description: '光标在空格处，返回应为空字符串',
      text: 'Hello test',
      position: 5,
      expected: ['Hello'],
    }, {
      description: '光标在特殊字符旁边',
      text: 'H, world!',
      position: 1,
      expected: ['H'],
    }, {
      description: '光标在单词和标点之间',
      text: 'This is a test.',
      position: 11,
      expected: ['test'],
    }, {
      description: '光标在多个特殊字符之间',
      text: 'H--world!',
      position: 0,
      expected: ['H'],
    }, {
      description: '光标在多个特殊字符之间',
      text: 'H_world!',
      position: 2,
      expected: ['H', 'world'],
    }, {
      description: '光标在多个空格之间',
      text: 'A  B  C',
      position: 3,
      expected: ['B'],
    }, {
      description: '光标在字符串末尾，没有附加空格',
      text: 'LastWord',
      position: 8,
      expected: ['LastWord'],
    }];

  testCases.forEach(({description, text, position, expected}) => {
    it(description, () => {
      const result = getCursorEnglishWord(text, position);
      expect(result).toStrictEqual(expected);
    });
  });
});

/**
 * 断言测试 getCursorWord 是否符合预期
 * @param text{string} 完整的上下文文本
 * @param textCursor{string} 光标前方或者后方的所有文字
 * @param position{number} 光标的位置
 * @param pattern{string} 基于光标的查找方向。after：查询光标后的单词，before查询光标前的单词。
 * @param expected{Array<string>|undefined} 返回单词。如果光标位于句首或句尾，则返回 undefined。
 */
const testGetCursorWord = (text, textCursor, position, pattern, expected) => {
  const result = getCursorWord(text, textCursor, position, pattern);
  expect(expected).toStrictEqual(result);
};

describe('getCursorWord', () => {
  it('应返回光标后的单词', () => {
    const afterCursorTestCases = [
      // 模拟用户光标逐渐移动的过程
      // 英文测试
      ['H, world!', 0, 'after', ['H']],
      ['H, world!', 1, 'after', ['H']],
      // 如果一句话只包含英文字符，那么即时用户光标在一个单词的中间，也会返回一个单词
      ['H world!', 2, 'after', ['world']],
      // 但是当整句话不是纯英文时，光标之后不是一个完整的单词，只会返回光标后的单词片段
      ['中H world!', 2, 'after', ['world']],

      // 标点符号测试，默认去掉标点符号
      ['world!', 0, 'after', ['world']],
      ['world!', 1, 'after', ['world']],
      ['world!', 2, 'after', ['world']],
      ['world! this', 2, 'after', ['world']],
      // 注意该函数主要用于无网状态下备用，所以不会支持NLTK级别的词形还原功能
      ['I\'m', 0, 'after', ['I']],

      // 日语测试
      ['問おう', 0, 'after', ['問おう']],
      ['問おう', 1, 'after', ['おう']],
      ['問おう', 2, 'after', ['う']],

      // 中文测试
      ['测试中文', 0, 'after', ['测试中文']],
      ['测试中文', 1, 'after', ['试中文']],
      ['测试中文', 2, 'after', ['中文']],
      ['测试中文', 3, 'after', ['文']],

      // 边界
      ['', 0, 'after', undefined],
      // 光标在单词末尾，返回空字符串
      ['H', 1, 'after', undefined]];
    afterCursorTestCases.forEach(
        ([text, cursorPosition, cursorPattern, expected]) => {
          const textAfterCursor = text.substring(cursorPosition, text.length);
          testGetCursorWord(text, textAfterCursor, cursorPosition,
              cursorPattern, expected);
        });
  });

  it('应返回光标前的字符', () => {
    const beforeCursorTestCases = [
      // 模拟用户光标逐渐移动的过程
      // 英文测试
      ['H, world!', 0, 'before', undefined],
      ['H, world!', 1, 'before', ['H']],
      // FIXME 本来应该返回H，但该函数主要用于无网状态下备用，所以不会支持NLTK级别的词形还原功能
      ['H, world!', 2, 'before', ['']],
      // 如果一句话只包含英文字符，那么总是返回里用户光标最近的英语单词，而不是基于方向判断单词
      // 因为用户极有可能是在一个单词中间按下前后方向快捷键
      ['H, world!', 3, 'before', ['world']],
      // 光标前包含中文，返回
      ['中H, world!', 3, 'before', ['H']],
      // 光标前包含中文，返回距离光标最近的英语单词
      ['a中test, world!', 6, 'before', ['test']],

      // 标点符号测试，默认去掉标点符号
      ['world! this ', 2, 'before', ['world']],
      // 注意该函数主要用于无网状态下备用，所以不会支持NLTK级别的词形还原功能
      ['I\'m', 0, 'before', undefined],
      ['I\'m', 1, 'before', ['I']],

      // 日语测试
      ['問おう', 0, 'before', undefined],
      ['問おう', 1, 'before', ['問']],
      ['問おう', 2, 'before', ['問お']],
      ['問おう', 3, 'before', ['問おう']],

      // 中文测试
      ['测试中文', 0, 'before', undefined],
      ['测试中文', 1, 'before', ['测']],
      ['测试中文', 2, 'before', ['测试']],
      ['测试中文', 3, 'before', ['测试中']],
      ['测试中文', 4, 'before', ['测试中文']],

      // 边界
      ['', 0, 'before', undefined],
      // 光标在单词开头，返回空字符串
      ['H', 0, 'before', undefined]];

    beforeCursorTestCases.forEach(
        ([text, cursorPosition, cursorPattern, expected]) => {
          const textBeforeCursor = text.substring(0, cursorPosition);
          console.log(
              `text:${text}, textBeforeCursor:${textBeforeCursor}, cursorPosition:${cursorPosition}, cursorPattern:${cursorPattern}, expected:${expected}`);
          testGetCursorWord(text, textBeforeCursor, cursorPosition,
              cursorPattern, expected);
        });
  });

  it('中英文混合下测试', () => {

    const mixedLangTestCases = [
      // 模拟用户光标逐渐移动的过程
      // 英文测试
      ['te1中文et2测试', 0, 'before', undefined],
      ['te1中文et2测试', 1, 'before', ['t']],
      ['te1中文et2测试', 2, 'before', ['te']],
      ['te1中文et2测试', 3, 'before', ['te']],
      ['te1中文et2测试', 4, 'before', ['te']],
      ['te1中文et2测试', 5, 'before', ['te']],
      ['te1中文et2测试', 6, 'before', ['e']],
      ['te1中文et2测试', 7, 'before', ['et']],
      ['te1中文et2测试', 8, 'before', ['et']],
      ['te1中文et2测试', 9, 'before', ['et']],
      ['te1中文et2测试', 10, 'before', ['et']]];

    mixedLangTestCases.forEach(
        ([text, cursorPosition, cursorPattern, expected]) => {
          const textBeforeCursor = text.substring(0, cursorPosition);
          console.log(
              `text:${text}, textBeforeCursor:${textBeforeCursor}, cursorPosition:${cursorPosition}, cursorPattern:${cursorPattern}, expected:${expected}`);
          testGetCursorWord(text, textBeforeCursor, cursorPosition,
              cursorPattern, expected);
        });
  });

  it('光标位置超出文本长度，应返回异常', () => {
    const errorTestCases = [
      [
        'te', 11, 'before', undefined]];
    errorTestCases.forEach(
        ([text, cursorPosition, cursorPattern, expected]) => {
          const textBeforeCursor = text.substring(0, cursorPosition);
          try {
            testGetCursorWord(text, textBeforeCursor, cursorPosition,
                cursorPattern, expected);
            throw new Error('Expected an error but did not receive one');
          } catch (error) {
            if (error.message !== '光标位置超出文本长度') {
              throw new Error(`Unexpected error: ${error.message}`);
            }
          }
        });
  });

  it('应返回空字符串，处理空文本', () => {
    const text = '';
    const textCursor = '';
    const cursorPosition = 0;
    const cursorPattern = 'after';

    const result = getCursorWord(text, textCursor, cursorPosition,
        cursorPattern);
    expect(result).toStrictEqual(undefined);
  });
});