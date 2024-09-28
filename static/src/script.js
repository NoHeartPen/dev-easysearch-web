import {checkDb, checkResultInBackend, creatResultLinks} from "static/src/db";
import {autoSwitchOfflineMode, createWantSearchButtons, doubleClickSearch, switchDarkMode} from "static/src/dom";


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
        if (inputText.trim() === '') {
            // 如果输入框为空，则清除【猜你想查】按钮，同时不向后台发起请求。
            $("button.want-search").remove();
            return;
        }
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

    switchDarkMode();
    autoSwitchOfflineMode();

    // 打开设置弹窗
    document.getElementById('settingsButton').addEventListener('click', () => {
        const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
        settingsModal.show();
    });

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
    document.getElementById('pasteButton').addEventListener('click', async () => {
        try {
            document.getElementById('contextInput').value = await navigator.clipboard.readText();
        } catch (err) {
            console.error('无法读取剪贴板内容:', err);
        }
    });
    const history = []; // 用于存储文本框的历史值
    document.getElementById('clearButton').addEventListener('click', function () {
        const contextInput = document.getElementById('contextInput');
        history.push(contextInput.value); // 保存当前值到历史数组
        contextInput.value = ''; // 清空文本框
    });

    document.getElementById('undoButton').addEventListener('click', function () {
        const contextInput = document.getElementById('contextInput');
        if (history.length > 0) {
            contextInput.value = history.pop(); // 从历史数组中恢复最后一个值
        }
    });
    // 获取按钮和下拉菜单项
    const languageButton = document.getElementById('languageButton');
    const dropdownItems = document.querySelectorAll('.select-lang-div .dropdown-item');

    // 添加点击事件监听器
    dropdownItems.forEach(item => {
        item.addEventListener('click', function (event) {
            event.preventDefault(); // 防止链接的默认行为
            const selectedValue = this.getAttribute('data-value'); // 获取选中的值
            // 更新按钮文本
            languageButton.textContent = this.textContent;
            languageButton.setAttribute('data-value', selectedValue);
            // 这里可以根据需要使用 selectedValue 进行其他操作
            console.log('选中的值:', selectedValue);
        });
    });
})
;