// 数据库相关操作

import localforage from "localforage";
import {createResultLink, initCreateLink, initCreateTags, updateStatusIcon} from "static/src/dom";

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


    // 向后台提交所有需要检查搜索结果的网站链接
    fetch('/search', {
        method: 'POST',
        headers: {'Content-Type': 'application/json',},
        body: JSON.stringify(needCheckLinks),
    }).then(response => response.json()).then(data => {
        // 遍历返回的数据
        Object.keys(data).forEach(key => {
            console.log(data)
            // TODO 后台只需要返回 id 和检查结果
            const [url, status] = data[key];
            console.log(key, status)
            updateStatusIcon(key, status);
        });
    }).catch((error) => {
        console.error('错误 :', error);
    });
}

/**
 * 显示 URL 的所有可编辑的信息
 * @param index{string} 需要修改的元素的 DOM id，也是数据库中的索引。
 */
export function showUrlAllInfo(index) {
    localforage.getItem(`${index}`).then(function (data) {
        // 填充模态弹窗内容
        document.getElementById('index_id').value = index;
        document.getElementById('title').value = data.title || '';
        document.getElementById('base_url').value = data.base_url || '';
        document.getElementById('search_url').value = data.search_url || '';
        document.getElementById('check_method').value = data.check_method || 'get';
        document.getElementById('not_found_text').value = data.not_found_text || '';
        document.getElementById('need_check').checked = data.need_check || false;
        document.getElementById('auto_open').checked = data.auto_open || false;
        document.getElementById('tags').value = data.tags || '';
        document.getElementById('show_in_start').checked = data.show_in_start || false;
        document.getElementById('no_result_not_show').checked = data.no_result_not_show || false;
        // 显示模态弹窗
        const modal = new bootstrap.Modal(document.getElementById('dataModal'));
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
            processTagsAndLinks();
        }
    })
}