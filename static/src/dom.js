// DOM相关操作

import {showUrlAllInfo, updateData2Db} from "static/src/db";

/**
 * 获取光标处附近的英文单词
 * @param $textarea
 */
export function getCursorEnglishWord($textarea) {
    // TODO 调用后台获取更准确的【猜你想查】
    const textareaText = $textarea.val();
    const position = $textarea.prop('selectionStart');
    let start = position, end = position;
    // 向前和向后扫描，直到找到单词的边界
    while (start > 0 && /\S/.test(textareaText[start - 1])) {
        start--;
    }
    while (end < textareaText.length && /\S/.test(textareaText[end])) {
        end++;
    }
    return textareaText.substring(start, end);
}

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


/**
 * 【猜你想查】按钮触发搜索事件
 */
$("#want-search-container").on("click", "button.want-search", function () {
    const wantSearchWord = $(this).val()
    // TODO 提取下面的方法
    $("#wordInput").val(wantSearchWord)
    $('#searchButton').click();
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
               role="button"
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
 * @param url_index 链接的索引，和已经渲染好的 DOM 元素的 ID 保持一致
 * @param status 链接的检查结果
 */
export async function updateStatusIcon(url_index, status) {
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

// 点击编辑界面的表格时显示对应的编辑界面
document.getElementById('table-url-links-container').addEventListener('click', function (event) {
    // 确保点击的是单元格
    if (event.target && event.target.nodeName === 'TD') {
        // 获取父行的 DOM id 并提取 id 中的数字作为查找的索引
        const rowId = event.target.parentElement.id;
        // FIXME 下面的正则表达式应该是用
        const index = rowId.match(/\d+/)[0];
        showUrlAllInfo(index);
    }
});

// 保存编辑后的信息
document.getElementById('saveChanges').addEventListener('click', function () {
    const rowId = document.getElementById('index_id').value;
    const index = rowId.match(/\d+/)[0];
    // 创建一个对象来保存更改后的数据
    const updatedData = {
        base_url: document.getElementById('base_url').value,
        title: document.getElementById('title').value,
        search_url: document.getElementById('search_url').value,
        check_method: document.getElementById('check_method').value,
        not_found_text: document.getElementById('not_found_text').value,
        need_check: document.getElementById('need_check').checked,
        auto_open: document.getElementById('auto_open').checked,
        tags: document.getElementById('tags').value,
        show_in_start: document.getElementById('show_in_start').checked,
        no_result_not_show: document.getElementById('no_result_not_show').checked,
    };
    updateData2Db(index, updatedData);
});

// 监听模态框关闭事件
const myModalEl = document.getElementById('dataModal');
myModalEl.addEventListener('hidden.bs.modal', function () {
    // 重置「高级设置」的折叠状态
    const collapseElement = document.getElementById('collapseOne');
    const bsCollapse = new bootstrap.Collapse(collapseElement, {
        toggle: false // 不自动切换状态
    });
    bsCollapse.hide(); // 隐藏折叠部分
});

/**
 * 渲染所有标签。
 * @param allTags{Set}
 */
export function createTagCheckboxes(allTags) {
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
export function filterResults() {
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
function visibleCheckedResults(checkedTags) {
    $('#resultsList a').each(function () {
        const tags = $(this).data('tags').split(',');
        const isVisible = checkedTags.length === 0 || tags.some(tag => checkedTags.includes(tag.trim()));
        $(this).toggle(isVisible);
    });
}

/*
 * 加载 localStorage 中保存的选中状态
 */
export function loadCheckedTags() {
    const checkedTagsString = localStorage.getItem('checked-tags');
    if (checkedTagsString) {
        const checkedTags = checkedTagsString.split(',');
        // 根据标签选中对应的元素
        checkedTags.forEach(tag => {
            $(`.tag-checkbox[value="${tag.trim()}"]`).prop('checked', true);
        });
        visibleCheckedResults(checkedTags);
    }
}

/**
 * 切换黑暗模式
 */
export function switchDarkMode() {
    // 检查localStorage中的模式设置
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'enabled') {
        document.body.classList.add('dark-mode');
        $(".result-area").addClass("dark-mode");
        $("#contextInput").addClass("dark-mode");
    }

    // 切换黑暗模式的函数
    document.getElementById('toggleDarkMode').addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        $(".result-area").toggleClass("dark-mode");
        $("#contextInput").toggleClass("dark-mode");
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
        } else {
            localStorage.setItem('darkMode', 'disabled');
        }
    });
}

/**
 * 渲染【猜你想查】按钮
 * @param  {string|Array} wantSearchWords
 */
export function createWantSearchButtons(wantSearchWords) {
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

export function autoSwitchOfflineMode() {
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
}

/**
 * 在语境框内双击时搜索单词
 */
export function doubleClickSearch() {
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