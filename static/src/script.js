import localforage from "localforage";
import {checkResultInBackend, creatResultLinks, initializeDb} from "static/src/db";
import {initCreateLink} from "static/src/dom";

/**
 * 数据库相关初始化操作
 */
function checkDb() {
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
            //  FIXME 重复代码，读取数据库中存储的链接
            localforage.iterate((value, key) => {
                // 链接以【1:{}】类似的形式存储
                if (value !== undefined && /^\d+$/.test(key)) {
                    initCreateLink(value, key);
                }
            }).catch(function (err) {
                console.error("获取 init-visit 标志时出错:", err);
            });
        }
    })
}

$(document).ready(function () {
    checkDb();

    $('#searchButton').on('click', function (e) {
        const word = $('#wordInput').val();
        const $resultsList = $('#resultsList');
        // 清空现有的搜索结果
        $resultsList.empty();
        $('.result-area').show(); // 显示结果区域
        creatResultLinks(word, $resultsList).then(
            // TODO 如果用户有不需要检查结果的网站，那么先自动打开一次相关链接
            checkResultInBackend(word).then(
                // TODO 收到并成功重新渲染了链接
            )
        )
    });

    $('#wordInput').keydown(function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            // 模拟点击查找按钮
            $('#searchButton').click();
        }
    });

    // TODO 筛选超链接

    // TODO 语境框双击键盘坐标
});