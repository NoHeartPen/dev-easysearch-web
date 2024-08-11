// DOM相关操作

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
               target="_blank" id="url_index_${linkKey}">${link["title"]}</a>
        `);
    $('#resultsList').append($listItem);
}

/**
 * 根据服务器返回的检查结果渲染对应的链接
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