import localforage from "localforage";


/**
 *  获取初始化网页链接 JSON 配置文件
 * @returns {Promise<any>}
 */
function getInitUrl() {
    // 使用 Fetch API
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
            console.error('There was a problem with the fetch init-url operation:', error);
            throw error;
        });
}

async function initializeData() {
    try {
        // 等待获取初始数据
        const initialData = await getInitUrl();

        // 存储初始数据
        await Promise.all(initialData.map((item, index) => {
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
 * 初始化链接数据库同时渲染元素
 * @returns {Promise<void>}
 */
async function initializeAndProcess() {
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

async function creatSearchUrl(word, $searchList) {
    try {
        await localforage.iterate((value, key, iterationNum) => {
            if (value !== undefined && /^\d+$/.test(key)) {
                const $listItem = $(`
            <a class="btn btn-outline-success btn-sm" href="${value["search_url"]}${word}" rel="noopener noreferrer"
               role="button"
               target="_blank" id="url_index_${key}">${value["title"]}<span class="status-icon" id="status_index_${key}">?</span></a>
        `);
                $searchList.append($listItem);
            }
        });

    } catch (error) {
        console.error('init db error:', error);
    }
}

/**
 * 初始化渲染链接元素
 * @param link
 * @param linkKey
 */
function initCreateLink(link, linkKey) {
    const $listItem = $(`
    <a class="btn btn-outline-success btn-sm" href="${link["base_url"]}" rel="noopener noreferrer"
               role="button"
               target="_blank" id="url_index_${linkKey}">${link["title"]}</a>
        `);
    $('#resultsList').append($listItem);
}

$(document).ready(function () {

        localforage.config({
            driver: localforage.INDEXEDDB,
            name: 'easySearch',
            version: 1.0,
            storeName: 'userData',
            description: '用户数据存储'
        })

        localforage.getItem("init-visit").then(function (initVisitFlag) {
            // 判断 initVisitFlag 是否为 null 或 undefined
            if (initVisitFlag === null) {
                localforage.setItem("init-visit", true).then(function () {
                    initializeAndProcess().then()
                });
            } else {
                localforage.iterate((value, key) => {
                    if (value !== undefined && /^\d+$/.test(key)) {
                        initCreateLink(value, key);
                    }
                }).catch(function (err) {
                    console.error("获取 init-visit 标志时出错:", err);
                });
            }
        })

        $('#searchButton').on('click', function (e) {
            const word = $('#wordInput').val();
            const $resultsList = $('#resultsList');
            $resultsList.empty(); // 清空现有的搜索结果
            $('.result-area').show(); // 显示结果区域
            creatSearchUrl(word, $resultsList)
            // TODO 模拟状态更新
            checkResultInBackend(word).then()
        });

        $('#wordInput').keydown(function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                // 模拟点击查找按钮
                $('#searchButton').click();
            }
        });

        async function checkResultInBackend(word) {
            // TODO 只向后台提交最少的信息，当用构建的URL可能不是最好的选择
            let needCheckLinksMap = {};

            await localforage.iterate((value, key, iterationNum) => {
                if (/^\d+$/.test(key) && value["check_method"] !== '') {
                    needCheckLinksMap[key] = {
                        url_index: key,
                        search_url: value["search_url"] + word,
                        check_method: value["check_method"],
                        not_found_text: value["not_found_text"]
                    };
                }
            });

            // 将对象转换为数组
            let needCheckLinks = Object.entries(needCheckLinksMap).map(([url, data]) => {
                return {
                    search_url: data.search_url,
                    url_index: data.url_index,
                    check_method: data.check_method,
                    not_found_text: data.not_found_text
                };
            });


            fetch('/search', {
                method: 'POST',
                headers: {'Content-Type': 'application/json',},
                body: JSON.stringify(needCheckLinks),
            }).then(response => response.json()).then(data => {
                // 遍历返回的数据
                Object.keys(data).forEach(key => {
                    console.log(data)
                    const [url, status] = data[key];
                    updateStatusIcon(key, status); // 更新状态图标，根据需要调整参数
                });
            }).catch((error) => {
                console.error('错误 :', error);
            });
        }


        /**
         * 根据返回的检查结果显示画面
         * @param url_index
         * @param status
         */
        async function updateStatusIcon(url_index, status) {
            let $listItem = $(`#url_index_${url_index}`)
            let $statusIcon = $(`#status_index_${url_index}`)
            if (status === 'true') {
                $statusIcon.html('✅');
            } else if (status === 'false') {
                $listItem.removeClass('btn-outline-success').addClass('btn-outline-danger');
                $statusIcon.html('❌');
            } else {
                $listItem.removeClass('btn-outline-success').addClass('btn-outline-warning');
                $statusIcon.html('⚠️'); // 如果是加载，则恢复为空
            }
        }

// 筛选超链接
        $('#filterInput').on('input', function () {
            const filter = $(this).val().toLowerCase();
            $('#resultsList .list-group-item').each(function () {
                const linkText = $(this).text().toLowerCase();
                $(this).toggle(linkText.includes(filter)); // 显示或隐藏符合条件的链接
            });
        });
    }
)
;