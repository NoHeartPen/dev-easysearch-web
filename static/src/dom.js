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
import {getCursorEnglishWord, hasJapanese} from 'static/src/tools';

/**
 * 基于用户的输入重新渲染链接，渲染后的链接直接指向搜索地址
 * @param value
 * @param key
 * @param word
 * @param $searchList
 */
export function createResultLink(value, key, word, $searchList) {
  if (value !== undefined && /^\d+$/.test(key)) {
    const replacedSearchUrl = value['search_url'].replace('{w}', word);
    const $listItem = $(`
            <a class="btn btn-outline-success btn-sm" href="${replacedSearchUrl}" rel="noopener noreferrer"
               role="button" data-tags="${value['tags']}" data-auto-open="${value['auto_open']}" data-need-check="${value['need_check']}"
               target="_blank" id="url_index_${key}">${value['title']}<span class="status-icon" id="status_index_${key}">?</span></a>
        `);
    $searchList.append($listItem);
  }
}

/**
 * 将数据库传来的数据渲染为画面上的元素
 * @param link{object} 数据存储的链接对象，包含了链接的所有数据
 * @param linkKey{string} 链接的索引
 */
export function initCreateLink(link, linkKey) {
  // 查词页面显示的数据
  const $listItem = $(`
    <a class="btn btn-outline-success btn-sm" href="${link['base_url']}" rel="noopener noreferrer"
               role="button"
               target="_blank" id="url_index_${linkKey}"
               data-tags="${link['tags']}"
               data-auto-open="${link['auto_open']}"
               data-need-check="${link['need_check']}">
        ${link['title']}
    </a>
        `);
  $('#resultsList').append($listItem);
  // 编辑页面显示的数据
  const $tableItem = $(`
    <tr class="table-url-link" id="table_url_index_${linkKey}">
        <td>${link['title']}</td>
        <td></td>
    </tr>
    `);
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
  let $listItem = $(`#url_index_${url_index}`);
  let $statusIcon = $(`#status_index_${url_index}`);
  if (status === true) {
      $statusIcon.html(' ✅');
  } else if (status === false) {
    $listItem.removeClass('btn-outline-success').addClass('btn-outline-danger');
      $statusIcon.html(' ❌');
  } else {
    // 无法判断网页是否含有想要的结果
    $listItem.removeClass('btn-outline-success').
        addClass('btn-outline-warning');
    $statusIcon.html('⚠️');
  }
}

/**
 * 【猜你想查】按钮触发搜索事件
 */
$('#want-search-container').on('click', 'button.want-search', function() {
  const wantSearchWord = $(this).val();
  // TODO 提取下面的方法
  $('#wordInput').val(wantSearchWord);
  $('#searchButton').click();
});

// 点击编辑界面的表格时显示对应的编辑界面
$('#table-url-links-container').on('click', 'td', function() {
  // 获取父行的 DOM id 并提取 id 中的数字作为查找的索引
  const rowId = $(this).closest('tr').attr('id');
  const index = rowId.match(/\d+/)[0];
  showUrlAllInfo(index);
});

// 点击保存按钮，保存编辑后的信息
$('#saveChanges').on('click', function() {
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

$('#deleteLink').on('click', function() {
  const rowId = $('#index_id').val();
  const index = rowId.match(/\d+/)[0];
  deleteDataFromDb(index);
});

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

/**
 * 监听标签复选框变化，并过滤搜索结果
 */
function filterResults() {
  const checkedTags = $('.tag-checkbox:checked').map(function() {
    return $(this).val();
  }).get();
  localStorage.setItem('checked-tags', checkedTags.join(','));
  visibleCheckedResults(checkedTags);
}

/**
 * 渲染含有相关标签的元素
 * @param {Array} checkedTags 选中的标签
 */
export function visibleCheckedResults(checkedTags) {
  $('#resultsList a').each(function() {
    const tags = $(this).data('tags').split(',');
    const isVisible = checkedTags.length === 0 ||
        tags.some(tag => checkedTags.includes(tag.trim()));
    $(this).toggle(isVisible);
  });
}

/**
 * 创建「猜你想查」按钮
 * @param {string} word
 */
function createWantSearchButton(word) {
  $('#want-search-container').append(`
            <button class="btn btn-outline-primary me-2 mb-1
btn-sm want-search" value="${word}">
                ${word}
            </button>
        `);
}

/**
 * 渲染「猜你想查」按钮
 * @param  {string|Array} wantSearchWords
 */
function createWantSearchButtons(wantSearchWords) {
  // 移除上次添加的按钮
  $('button.want-search').remove();
  // 渲染用户可能想查的单词的按钮
  if (typeof wantSearchWords === 'string') {
    // 如果传入的是一个字符串，那么直接渲染按钮
    createWantSearchButton(wantSearchWords);
  }
  if (Array.isArray(wantSearchWords) && wantSearchWords.length > 0) {
    wantSearchWords.forEach(word => {
      createWantSearchButton(word);
    });
  }
  // TODO 反馈按钮，用于向收集尚未收录在非辞書中的单词
}

/**
 * 在语境框内双击时搜索单词
 */
function doubleClickSearch() {
  // TODO 参数是自定义的按钮代码，注意使用枚举的类型
  const doubleClickKeyName = 'Shift';
  const $textarea = $('#contextInput');
  let pressCount = 0;
  let pressTimeout;
  $($textarea).on('keydown', function(event) {
    // TODO 允许自定义按键，区分左右按键
    if (event.key === doubleClickKeyName) {
      pressCount++;
      // 如果已经计数到 2，查找单词
      if (pressCount === 2) {
        // 判断是否选中了文本
        let wantSearchText = window.getSelection().toString();
        // 保存推断
        let wantSearchArray = [];
        if (wantSearchText === '') {
          // 如果没有选中文本，那么直接根据空格判断单词边界
          const text = $textarea.val();
          const position = $textarea.prop('selectionStart');
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
      // 超时后重置计数
      pressCount = 0;
    }, 300);
  });
  $($textarea).on('keyup', function(event) {
    if (event.key !== doubleClickKeyName) {
      //释放键时重置计数
      pressCount = 0;
    }
  });
}

/**
 *　基于IDB的数据初始化标签
 * @param allTags{Set} 所有标签。
 */
export function initCreateTags(allTags) {
  createTagCheckboxes(allTags);
  // 加载选中状态
  loadCheckedTags();
  // 监听复选框变化
  $('.tag-checkbox').on('change', function() {
    filterResults();
  });
}

/**
 * 点击搜索按钮时调用 Search API判断结果后渲染链接
 */
function clickSearchButton() {
  const word = $('#wordInput').val();
  // 未输入文字时不搜索
  if (word === '') {
    return;
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
    const resultLinks = $resultsList.find('a');

    resultLinks.each(function(index) {
      const $link = $(this);
      const autoOpen = $link.data('auto-open');

      if (autoOpen) {
        // 由于浏览器限制，批量打开大量 URL 需要间隔 500 ms
        setTimeout(() => {
          window.open($link.attr('href'), '_blank', 'noopener,noreferrer');
        }, index * 500);
      }
    });
      checkResultInBackend(word).then(checkResults => {
          updateStatusIcons(checkResults);
    });
  });
}

/**
 * 监听光标位置变化，并分析用户可能要查的内容。
 */
function monitorCursorPositionAndAnalyze() {
  let lastCursorPosition = -1; // 初始化光标位置
  let intervalId;
  // 监听语境框内的光标状态，如果变化，那么提交后台分析
  $('#contextInput').on('focus click', async function(event) {
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
        const contextInputText = this.value;

          if (!hasJapanese(contextInputText)) {
              // 如果不含假名，那么视为英语
              let wantSearchArray = getCursorEnglishWord(contextInputText, currentCursorPosition);
              createWantSearchButtons(wantSearchArray);
              return;
          }

          if (currentCursorPosition === contextInputText.length) {
          // 如果光标在语境的最后位置，分析已经输入所有内容
          await analyzeRequest(contextInputText, 'full');
        } else {
          // 如果光标不在最后，分析光标后的文本，并返回第一个单词
          const inputText = contextInputText.substring(currentCursorPosition,
              contextInputText.length);
          if (inputText.trim() !== '') {
            await analyzeRequest(inputText, 'word');
          }
        }
      }
    }, 500);
  });
}

// 显示复制提示的辅助函数
function showCopyToast(message, type = 'success') {
    const toastHTML = `
        <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true" style="position: fixed; top: 20px; right: 20px; z-index: 9999;">
            <div class="toast-body ${type === 'error' ? 'bg-danger text-white' : 'bg-success text-white'}">
                ${message}
            </div>
        </div>
    `;

    const $toast = $(toastHTML);
    $('body').append($toast);

    // 3秒后自动移除
    setTimeout(() => {
        $toast.fadeOut(300, function () {
            $(this).remove();
        });
    }, 3000);
}

// 辅助函数：转义 HTML 特殊字符
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replaceAll(/[&<>"']/g, m => map[m]);
}


function renderReviewRecords() {
    const $reviewTableBody = $('#review-table-body'); // 定位到表格体
    $reviewTableBody.empty(); // 清空旧数据

    // 加载用户搜索记录
    const userSearchLog = JSON.parse(localStorage.getItem('userSearchLog')) || [];
    if (userSearchLog.length === 0) {
        $reviewTableBody.append(`
      <tr>
         <td colspan="3" class="text-center">暂无记录</td>
      </tr>
    `);
        return;
    }

    // 遍历记录并生成行
    userSearchLog.forEach((log, index) => {
        const word = log.searchWord || ''; // 搜索的单词
        const context = log.contextInput || ''; // 搜索时语境框的内容

        const tableRow = `
      <tr>
        <td>${escapeHtml(word)}</td>
        <td class="context-cell" data-index="${index}" style="cursor: pointer;">${escapeHtml(context)}</td>
        <td>
          <button class="btn btn-info btn-sm copy-record me-2" data-index="${index}" title="复制单词和语境">
            <i class="bi bi-files"></i>
          </button>
          <button class="btn btn-danger btn-sm delete-record" data-index="${index}" title="删除">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
        $reviewTableBody.append(tableRow);
    });
}

// 绑定复制按钮的事件监听器
$('#review-table-body').on('click', '.copy-record', function () {
    const index = $(this).data('index'); // 获取对应记录的索引
    const userSearchLog = JSON.parse(localStorage.getItem('userSearchLog')) || [];

    if (userSearchLog[index]) {
        const word = userSearchLog[index].searchWord || '';
        const context = userSearchLog[index].contextInput || '';

        // 组织要复制的文本
        const textToCopy = `语境: ${context}\n单词: ${word}`;

        // 复制到剪贴板
        navigator.clipboard.writeText(textToCopy).then(() => {
            // 显示成功提示
            showCopyToast('已复制到剪贴板');
        }).catch(err => {
            console.error('复制失败:', err);
            showCopyToast('复制失败，请重试', 'error');
        });
    }
});


// 绑定删除按钮的事件监听器
$('#review-table-body').on('click', '.delete-record', function () {
    const index = $(this).data('index'); // 获取对应记录的索引

    // 从 localStorage 中删除对应记录
    const userSearchLog = JSON.parse(localStorage.getItem('userSearchLog')) || [];
    userSearchLog.splice(index, 1); // 移除索引数据
    localStorage.setItem('userSearchLog', JSON.stringify(userSearchLog));

    // 重新渲染复习记录
    renderReviewRecords();
});

// 绑定语境单元格的点击编辑事件
$('#review-table-body').on('click', '.context-cell', function () {
    const $cell = $(this);
    const index = $cell.data('index');
    const currentContent = $cell.text();

    // 如果已经在编辑模式，不重复处理
    if ($cell.find('textarea').length > 0) {
        return;
    }

    // 创建编辑框
    const $textarea = $(`
        <textarea class="form-control context-edit" data-index="${index}" style="min-height: 60px;">${currentContent}</textarea>
    `);

    // 替换单元格内容为编辑框
    $cell.empty().append($textarea);
    $textarea.focus();

    // 处理保存逻辑
    const saveContext = () => {
        const newContent = $textarea.val();
        const userSearchLog = JSON.parse(localStorage.getItem('userSearchLog')) || [];

        if (userSearchLog[index]) {
            userSearchLog[index].contextInput = newContent;
            localStorage.setItem('userSearchLog', JSON.stringify(userSearchLog));
        }

        // 重新渲染表格
        renderReviewRecords();
    };

    // 失焦时保存
    $textarea.on('blur', saveContext);

    // 按下 Ctrl+Enter 或 Cmd+Enter 时保存
    $textarea.on('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            saveContext();
        }
    });
});

export function initializeEvents() {
    // 刷新页面自动将光标放在语境框内
  $('#contextInput').focus();

  // 打开设置弹窗
  $('#settingsButton').on('click', () => {
    const settingsModal = new bootstrap.Modal($('#settingsModal')[0]);
    settingsModal.show();
  });

  $('#searchButton').on('click', function() {
    clickSearchButton();
      const searchWord = $('#wordInput').val();
      const contextInput = $('#contextInput').val();
      const userSearchLog = JSON.parse(localStorage.getItem('userSearchLog')) || [];
      userSearchLog.push({
          timestamp: new Date().toISOString(),
          searchWord,
          contextInput,
      });
      localStorage.setItem('userSearchLog', JSON.stringify(userSearchLog));
  });

    $('#resultsList').on('click', 'a.btn', function (event) {
        const clickedLink = $(this).text();
        const searchWord = $('#wordInput').val();
        const linkUrl = $(this).attr('href');

        // 将用户点击记录保存到数据库或本地存储
        const userClickLog = JSON.parse(localStorage.getItem('userClickLog')) || [];
        userClickLog.push({
            timestamp: new Date().toISOString(),
            clickedLink,
            searchWord,
            linkUrl,
        });
        localStorage.setItem('userClickLog', JSON.stringify(userClickLog));
    });

    // 监听复习选项卡被点击的事件，切换时加载复习记录
    $('#review-tab').on('click', function () {
        renderReviewRecords();
    });

    // 搜索框内按回车触发搜索事件
  $('#wordInput').keydown(function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      // 模拟点击查找按钮
      $('#searchButton').click();
    }
  });

  // 语境框双击键盘触发搜索事件
  doubleClickSearch();
  // 监听语境框内光标位置变化
  monitorCursorPositionAndAnalyze();

  // 监听模态框关闭事件
  $('#dataModal').on('hidden.bs.modal', function() {
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
  const history = [];
  $('#clearButton').on('click', function() {
    const contextInput = $('#contextInput');
    history.push(contextInput.val());
    contextInput.val('');
  });

  // 监听撤销按钮
  $('#undoButton').on('click', function() {
    const contextInput = $('#contextInput');
    if (history.length > 0) {
      contextInput.val(history.pop());
    }
  });

  // 添加点击事件监听器
  $('.select-lang-div .dropdown-item').on('click', function(event) {
    // 防止链接的默认行为
    event.preventDefault();
    const selectedValue = $(this).data('value');

    const $languageButton = $('#languageButton');
    $languageButton.text($(this).text());

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
      $('button.want-search').remove();
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
    createWantSearchButtons(data);
  } catch (error) {
    console.error('请求失败：', error);
  }
}

/**
 * 封装清空模态框内输入的数据
 */
function clearModalData() {
  // 清空模态框内的输入数据
  $('#title').val('');
  $('#base_url').val('');
  $('#search_url').val('');
  $('#tags').val('');

  // 重置复选框状态
  $('#auto_open').prop('checked', false);
  $('#show_in_start').prop('checked', false);
  $('#need_check').prop('checked', false);
  $('#no_result_not_show').prop('checked', false);

  // 清空下拉选择框
  $('#check_method').val('get');
  $('#not_found_text').val('');
}

