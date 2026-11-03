const CACHE_NAME = 'dailyflow-v5';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest.webmanifest',
  '/assetlinks.json',
  '/.well-known/assetlinks.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/screenshot-mobile.png',
  '/screenshot-desktop.png',
];

// 1. Saat install: simpan file inti ke cache dengan allSettled agar instalasi SW tidak pernah gagal
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(ASSETS_TO_CACHE.map((assetUrl) => cache.add(assetUrl)))
    )
  );
  self.skipWaiting();
});

// 2. Saat activate: hapus cache versi lama & langsung klaim kontrol halaman
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// 3. Saat fetch: strategi network-first untuk manifest, assetlinks & HTML
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;

  const url = new URL(request.url);

  // Jangan intercept API eksternal (misal Gemini API)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Di mode local development (Vite port 5173 / file /src/), utamakan network agar live-reload langsung tampil
  if (
    url.port === '5173' ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules/')
  ) {
    return;
  }

  // Untuk manifest.json, manifest.webmanifest, dan assetlinks.json (.well-known), selalu gunakan network-first (JANGAN pernah fallback ke index.html!)
  if (
    url.pathname.endsWith('manifest.json') ||
    url.pathname.endsWith('manifest.webmanifest') ||
    url.pathname.endsWith('assetlinks.json') ||
    url.pathname.startsWith('/.well-known/')
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Untuk navigasi halaman & aset lainnya: cache-first dengan fallback offline ke index.html
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return Response.error();
        });
    })
  );
});

// ===== FITUR NOTIFIKASI =====
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'DailyFlow Pengingat', body: 'Waktunya produktif hari ini!' };
  try {
    if (event.data) data = event.data.json();
  } catch {
    if (event.data) data.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
    })
  );
});
