import {beforeEach, describe, expect, it, vi} from 'vitest';
import {doFullAnalyze, doSearch, doWordAnalyze} from 'static/src/apifetch';

describe('测试 doWordAnalyze', () => {
  beforeEach(() => {
    // 重置 fetch 的实现
    global.fetch = vi.fn();
  });

  it('正常测试', async () => {
    const mockResponse = {
      ok: true, json: async () => ({text: ['会う', 'あう']}),
    };
    fetch.mockResolvedValue(mockResponse);
    const result = await doWordAnalyze('会わない');
    expect(result.ok).toBe(true);
    const data = await result.json();
    expect(data.text).toEqual(['会う', 'あう']);
  });

  it('请求异常时报错', async () => {
    const mockErrorResponse = {ok: false, statusText: 'Not Found'};
    fetch.mockResolvedValue(mockErrorResponse);
    await expect(doWordAnalyze('会わない')).
        rejects.
        toThrow('Failed to doWordAnalyze: Not Found');
  });
});

describe('测试 doFullAnalyze', () => {
  beforeEach(() => {
    // 重置 fetch 的实现
    global.fetch = vi.fn();
  });

  it('正常测试', async () => {
    const mockResponse = {ok: true, json: async () => ({text: ['会う']})};
    fetch.mockResolvedValue(mockResponse);
    const result = await doFullAnalyze('会わない');
    expect(result.ok).toBe(true);
    const data = await result.json();
    // 注意fullAnalyze的只返回用言和名词的辞书形
    expect(data.text).toEqual(['会う']);
  });

  it('请求异常时报错', async () => {
    const mockErrorResponse = {ok: false, statusText: 'Not Found'};
    fetch.mockResolvedValue(mockErrorResponse);
    await expect(doFullAnalyze('会わない')).
        rejects.
        toThrow('Failed to doFullAnalyze: Not Found');
  });
});

describe('测试 doSearch', () => {
  beforeEach(() => {
    // 重置 fetch 的实现
    global.fetch = vi.fn();
  });

  it('正常测试', async () => {
    const mockResponse = {
      ok: true, json: async () => ({
        // 第一个数字是id，用于更新元素状态
        '0': ['https://www.dictionary.com/browse/\u4f1a\u3046', false],
        '6': ['https://www.weblio.jp/content/\u4f1a\u3046', true],
        '7': ['https://yourei.jp/\u4f1a\u3046', false],
      }),
    };

    fetch.mockResolvedValue(mockResponse);
    const result = await doSearch('会う');
    const data = await result.json();

    const expectedData = {
      '0': ['https://www.dictionary.com/browse/会う', false],
      '6': ['https://www.weblio.jp/content/会う', true],
      '7': ['https://yourei.jp/会う', false],
    };
    Object.keys(expectedData).forEach(key => {
      expect(data).toHaveProperty(key);
      expect(data[key][0]).toBe(expectedData[key][0]);
      expect(data[key][1]).toBe(expectedData[key][1]);
    });

  });

  it('请求异常时报错', async () => {
    const mockErrorResponse = {ok: false, statusText: 'Not Found'};
    fetch.mockResolvedValue(mockErrorResponse);
    await expect(doSearch('会わない')).
        rejects.
        toThrow('Failed to doSearch: Not Found');
  });
});

