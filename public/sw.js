const CACHE_NAME = "work-log-mini-v2";
const ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg"
];
const NETWORK_FIRST = new Set(["/", "/index.html", "/styles.css", "/app.js"]);

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isNetworkFirst = requestUrl.origin === self.location.origin && NETWORK_FIRST.has(requestUrl.pathname);

  event.respondWith(
    (isNetworkFirst ? fetch(event.request).catch(() => caches.match(event.request)) : caches.match(event.request))
      .then((cached) => {
        if (cached) {
          return cached;
        }

        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
      .catch(() =>
        fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
        })
      )
  );
});
