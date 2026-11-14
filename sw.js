const CACHE_NAME = "english-daily-v1.7.1";

const ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./assets/favicon.svg",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./js/new-junior-passages.js",
  "./js/new-junior-textbook.js",
  "./js/data-junior-2026.js",
  "./js/data-junior-a.js",
  "./js/data-junior-b.js",
  "./js/data-junior-c.js",
  "./js/data-senior.js",
  "./js/data-senior-b.js",
  "./js/extra-junior-a.js",
  "./js/extra-junior-b.js",
  "./js/extra-junior-c.js",
  "./js/extra-senior-a.js",
  "./js/extra-senior-b.js",
  "./js/extra-senior-c.js",
  "./js/examples-junior-a.js",
  "./js/examples-junior-b.js",
  "./js/examples-junior-c.js",
  "./js/examples-senior-a1.js",
  "./js/examples-senior-a2.js",
  "./js/examples-senior-b.js",
  "./js/examples-senior-c.js",
  "./js/icons-junior-a.js",
  "./js/icons-junior-b.js",
  "./js/icons-junior-c.js",
  "./js/icons-senior-a1.js",
  "./js/icons-senior-a2.js",
  "./js/icons-senior-b.js",
  "./js/icons-senior-c.js",
  "./js/twemoji-map.js",
  "./js/app.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(ASSETS.map(async (url) => {
        try {
          const response = await fetch(url, { cache: "reload" });
          if (response && response.ok) await cache.put(url, response);
        } catch (error) {
          /* keep installing even if one asset is unavailable */
        }
      })))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(async () => (
        (await caches.match(event.request)) || (await caches.match("./index.html"))
      ))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
