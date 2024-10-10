import {describe, expect, it} from 'vitest';
import {getCursorEnglishWord} from 'static/src/tools';

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