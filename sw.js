/**
 * 聚达勘察助手 - Service Worker v4.0
 * 支持离线缓存、新模块文件
 */

const CACHE_NAME = 'juda-survey-v4';
const urlsToCache = [
  './',
  './index.html',
  './css/app.css',
  './js/app.js',
  './js/store.js',
  './js/sop.js',
  './js/coze-api.js',
  './js/craft-templates.js',
  './js/watermark-camera.js',
  './js/photo-manager.js',
  // v4.0 新增模块
  './js/offline-sync.js',
  './js/voice-note.js',
  './js/video-camera.js',
  './js/anomaly-report.js',
  './js/notification.js',
  './js/signature.js',
  './js/faq-search.js',
  './js/report-export.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // 外部依赖
  'https://cdn.bootcdn.net/ajax/libs/vue/3.4.27/vue.global.prod.min.js',
  'https://cdn.bootcdn.net/ajax/libs/vant/4.8.4/index.min.css',
  'https://cdn.bootcdn.net/ajax/libs/vant/4.8.4/vant.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// 安装事件
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活事件
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截
self.addEventListener('fetch', event => {
  // 只缓存GET请求
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果找到缓存，返回缓存
        if (response) {
          return response;
        }

        // 否则从网络获取
        return fetch(event.request).then(response => {
          // 检查是否是有效响应
          if (!response || response.status !== 200 || response.type !== 'basic') {
            // 允许跨域资源（如CDN的CSS/JS）也被缓存
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            return response;
          }

          // 克隆响应
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // 离线时返回离线页面
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      })
  );
});

// 消息处理
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
