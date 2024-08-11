// 数据库相关操作

import localforage from "localforage";
import {createResultLink, initCreateLink, updateStatusIcon} from "static/src/dom";

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
        await localforage.iterate((value, key) => {
            if (value !== undefined && /^\d+$/.test(key)) {
                initCreateLink(value, key);
            }
        });
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


export async function checkResultInBackend(word) {
    // TODO 只向后台提交最少的信息，当用构建的URL可能不是最好的选择
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
            // TODO 后台只返回 id 和检查结果
            const [url, status] = data[key];
            console.log(key, status)
            updateStatusIcon(key, status);
        });
    }).catch((error) => {
        console.error('错误 :', error);
    });
}