// 캐시 버전을 올리면 휴대폰이 새 앱 파일을 다시 받습니다.
const CACHE_NAME = 'moim-hoibi-v1';
const BASE = new URL('./', self.registration.scope);
const SHELL = [
  BASE.href,
  new URL('index.html', BASE).href,
  new URL('manifest.webmanifest', BASE).href,
  new URL('icons/icon-192.png', BASE).href,
  new URL('icons/icon-512.png', BASE).href,
  new URL('icons/icon-maskable-512.png', BASE).href,
  new URL('icons/apple-touch-icon.png', BASE).href
];
// 첫 온라인 방문에서 앱 화면과 아이콘을 저장합니다.
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
// 새 버전이 켜지면 이전 앱 파일을 비웁니다.
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('moim-hoibi-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
// 인터넷이 끊기면 저장한 앱 화면을 보여 줍니다.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    if (req.mode === 'navigate') {
      try {
        const response = await fetch(req);
        if (response.ok) cache.put(req, response.clone());
        return response;
      } catch (_) {
        return (await cache.match(req)) || (await cache.match(new URL('index.html', BASE).href)) || Response.error();
      }
    }
    const saved = await cache.match(req);
    if (saved) return saved;
    try {
      const response = await fetch(req);
      if (response.ok) cache.put(req, response.clone());
      return response;
    } catch (_) {
      return Response.error();
    }
  })());
});