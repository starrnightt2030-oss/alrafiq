// عامل الخدمة — يُولَّد تلقائيًّا عند البناء
const VERSION = '__VERSION__';
const CACHE = 'alrafiq-' + VERSION;
const FILES = __FILES__;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('alrafiq-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('message', (e) => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.endsWith('/version.json')) return; // دائمًا من الشبكة لمعرفة آخر إصدار
  if (url.pathname.endsWith('/audio/stories/manifest.json')) {
    e.respondWith(fetch(e.request).then((res) => { const c = res.clone(); caches.open(CACHE).then((x) => x.put(url.pathname, c)); return res; }).catch(() => caches.match(url.pathname)));
    return;
  }
  // الملفات الصوتية: من التخزين إن وُجدت، وإلا من الشبكة مع حفظ نسخة كاملة للاستماع بدون إنترنت لاحقًا
  if (url.pathname.includes('/audio/')) {
    e.respondWith(caches.match(url.pathname).then((hit) => {
      if (hit) return hit;
      fetch(url.pathname).then((full) => { if (full.status === 200) caches.open(CACHE).then((c) => c.put(url.pathname, full)); }).catch(() => {});
      return fetch(e.request);
    }));
    return;
  }
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('./', { ignoreSearch: true })));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
    if (res.status === 200) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return res;
  })));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((list) => list[0] ? list[0].focus() : self.clients.openWindow('./')));
});
