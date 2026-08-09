const CACHE_NAME = "nexora-v504-public-shell";
const PUBLIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/assets/icons/nexora-192.png",
  "/assets/icons/nexora-512.png",
  "/modules/jeu-adams/guinee/index.html",
  "/modules/jeu-adams/kdo/index.html",
  "/modules/jeu-adams/_moteur/plateau.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PUBLIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && !key.startsWith("nexora-premium-encrypted-"))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/protected/")) return;

  if (event.request.mode === "navigate") {
    const network = fetch(event.request).then(async (response) => {
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put("/index.html", response.clone());
      }
      return response;
    });
    event.respondWith(network.catch(() => caches.match("/index.html")));
    return;
  }

  if (!PUBLIC_ASSETS.includes(url.pathname)) return;
  const cachePromise = caches.open(CACHE_NAME);
  const refresh = cachePromise.then((cache) => fetch(event.request).then(async (response) => {
    if (response && response.ok) await cache.put(event.request, response.clone());
    return response;
  }));
  event.waitUntil(refresh.catch(() => undefined));
  event.respondWith(
    cachePromise.then((cache) => cache.match(event.request))
      .then((cached) => cached || refresh)
      .catch(() => caches.match(url.pathname))
  );
});
