// DOM相关操作

import {
    checkResultInBackend,
    creatResultLinks,
    deleteDataFromDb,
    loadCheckedTags,
    showUrlAllInfo,
    updateData2Db,
} from 'static/src/db';
import {doFullAnalyze, doWordAnalyze} from 'static/src/apifetch';
import {getCursorEnglishWord} from 'static/src/tools';

/**
 * 获取光标前方的单词
 * @param $textarea
 * @param cursorPosition
 * @returns {string}
 */
export function getBeforeCursorWord($textarea, cursorPosition) {
    const textareaText = $textarea.val();
    const position = $textarea.prop('selectionStart');
    const textBeforeCursor = textareaText.substring(0, position)
    if (/[\u3040-\u30FF]/.test(textBeforeCursor)) {
        // 含有假名，说明可能是日语
        // TODO 暂时先返回光标前的所有文本分析 API
        return textBeforeCursor;
    } else {
        return getCursorEnglishWord(textareaText, textBeforeCursor, cursorPosition, 'before')
    }
}

/**
 * 按下↤时查询光标前方的单词
 */
$("#getWordBeforeCursor").on('click', function () {
    const $input = $('#contextInput');
    const cursorPosition = $input.prop('selectionStart');
    const word = getBeforeCursorWord($input, cursorPosition);
    $('#wordInput').val(word);
    $('#searchButton').click();
    $input.focus();
})

function getCursorWord(text, textCursor, cursorPosition, cursorPattern) {
    if (/^[a-zA-Z]+$/.test(textCursor) && textCursor.includes(" ")) {
        // 如果是纯英文
        let start = cursorPosition, end = cursorPosition;
        while (start > 0 && /\S/.test(text[start - 1])) {
            start--;
        }
        while (end < text.length && /\S/.test(text[end])) {
            end++;
        }
        return text.substring(start, end);
    } else {
        // 不全是英文，且没有空格，基于中英文直接分割单词
        // 注意【test1中文test2测试】如果光标在【测试】，那么返回应该返回test2
        const CursorWords = textCursor.match(/[a-zA-Z]+/g)
        if (CursorWords === null) {
            // 全中文，直接返回
            if (cursorPattern === 'after') {
                // 返回光标后的所有文字
                return text.substring(cursorPosition, text.length);
            } else {
                // 返回光标前的所有文字
                return text.substring(0, cursorPosition);
            }
        } else {
            if (cursorPattern === 'after') {
                // 查找光标后的第一个单词
                return CursorWords[0];
            } else {
                // 查找光标前的第一个单词，是提取的单词中的最后一个
                return CursorWords[CursorWords.length - 1];
            }
        }
    }
}

/**
 * 获取光标后方的单词
 * @param $textarea
 * @returns {string}
 */
export function getAfterCursorWord($textarea) {
    const textareaText = $textarea.val();
    const cursorPosition = $textarea.prop('selectionStart');
    const textAfterCursor = textareaText.substring(cursorPosition, textareaText.length);
    if (/[\u3040-\u30FF]/.test(textAfterCursor)) {
        // 含有假名，说明可能是日语
        // TODO 暂时先返回光标前的所有文本
        return textAfterCursor;
    } else {
        return getCursorWord(textareaText, textAfterCursor, cursorPosition, 'after')
    }
}

/**
 * 按下↦时查询光标后方的单词
 */
$("#getWordAfterCursor").on('click', function () {
    const $input = $('#contextInput');
    const word = getAfterCursorWord($input)
    $('#wordInput').val(word);
    $('#searchButton').click();
    // 即使没有聚焦到文本区域，也直接进入文本区域，减少用户操作次数
    $input.focus();
})


/*
将语境框内的光标向前移动一个单词
 */
$('#moveCursorAfter').on('click', function () {
    // 获取文本区域的内容
    const $input = $('#contextInput');
    // 即使没有聚焦到文本区域，也直接进入文本区域，减少用户操作次数
    $input.focus();
    const text = $input.val();
    // 获取当前光标位置
    const cursorPosition = $input.prop('selectionStart');
    // 使用 Segmenter 分割文本
    // https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
    // 中文 zh 英语 en
    let langTag = 'en-US'; //
    if (/[\u3040-\u30FF]/.test(text)) {
        console.log("日语")
        langTag = 'ja-JP';
    }
    const segmenter = new Intl.Segmenter(langTag, {granularity: 'word'});
    //const segments = Array.from(segmenter.segment(text));
    const segments = [...segmenter.segment(text)];

    console.log(segments);

    let wordIndex = 0
    let charCount = 0;

    for (const segment of segments) {
        // 通过遍历分词结果判断当前光标所在分词结果
        const segmentLength = segment.segment.length;
        if (charCount + segmentLength > cursorPosition) {
            console.log(` charCount${charCount} cursorPosition${cursorPosition}segmentLength ${segmentLength}`)
            break;
        }
        charCount += segmentLength;
        wordIndex++;
    }
    // 基于当前光标在的分词结果的索引计算出下一个单词的索引
    const nextWordIndex = wordIndex + 1;
    if (nextWordIndex >= segments.length) {
        // 直接移动光标到最后一个字符处
        console.log("直接移动光标到最后一个字符处")
        $input[0].setSelectionRange(text.length, text.length);
    } else {
        // 移动光标到下一个单词的开头
        const nextWord = segments[nextWordIndex].segment;
        const nextWordStart = text.lastIndexOf(nextWord);
        $input[0].setSelectionRange(nextWordStart, nextWordStart);
    }
    $input.focus();
});

/**
 * 将语境框内的光标向前移动一个单词
 */
$('#moveCursorBefore').on('click', function () {
    const $input = $('#contextInput');
    $input.focus();
    const cursorPosition = $input.prop('selectionStart'); // 获取当前光标位置
    const text = $input.val(); // 获取文本的完整内容

    // 主流桌面端和移动端设备已经都已兼容该 API
    // TODO 注意在 Kindle 这样的设备上可能不支持
    const segmenter = new Intl.Segmenter('ja-JP', {granularity: 'word'});
    const segments = [...segmenter.segment(text)];


    let wordIndex = 0;
    let charCount = 0;

    // 处理光标在文本开头的情况
    if (cursorPosition === 0) {
        return;
    }

    // 计算当前光标前的单词数量
    for (const segment of segments) {
        const segmentLength = segment.segment.length;
        if (charCount + segmentLength > cursorPosition) {
            break; // 到达光标位置
        }
        charCount += segmentLength;
        wordIndex++;
    }

    // 计算光标前一个单词的起始位置
    if (wordIndex > 0) {
        const previousWord = segments[wordIndex - 1].segment;
        const previousWordStart = text.lastIndexOf(previousWord, charCount - previousWord.length);
        $input[0].setSelectionRange(previousWordStart, previousWordStart); // 设置光标位置
    }

    // 确保文本框获得焦点
    $input.focus();
});


/**
 * 基于用户的输入重新渲染链接，渲染后的链接直接指向搜索地址
 * @param value
 * @param key
 * @param word
 * @param $searchList
 */
export function createResultLink(value, key, word, $searchList) {
    if (value !== undefined && /^\d+$/.test(key)) {
        const $listItem = $(`
            <a class="btn btn-outline-success btn-sm" href="${value["search_url"]}${word}" rel="noopener noreferrer"
               role="button" data-tags="${value["tags"]}"
               target="_blank" id="url_index_${key}">${value["title"]}<span class="status-icon" id="status_index_${key}">?</span></a>
        `);
        $searchList.append($listItem);
    }
}

/**
 * 将数据库传来的数据渲染为画面上的元素
 * @param link 数据存储的链接对象，包含了链接的所有数据
 * @param linkKey 链接的索引
 */
export function initCreateLink(link, linkKey) {
    // 查词页面显示的数据
    const $listItem = $(`
    <a class="btn btn-outline-success btn-sm" href="${link["base_url"]}" rel="noopener noreferrer"
               role="button"
               target="_blank" id="url_index_${linkKey}" data-tags="${link["tags"]}">${link["title"]}</a>
        `);
    $('#resultsList').append($listItem);
    // 编辑页面显示的数据
    const $tableItem = $(`<tr class="table-url-link" id="table_url_index_${linkKey}""><td>${link["title"]}</td><td></td></tr>`)
    $('#table-url-links-container').append($tableItem);
}

/**
 * 根据服务器返回的检查结果重新渲染对应的链接元素
 * @param data{Object} 服务器返回的检查结果数据
 */
function updateStatusIcons(data) {
    Object.keys(data).forEach(key => {
        updateStatusIcon(key, data[key][1]);
    });
}

/**
 * 渲染对应的链接元素
 * @param url_index 链接的索引，和已经渲染好的 DOM 元素的 ID 保持一致
 * @param status 链接的检查结果
 */
function updateStatusIcon(url_index, status) {
    let $listItem = $(`#url_index_${url_index}`)
    let $statusIcon = $(`#status_index_${url_index}`)
    if (status === true) {
        $statusIcon.html('✅');
    } else if (status === false) {
        $listItem.removeClass('btn-outline-success').addClass('btn-outline-danger');
        $statusIcon.html('❌');
    } else {
        // 无法判断网页是否含有想要的结果
        $listItem.removeClass('btn-outline-success').addClass('btn-outline-warning');
        $statusIcon.html('⚠️');
    }
}

/**
 * 【猜你想查】按钮触发搜索事件
 */
$("#want-search-container").on("click", "button.want-search", function () {
    const wantSearchWord = $(this).val()
    // TODO 提取下面的方法
    $("#wordInput").val(wantSearchWord)
    $('#searchButton').click();
})

// 点击编辑界面的表格时显示对应的编辑界面
$('#table-url-links-container').on('click', 'td', function () {
    // 获取父行的 DOM id 并提取 id 中的数字作为查找的索引
    const rowId = $(this).closest('tr').attr('id');
    const index = rowId.match(/\d+/)[0];
    showUrlAllInfo(index);
});

// 点击保存按钮，保存编辑后的信息
$('#saveChanges').on('click', function () {
    const rowId = $('#index_id').val();
    const index = rowId.match(/\d+/)[0];
    // 创建一个对象来保存更改后的数据
    const updatedData = {
        base_url: $('#base_url').val(),
        title: $('#title').val(),
        search_url: $('#search_url').val(),
        check_method: $('#check_method').val(),
        not_found_text: $('#not_found_text').val(),
        need_check: $('#need_check').is(':checked'),
        auto_open: $('#auto_open').is(':checked'),
        tags: $('#tags').val(),
        show_in_start: $('#show_in_start').is(':checked'),
        no_result_not_show: $('#no_result_not_show').is(':checked'),
    };
    updateData2Db(index, updatedData);
});

$("#deleteLink").on("click", function () {
    const rowId = $('#index_id').val();
    const index = rowId.match(/\d+/)[0];
    deleteDataFromDb(index);
})

/**
 * 渲染所有标签。
 * @param allTags{Set}
 */
function createTagCheckboxes(allTags) {
    $('#tagCheckboxes').empty();
    allTags.forEach(tag => {
        const tagWithoutHash = tag.replace('#', '');
        const $checkbox = $(`
                <div class="form-check form-check-inline">
                    <input class="form-check-input tag-checkbox" type="checkbox" value="${tag}" id="tag_${tagWithoutHash}" />
                    <label class="form-check-label" for="tag_${tagWithoutHash}">${tagWithoutHash}</label>
                </div>
            `);
        $('#tagCheckboxes').append($checkbox);
    });
}

/*
 * 监听标签复选框变化，并过滤搜索结果
 */
function filterResults() {
    // 获取标签的选中状态
    const checkedTags = $('.tag-checkbox:checked').map(function () {
        return $(this).val();
    }).get();
    // 保存选中状态到 localStorage
    localStorage.setItem('checked-tags', checkedTags.join(','));
    // 根据选中标签过滤搜索结果
    visibleCheckedResults(checkedTags)
}

/*
 * 渲染含有相关标签的元素
 * @param {Array} checkedTags 选中的标签
 */
export function visibleCheckedResults(checkedTags) {
    $('#resultsList a').each(function () {
        const tags = $(this).data('tags').split(',');
        const isVisible = checkedTags.length === 0 || tags.some(tag => checkedTags.includes(tag.trim()));
        $(this).toggle(isVisible);
    });
}

/**
 * 切换黑暗模式
 */
function switchDarkMode() {
    // 检查localStorage中的模式设置
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'enabled') {
        $('body').addClass('dark-mode');
        $(".result-area").addClass("dark-mode");
        $("#contextInput").addClass("dark-mode");
    }

    // 切换黑暗模式的函数
    $('#toggleDarkMode').on('click', () => {
        const $body = $('body');
        $body.toggleClass('dark-mode');
        $(".result-area").toggleClass("dark-mode");
        $("#contextInput").toggleClass("dark-mode");
        if ($body.hasClass('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
        } else {
            localStorage.setItem('darkMode', 'disabled');
        }
    });
}

/**
 * 创建「猜你想查」按钮
 * @param {string} word
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

function autoSwitchOfflineMode() {
    const $offlineElement = $('#offline');

    // 刷新页面时检查网络状态
    function checkInitialStatus() {
        if (!navigator.onLine) {
            showIndicator();
        }
    }

    // 提示未连接网络
    function showIndicator() {
        $offlineElement.html('当前未连接网络').addClass('showOfflineNotification');
    }

    // 隐藏提示
    function hideIndicator() {
        $offlineElement.removeClass('showOfflineNotification').addClass('hideOfflineNotification');
    }

    // 网络状态切换时更新提示
    $(window).on('online', hideIndicator);
    $(window).on('offline', showIndicator);

    // 刷新页面时检查网络状态
    $(window).on('load', checkInitialStatus);
}

/**
 * 在语境框内双击时搜索单词
 */
function doubleClickSearch() {
    // TODO 参数是自定义的按钮代码，注意使用枚举的类型
    const doubleClickKeyName = "Shift";
    const $textarea = $("#contextInput");
    let pressCount = 0;
    let pressTimeout;
    $($textarea).on("keydown", function (event) {
        // TODO 允许自定义按键，区分左右按键
        if (event.key === doubleClickKeyName) {
            pressCount++;
            // 如果已经计数到 2，进行单词查找
            if (pressCount === 2) {
                // 判断是否选中了文本
                let wantSearchText = window.getSelection().toString();
                // 保推断
                let wantSearchArray = [];
                if (wantSearchText === "") {
                    // 如果没有选中文本，那么直接根据空格判断单词边界
                    const text = $textarea.val();
                    const position = $textarea.prop("selectionStart");
                    wantSearchArray = getCursorEnglishWord(text, position);
                } else {
                    wantSearchArray[0] = wantSearchText;
                }
                createWantSearchButtons(wantSearchArray);
                // 重置计数器
                pressCount = 0;
            }
        }
        // 防止双击过快
        clearTimeout(pressTimeout);
        pressTimeout = setTimeout(() => {
            pressCount = 0; // 超时后重置计数
        }, 300);
    });
    $($textarea).on("keyup", function (event) {
        if (event.key !== doubleClickKeyName) {
            //释放键时重置计数
            pressCount = 0;
        }
    });
}


/**
 *　基于IDB的数据初始化标签
 * @param allTags{Set}
 */
export function initCreateTags(allTags) {
    createTagCheckboxes(allTags)
    // 加载选中状态
    loadCheckedTags();
    // 监听复选框变化
    $('.tag-checkbox').on('change', function () {
        filterResults();
    });
}

/**
 * 点击搜索按钮时调用 Search API判断结果后渲染链接
 */
function clickSearchButton() {
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

    // 基于数据库重新构建搜索链接，链接构建成功后，再向后台提交搜索结果
    creatResultLinks(word, $resultsList).then(() => {
            // 重新构建链接后只显示含有相关标签的元素
            filterResults();
            checkResultInBackend(word).then(checkResults => {
                updateStatusIcons(checkResults)
            })
        }
    )

}

/**
 * 监听光标位置变化，并分析用户可能要查的内容。
 */
function monitorCursorPositionAndAnalyze() {
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
}

export function initializeEvents() {
    switchDarkMode();
    autoSwitchOfflineMode();
    // 打开设置弹窗
    $('#settingsButton').on('click', () => {
        const settingsModal = new bootstrap.Modal($('#settingsModal')[0]);
        settingsModal.show();
    });

    $('#searchButton').on('click', function () {
        clickSearchButton();
    });

    // 搜索框内按回车触发搜索事件
    $('#wordInput').keydown(function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            // 模拟点击查找按钮
            $('#searchButton').click();
        }
    });

    // 语境框双击键盘触发搜索事件
    doubleClickSearch()
    // 监听语境框内光标位置变化
    monitorCursorPositionAndAnalyze();

    // 监听模态框关闭事件
    $('#dataModal').on('hidden.bs.modal', function () {
        // 重置「高级设置」的折叠状态
        $('#collapseOne').collapse('hide');
        clearModalData();
    });

    // 监听粘贴按钮
    $('#pasteButton').on('click', async () => {
        try {
            $('#contextInput').val(await navigator.clipboard.readText());
        } catch (err) {
            console.error('无法读取剪贴板内容:', err);
        }
    });

    // 监听清空按钮
    const history = []; // 用于存储文本框的历史值
    $('#clearButton').on('click', function () {
        const contextInput = $('#contextInput');
        history.push(contextInput.val()); // 保存当前值到历史数组
        contextInput.val(''); // 清空文本框
    });

    // 监听撤销按钮
    $('#undoButton').on('click', function () {
        const contextInput = $('#contextInput');
        if (history.length > 0) {
            contextInput.val(history.pop()); // 从历史数组中恢复最后一个值
        }
    });

    // 添加点击事件监听器
    $('.select-lang-div .dropdown-item').on('click', function (event) {
        // 防止链接的默认行为
        event.preventDefault();
        const selectedValue = $(this).data('value');
        // 获取按钮和下拉菜单项
        const $languageButton = $('#languageButton');
        $languageButton.text($(this).text());
        // 更新按钮文本
        $languageButton.data('value', selectedValue);
        // 这里可以根据需要使用 selectedValue 进行其他操作
        console.log('选中的值:', selectedValue);
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
            console.error('网络响应不正常');
        }
        const data = await response.json();
        console.log('分析结果：', data);
        createWantSearchButtons(data)
    } catch (error) {
        console.error('请求失败：', error);
    }
}

/**
 * 封装清空模态框数据的函数
 */
function clearModalData() {
    // 清空模态框内的输入数据
    $('#title').val(''); // 清空标题输入框
    $('#base_url').val(''); // 清空基础URL输入框
    $('#search_url').val(''); // 清空搜索URL输入框
    $('#tags').val(''); // 清空标签输入框

    // 重置复选框状态
    $('#auto_open').prop('checked', false); // 取消总是自动打开网页复选框
    $('#show_in_start').prop('checked', false); // 取消总是显示在查词界面复选框
    $('#need_check').prop('checked', false); // 取消打开前检查复选框
    $('#no_result_not_show').prop('checked', false); // 取消未找到结果时在查词界面不显示复选框

    // 清空下拉选择框
    $('#check_method').val('get'); // 重置检查方法下拉框为默认值
    $('#not_found_text').val(''); // 清空未找到文本输入框
}

