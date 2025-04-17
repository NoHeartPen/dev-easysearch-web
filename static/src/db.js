// 数据库相关操作

import localforage from 'localforage';
import {
    createResultLink,
    initCreateLink,
    initCreateTags,
    visibleCheckedResults,
} from 'static/src/dom';
import {doSearch} from 'static/src/apifetch';

/**
 *  获取初默认的链接 JSON 配置文件
 * @returns {Promise<any>}
 */
function getInitDb() {
    return fetch('/init-urls', {
        method: "POST",
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .catch(error => {
            console.error('获取初始化链接配置失败', error);
            throw error;
        });
}

/**
 * 获取默认的链接配置
 * @returns {Promise<void>}
 */
async function initializeData() {
    try {
        // 等待获取初始数据
        const initialData = await getInitDb();

        // 向浏览器写入数据
        await Promise.all(initialData.map((item, index) => {
            // FIXME 暂时使用数字 id 区分不同的链接
            return localforage.setItem(`${index}`, item).then(() => {
                console.log(`${index} 存储成功`);
            }).catch(err => {
                console.error(`${item} 失败`, err);
            });
        }));
    } catch (error) {
        console.error('初始化数据时发生错误:', error);
    }
}

/**
 * 初始化链接数据库，同时初始化渲染元素
 * @returns {Promise<void>}
 */
export async function initializeDb() {
    try {
        await initializeData();
        processTagsAndLinks();
    } catch (error) {
        console.error('init db error:', error);
    }
}

/**
 * 收到链接检查结果后，遍历数据库并渲染相关链接
 * @param word
 * @param $searchList
 * @returns {Promise<void>}
 */
export async function creatResultLinks(word, $searchList) {
    try {
        await localforage.iterate((value, key) => {
            createResultLink(value, key, word, $searchList);
        });

    } catch (error) {
        console.error('初始化链接出错:', error);
    }
}

/**
 * 向后台提交搜索链接
 * @param word 需要查找的单词
 * @returns {Promise<void>}
 */
export async function checkResultInBackend(word) {
    // TODO 只向后台提交最少的信息，用构建的URL可能不是最好的选择
    let needCheckLinksMap = {};
    await localforage.iterate((value, key) => {
        if (/^\d+$/.test(key) && // 默认使用纯数字作为URL链接的索引
            value["need_check"] !== false && // 不检查网站是否存在相关搜索结果
            value["check_method"] !== '' // 未定义检查方法
        ) {
            needCheckLinksMap[key] = {
                url_index: key,
                search_url: value["search_url"] + word,
                check_method: value["check_method"],
                not_found_text: value["not_found_text"]
            };
        }
    });

    // FIXME 将对象转换为数组 尝试优化
    let needCheckLinks = Object.entries(needCheckLinksMap).map(([url, data]) => {
        return {
            search_url: data.search_url,
            url_index: data.url_index,
            check_method: data.check_method,
            not_found_text: data.not_found_text
        };
    });
    let response = await doSearch(needCheckLinks);
    if (!response.ok) {
        throw new Error('网络响应不正常');
    }
    return response.json();
}

/**
 * 显示 URL 的所有可编辑的信息
 * @param index{string} 需要修改的元素的 DOM id，也是数据库中的索引。
 */
export function showUrlAllInfo(index) {
    localforage.getItem(`${index}`).then(function (data) {
        // 填充模态弹窗内容
        $('#index_id').val(index);
        $('#title').val(data.title || '');
        $('#base_url').val(data.base_url || '');
        $('#search_url').val(data.search_url || '');
        $('#check_method').val(data.check_method || 'get');
        $('#not_found_text').val(data.not_found_text || '');
        $('#need_check').prop('checked', data.need_check || false);
        $('#auto_open').prop('checked', data.auto_open || false);
        $('#tags').val(data.tags || '');
        $('#show_in_start').prop('checked', data.show_in_start || false);
        $('#no_result_not_show').prop('checked', data.no_result_not_show || false);

        // 显示模态弹窗
        const modal = new bootstrap.Modal($('#dataModal')[0]);
        modal.show();
    }).catch(function (err) {
        console.error('查询数据时出错:', err);
    });
}


/**
 * 将修改后的数据保存到数据库，同时重新渲染画面。
 * @param index{String} 保存时使用的索引，纯数字
 * @param updatedData{object} URL 的所有配置数据
 */
export function updateData2Db(index, updatedData) {
    localforage.setItem(index, updatedData).then(function () {
        console.log('数据已更新');
        // 关闭模态弹窗
        const modal = bootstrap.Modal.getInstance(document.getElementById('dataModal'));
        modal.hide();
    }).then(function () {
        // 重新渲染修改后的链接
        processTagsAndLinks();
    }).catch(function (err) {
        console.error('保存数据时出错:', err);
    });
}

/**
 * 删除指定索引的数据，同时重新渲染画面。
 * @param index{String} 保存时使用的索引，纯数字
 */
export function deleteDataFromDb(index) {
    localforage.removeItem(index).then(function () {
        console.log('数据已更新');
        // 关闭模态弹窗
        const modal = bootstrap.Modal.getInstance(document.getElementById('dataModal'));
        modal.hide();
    }).then(function () {
        // 重新渲染修改后的链接
        processTagsAndLinks();
    }).catch(function (err) {
        console.error('保存数据时出错:', err);
    });
}

/**
 * 基于数据库中的数据，渲染标签复选框和搜索结果
 */
export function processTagsAndLinks() {
    // 清空原来渲染结果
    $('#resultsList').empty();
    $('#table-url-links-container').empty();

    // 读取数据库
    let allTags = new Set();
    localforage.iterate((value, key) => {
        // 链接以【1:{}】类似的形式存储
        if (value !== undefined && /^\d+$/.test(key)) {
            // 基于读取的数据渲染链接
            initCreateLink(value, key);
            // 读取链接中包含的标签信息
            const tags = value["tags"] ? value["tags"].split(',').map(tag => tag.trim()) : [];
            // 仅在标签不存在时添加
            tags.forEach(tag => {
                if (!allTags.has(tag)) {
                    allTags.add(tag);
                }
            });
        }
    }).then(() => {
            // 基于读取的数据渲染标签
            initCreateTags(allTags);
        }
    ).catch(function (err) {
        console.error("读取数据时出错", err);
    });
}

/**
 * 从数据库读取搜索链接数据，同时渲染到屏幕上。
 * 如果是第一次访问，那么读取后渲染到画面上
 */
export function checkDb() {
    localforage.config({
        driver: localforage.INDEXEDDB,
        name: 'easySearch',
        version: 1.0,
        storeName: 'userData',
        description: '用户数据存储'
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
            processTagsAndLinks();
        }
        // 保存当前已经使用了的索引
        getUsedIndexes();
    })
} /*
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
 * 获取已使用的索引
 * @returns {Promise<number>} 当前已经使用了的索引
 */
async function getUsedIndexes() {
    try {
        const keys = await localforage.keys(); // 使用 await 获取所有键
        const usedIndexes = new Set();
        keys.forEach(function (key) {
            // 将字符串键转换为数字并添加到集合中
            usedIndexes.add(parseInt(key, 10));
        });
        console.log('已使用的索引:', Array.from(usedIndexes));
        // 获取下一个可用的索引
        return getNextAvailableIndex(usedIndexes); // 确保返回 Promise
    } catch (err) {
        console.error('获取索引时出错:', err);
        throw err; // 抛出错误以便在调用处处理
    }
}

/**
 * 获取下一个可用的索引
 * @param usedIndexes {Set<number>} 已使用的索引
 * @returns {number}
 */
async function getNextAvailableIndex(usedIndexes) {
    let currentIndex = -1;
    while (usedIndexes.has(currentIndex + 1)) {
        currentIndex++;
    }
    return currentIndex + 1;
}

$('#addUrlLink').on('click', async function () {
    try {
        const nextAvailableIndex = await getUsedIndexes(); // 使用 await 获取下一个可用的索引
        $('#index_id').val(nextAvailableIndex);
        // 显示模态弹窗
        const modal = new bootstrap.Modal($('#dataModal')[0]);
        modal.show();
    } catch (err) {
        console.error('处理点击事件时出错:', err);
    }
});

/**
 * 导出数据到 JSON 文件
 * @param transformedData
 */
function downloadJsonFile(transformedData) {
    // 获取当前日期和时间作为下载文件名
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;

    // 导出数据
    const jsonData = JSON.stringify(transformedData, null, 2);
    const blob = new Blob([jsonData], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `easy_search_links_data_${formattedDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * 读取所有数据并导出为 JSON 格式
 */
$("#exportLinks").on('click', function () {
    const transformedData = [];
    localforage.iterate(function (value) {
        transformedData.push({
            base_url: value.base_url || '',
            title: value.title || '',
            search_url: value.search_url || '',
            check_method: value.check_method || '',
            not_found_text: value.not_found_text || '',
            // 默认不检查
            need_check: value.need_check || false,
            auto_open: value.auto_open || true,
            status: '',
            tags: value.tags || '',
            show_in_start: value.show_in_start || true,
            no_result_not_show: value.no_result_not_show || true
        });
    }).then(function () {
        downloadJsonFile(transformedData);
    }).catch(function (err) {
        console.error(err);
    });
})
