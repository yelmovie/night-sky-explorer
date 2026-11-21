// 오프라인 재방문용 서비스워커(10 earthsea public/sw.js와 같은 방식). 한 번 연 화면은 인터넷이 끊겨도 다시 열린다.
// - 화면 주소(첫 HTML): 늘 네트워크 먼저, 끊기면 저장해 둔 것. 온라인이면 항상 최신 배포를 받는다.
// - 빌드 파일(assets/이름-해시.js·css): 이름이 바뀌어야 내용이 바뀌므로 저장본 먼저.
// - 그 밖의 그림·소리·글꼴: 네트워크 먼저, 끊기면 저장본.
// - 영상과 구간(Range) 요청은 건드리지 않는다(운영 워커가 206 조각으로 응답).
const CACHE = 'starlight-offline-v1';
const SHELL = new URL('./', self.location).href;
const HASHED = /\/assets\/[^/]+-[A-Za-z0-9_-]{8}\.(js|css)$/;
const SKIP = /\.(mp4|webm|m4v)$/i;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.add(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith('starlight-offline-') && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

function cacheable(request) {
  if (request.method !== 'GET' || request.headers.has('range')) return false;
  const url = new URL(request.url);
  return url.origin === self.location.origin && !SKIP.test(url.pathname);
}

async function store(key, response) {
  if (response && response.status === 200 && response.type === 'basic') {
    const cache = await caches.open(CACHE);
    await cache.put(key, response.clone());
  }
  return response;
}

async function networkFirst(request, key) {
  try {
    return await store(key, await fetch(request));
  } catch (error) {
    const cached = await caches.match(key, { ignoreSearch: true });
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  return cached || store(request, await fetch(request));
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (!cacheable(request)) return;
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, SHELL));
    return;
  }
  const path = new URL(request.url).pathname;
  event.respondWith(HASHED.test(path) ? cacheFirst(request) : networkFirst(request, request));
});

// 서비스워커가 자리 잡기 전에 첫 화면이 이미 받아 둔 파일 목록을 페이지가 보내 준다.
self.addEventListener('message', event => {
  const urls = Array.isArray(event.data?.cacheUrls) ? event.data.cacheUrls : [];
  event.waitUntil(caches.open(CACHE).then(cache => Promise.all(urls
    .filter(url => { try { const u = new URL(url); return u.origin === self.location.origin && !SKIP.test(u.pathname); } catch { return false; } })
    .map(url => caches.match(url).then(hit => hit || fetch(url).then(response => store(url, response)).catch(() => {}))))));
});
