const CACHE_NAME = "viciotv-cache-v3";

// SOLO assets locales del repo (GitHub Pages friendly)
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./sw.js"
];

// ─── INSTALL ───
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ─── ACTIVATE (evita cache viejo en GitHub Pages) ───
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) return caches.delete(key);
          })
        )
      ),
      self.clients.claim()
    ])
  );
});

// ─── FETCH STRATEGY ───
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. TMDB API → siempre online (IMPORTANTE)
  if (url.hostname.includes("api.themoviedb.org")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Posters / imágenes → cache first
  if (
    url.hostname.includes("image.tmdb.org") ||
    url.hostname.includes("dicebear.com")
  ) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // 3. Navegación (GitHub Pages SPA fix)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // 4. default
  event.respondWith(fetch(event.request));
});

// ─── HELPERS ───
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) return cached;

  const response = await fetch(request);
  cache.put(request, response.clone());
  return response;
}
