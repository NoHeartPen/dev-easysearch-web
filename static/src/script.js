import localforage from "localforage";
import {checkResultInBackend, creatResultLinks, initializeDb} from "static/src/db";
import {getCursorEnglishWord, initCreateLink} from "static/src/dom";

const offlineElement = document.getElementById('offline');

// 刷新页面时检查网络状态
function checkInitialStatus() {
    if (!navigator.onLine) {
        showIndicator();
    }
}

// 提示未连接网络
function showIndicator() {
    offlineElement.innerHTML = '当前未连接网络';
    offlineElement.className = 'showOfflineNotification';
}

// 隐藏提示
function hideIndicator() {
    offlineElement.className = 'hideOfflineNotification';
}

// 网络状态切换时更新提示
window.addEventListener('online', hideIndicator);
window.addEventListener('offline', showIndicator);
// 刷新页面时检查网络状态
window.addEventListener('load', checkInitialStatus);

/**
 * 从数据库读取搜索链接数据，同时渲染到屏幕上。
 * 如果是第一次访问，那么读取后
 */
function checkDb() {
    localforage.config({
        driver: localforage.INDEXEDDB, name: 'easySearch', version: 1.0, storeName: 'userData', description: '用户数据存储'
    })

    localforage.getItem("init-visit").then(function (initVisitFlag) {
        // 通过 initVisitFlag 是否为 null 或 undefined 判断是否第一次访问网站
        if (initVisitFlag === null) {
            localforage.setItem("init-visit", true).then(function () {
                initializeDb().then(
                    // TODO 用户第一次访问且渲染成功，考虑进行相关引导
                )
            });
        } else {
            // FIXME 注意不管是否渲染成功，都应该添加自定义的按钮
            // FIXME 重复代码，读取数据库中存储的链接
            localforage.iterate((value, key) => {
                // 链接以【1:{}】类似的形式存储
                if (value !== undefined && /^\d+$/.test(key)) {
                    initCreateLink(value, key);
                }
            }).catch(function (err) {
                console.error("获取 init-visit 标志时出错:", err);
            });
        }
    })
}


/**
 * 在语境框内双击时搜索单词
 */
function doubleClickSearch() {
    // TODO 参数是自定义的按钮代码，注意使用枚举的类型
    const doubleClickKeyName = "Shift"
    const $textarea = $('#contextInput');
    let pressCount = 0;
    let pressTimeout;
    $($textarea).on('keydown', function (event) {
            // TODO 允许自定义按键，区分左右按键
            if (event.key === doubleClickKeyName) {
                pressCount++;
                // 如果已经计数到 2，进行单词查找
                if (pressCount === 2) {
                    // 判断是否选中了文本
                    let wantSearchText = window.getSelection().toString()
                    if (wantSearchText === "") {
                        // 如果没有选中文本，那么直接根据空格判断单词边界
                        wantSearchText = getCursorEnglishWord($textarea);
                    }
                    // TODO 分析选中的文本
                    // 构建搜索按钮
                    createWantSearchButtons(wantSearchText);
                    // 重置计数器
                    pressCount = 0;
                }
            }
            // 防止双击过快
            clearTimeout(pressTimeout);
            pressTimeout = setTimeout(() => {
                pressCount = 0; // 超时后重置计数
            }, 300);
        }
    );
    $($textarea).on('keyup', function (event) {
        if (event.key !== doubleClickKeyName) {
            //释放键时重置计数
            pressCount = 0;
        }
    });
}

/**
 *
 *
 * @param {string} word - The word to display on the search button.
 */
function createWantSearchButton(word) {
    $("#want-search-container").append(`
            <button class="btn btn-primary me-2 btn-sm want-search" value="${word}">
                ${word}
            </button>
        `);
}

/**
 * 渲染【猜你想查】按钮
 * @param  {string|Array} wantSearchWords
 */
function createWantSearchButtons(wantSearchWords) {
    // 移除上次添加的按钮
    $("button.want-search").remove();
    // 渲染用户可能想查的单词的按钮
    if (typeof wantSearchWords === 'string') {
        // 如果传入的是一个字符串，那么直接渲染按钮
        createWantSearchButton(wantSearchWords)
    }
    if (Array.isArray(wantSearchWords) && wantSearchWords.length > 0) {
        wantSearchWords.forEach(word => {
            createWantSearchButton(word);
        });
    }
    // TODO 反馈按钮，用于向收集尚未收录在非辞書中的单词
}

/**
 * 分析用户输入文本，并返回分析结果的第一个单词。
 * @param{string} inputText 要分析的文本，应为语境框的光标后的文本。
 * @returns {Promise<Response>}
 */
async function doWordAnalyze(inputText) {
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
async function doFullAnalyze(inputText) {
    return await fetch('/full-analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({text: inputText})
    });
}

/**
 * 分析文本中用户可能要查的内容。
 * @param{string} inputText 要分析的文本。
 * @param{string} analyzeType 分析类型，full 表示分析语句框中的所有文本。
 * @returns {Promise<void>}
 */
async function analyzeRequest(inputText, analyzeType) {
    try {
        let response;
        if (analyzeType === 'full') {
            response = await doFullAnalyze(inputText);
        } else {
            response = await doWordAnalyze(inputText);
        }
        if (!response.ok) {
            throw new Error('网络响应不正常');
        }
        const data = await response.json();
        console.log('分析结果：', data);
        createWantSearchButtons(data)
    } catch (error) {
        console.error('请求失败：', error);
    }
}

$(document).ready(function () {
    checkDb();

    $('#searchButton').on('click', function () {
        const word = $('#wordInput').val();
        // 未输入文字时不搜索
        if (word === "") {
            return
        }

        const $resultsList = $('#resultsList');
        // 清空现有的搜索结果
        $resultsList.empty();
        // 显示结果区域
        $('.result-area').show();
        // 先构建搜索链接，链接构建成功后，再向后台提交搜索结果
        creatResultLinks(word, $resultsList).then(
            // TODO 如果用户有不需要检查结果的网站，那么先自动打开一次相关链接
            checkResultInBackend(word).then(
                // TODO 收到服务器的结果并成功重新渲染了链接
            )
        )
    });

    // 搜索框内按回车触发搜索事件
    $('#wordInput').keydown(function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            // 模拟点击查找按钮
            $('#searchButton').click();
        }
    });

    // TODO 筛选超链接

    // TODO 语境框双击键盘
    doubleClickSearch()

    let lastCursorPosition = -1; // 初始化光标位置
    let intervalId;

    // 监听语境框内的光标状态，如果变化，那么提交后台分析
    $('#contextInput').on('focus click', async function (event) {
        if (event.type === 'blur') {
            // 在失去焦点时清除定时器
            clearInterval(intervalId);
            return;
        }
        // 清除之前的定时器
        clearInterval(intervalId);

        // 启动定时器检查光标位置
        intervalId = setInterval(async () => {
            const currentCursorPosition = this.selectionStart;
            // 如果光标位置变化，调用函数
            if (currentCursorPosition !== lastCursorPosition) {
                lastCursorPosition = currentCursorPosition;
                // 用户输入文字时自动提交已经输入的文字到后台进行分析
                const contextInputText = this.value
                if (currentCursorPosition === contextInputText.length) {
                    // 如果光标在语境的最后位置，分析已经输入所有内容
                    await analyzeRequest(contextInputText, "full");
                } else {
                    // 如果光标不在最后，分析光标后的文本，并返回第一个单词
                    const inputText = contextInputText.substring(currentCursorPosition, contextInputText.length);
                    if (inputText.trim() !== '') {
                        await analyzeRequest(inputText, "word");
                    }
                }
            }
        }, 500);
    });
})
;