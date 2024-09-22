// DOM相关操作
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
    const $listItem = $(`
    <a class="btn btn-outline-success btn-sm" href="${link["base_url"]}" rel="noopener noreferrer"
               role="button"
               target="_blank" id="url_index_${linkKey}" data-tags="${link["tags"]}">${link["title"]}</a>
        `);
    $('#resultsList').append($listItem);
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