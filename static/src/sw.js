const CACHE_VERSION = 'v1'; // 设置 Cache 版本
const CACHE_NAME = `my-cache-${CACHE_VERSION}`;
const ALLOWED_PATHS = ['/']; // 请根据需要修改允许的路径
const ANALYZE_API = ["/word-analyze", "/full-analyze"]

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            // 预缓存离线页面或其他资源
            return cache.addAll([
                '/',
                '/static/style.css',
                '/static/dist/bundle.js',
                '/static/manifest.json',
                '/sw.js',
                "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
                "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js",
                "https://code.jquery.com/jquery-3.5.1.slim.min.js"]);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName); // 删除旧缓存
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
    // 检查请求的协议是否为 http 或 https
    const requestUrl = new URL(event.request.url);
    if (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') {
        return; // 直接返回，不处理非http(s)的请求
    }

    event.respondWith(
        fetch(event.request).then(response => {
            // 检查请求是否为 GET，HTML 并在允许的路径内
            const requestPath = requestUrl.pathname;
            if (event.request.method === 'POST'
                && event.request.headers.get('Content-Type').includes('application/json')
                && ANALYZE_API.includes(requestPath)) {
                // 不拦截调用语法分析 API
                return response;
            } else {
                // 网络访问成功，更新缓存
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseClone).then(r => console.log("网络访问成功，更新缓存"));
                });
            }
            return response; // 返回网络响应
        }).catch(() => {
            // 如果网络访问失败，尝试从缓存中返回
            return caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse; // 返回缓存响应
                }
                // 检查请求是否为 GET，HTML 并在允许的路径内
                const requestPath = requestUrl.pathname;
                if (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html') && ALLOWED_PATHS.includes(requestPath)) {
                    return caches.match("/"); // 返回离线页面
                }
            });
        })
    );
});