// 말씀씨앗 Service Worker v2.0
// Network First 전략 — 항상 최신 콘텐츠, 오프라인 폴백

const CACHE_NAME = 'malsseumssiaat-v2';
const ASSETS = [
  './말씀씨앗.html',
  './manifest.json'
];

// 설치: 핵심 파일 캐싱 후 즉시 활성화
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 활성화: 이전 버전 캐시 전부 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('이전 캐시 삭제:', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// 네트워크 요청: Network First 전략
// 1. 네트워크에서 먼저 가져옴 (항상 최신 내용)
// 2. 오프라인이면 캐시 폴백
self.addEventListener('fetch', event => {
  // 외부 요청(Firebase 등)은 통과
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request).then(response => {
      // 정상 응답이면 캐시 업데이트
      if (response && response.status === 200 && response.type === 'basic') {
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
      }
      return response;
    }).catch(() => {
      // 오프라인 폴백: 캐시에서 반환
      return caches.match(event.request).then(cached => {
        if (cached) return cached;
        // HTML 요청이면 앱 메인 반환
        if (event.request.destination === 'document') {
          return caches.match('./말씀씨앗.html');
        }
      });
    })
  );
});
