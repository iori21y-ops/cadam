// 렌테일러 Service Worker — 기본 오프라인 캐시
const STATIC_CACHE  = 'rentailor-static-v1';
const DYNAMIC_CACHE = 'rentailor-dynamic-v1';

// 앱 셸: 설치 시 선제 캐시
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/diagnosis/report',
  '/site.webmanifest',
];

// ── install ──────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting()),
  );
});

// ── activate ─────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  const KEEP = [STATIC_CACHE, DYNAMIC_CACHE];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k)),
      ))
      .then(() => self.clients.claim()),
  );
});

// ── fetch ────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // GET 요청만 처리
  if (request.method !== 'GET') return;

  // 외부 도메인, API 라우트는 네트워크 그대로
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Next.js 정적 자산 (_next/static): cache-first (해시로 영구 캐시 가능)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 이미지·폰트: cache-first
  if (
    url.pathname.match(/\.(png|jpg|jpeg|webp|avif|svg|ico|woff2?|ttf)$/i)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 페이지 요청: network-first (캐시 폴백 + 오프라인 페이지)
  event.respondWith(networkFirst(request));
});

// ── 전략 함수 ─────────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // 오프라인 폴백
    const offline = await caches.match('/offline.html');
    return offline ?? new Response('Offline', { status: 503 });
  }
}
