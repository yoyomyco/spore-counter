// 孢子計數器 Service Worker
// 更新網站內容後,把下面的版本號 +1(v1 -> v2),使用者下次連線就會拿到新版
const CACHE = 'spore-counter-v1';

const ASSETS = [
  './spore-counter.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png'
];

// 安裝:預先快取核心檔案
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

// 啟用:清掉舊版本快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 取用策略
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // 網頁本身:先連網(有更新就即時反映),連不上再用快取
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((c) => c || caches.match('./spore-counter.html'))
        )
    );
    return;
  }

  // 其他資源(圖示等):先用快取,沒有再連網並補進快取
  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
      );
    })
  );
});
