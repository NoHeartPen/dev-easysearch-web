// API 相关函数

/**
 * 分析用户输入文本，并返回分析结果的第一个单词。
 * @param{string} inputText 要分析的文本，应为语境框的光标后的文本。
 * @returns {Promise<Response>}
 */
export async function doWordAnalyze(inputText) {
    return await fetch('/word-analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({text: inputText})
    });
}

/**
 * 分析语境框内的所有内容，按照词频返回分析结果。
 * @param inputText{string} 要分析的文本，默认应为语境框中的文本。
 * @returns {Promise<Response>}
 */
export async function doFullAnalyze(inputText) {
    return await fetch('/full-analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({text: inputText})
    });
}

/**
 * 向后台提交所有需要检查搜索结果的网站链接。
 * @param needCheckLinks{Array} 需要检查的网站链接数组。
 */
export async function doSearch(needCheckLinks) {
    // 向后台提交所有需要检查搜索结果的网站链接
    return await fetch('/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(needCheckLinks)
    });
}