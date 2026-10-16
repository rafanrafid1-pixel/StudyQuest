const CACHE_NAME = 'studyquest-v1101-google-account-routing';
const CACHE_PREFIX = 'studyquest-';
const SHELL = ['./', './index.html', './manifest.webmanifest', './studyquest-icon.svg', './online-resources.js'];

self.addEventListener('install', event => {
  // Activate new versions automatically; the page persists app data locally before this can reload.
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy)).catch(() => {});
        }
        return response;
      }).catch(() => caches.match('./index.html').then(cached => cached || caches.match('./')))
    );
    return;
  }

  // Prefer fresh same-origin assets so a new deployment cannot be masked by old cached files.
  event.respondWith(
    fetch(req).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(req, response.clone())).catch(() => {});
      return response;
    }).catch(() => caches.match(req))
  );
});
