const CACHE_NAME = "jec-connect-shell-v7";
const APP_SHELL = ["/", "/chants", "/decouvrir", "/icon.svg", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png", "/images/jec-community-illustration.svg", "/images/jec-music-illustration.svg", "/images/news-leaders.svg", "/images/news-learning.svg", "/images/news-wellbeing.svg"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      }).catch(async () => (await caches.match(request)) || (await caches.match("/")))
    );
    return;
  }

  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/images/") || ["/icon.svg","/icon-192.png","/icon-512.png","/apple-touch-icon.png"].includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }))
    );
  }
});
