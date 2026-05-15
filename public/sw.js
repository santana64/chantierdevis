const CACHE = "chantierdevis-v1";
const OFFLINE_URL = "/app";

// Ressources à précacher au démarrage
const PRECACHE = [
  "/",
  "/app",
  "/manifest.json",
  "/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Ne pas intercepter les requêtes non-GET ni les API / cron
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/")) return;

  // Stratégie : Network-first pour les pages, Cache-first pour les assets statiques
  const isStatic =
    url.pathname.startsWith("/icon") ||
    url.pathname === "/manifest.json" ||
    url.pathname.match(/\.(svg|png|ico|webp|woff2?)$/);

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request))
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Ne mettre en cache que les réponses OK de même origine
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached ?? caches.match(OFFLINE_URL)))
  );
});
