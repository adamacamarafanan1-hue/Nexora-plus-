/* Nexora V527.4 — cache renouvelé après correction BAC et chargement sécurisé.
   Le document n'est plus retéléchargé à chaque
   lancement. On lit d'abord version.json (fichier léger, au plus une fois toutes
   les 15 minutes) ; le document n'est repris que si le numéro de version a
   réellement changé. */

const CACHE_NAME = "nexora-v5274-bac-cours-1";
const CACHE_PREFIX = "nexora-";
const META_URL = "/__nexora_version_connue__";
const DELAI_CONTROLE_MS = 15 * 60 * 1000;

const PUBLIC_ASSETS = [
  "/index.html",
  "/manifest.json",
  "/assets/icons/nexora-192.png",
  "/assets/icons/nexora-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PUBLIC_ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function lireMeta(cache) {
  try {
    const reponse = await cache.match(META_URL);
    if (!reponse) return { version: "", verifieA: 0 };
    return await reponse.json();
  } catch (_erreur) {
    return { version: "", verifieA: 0 };
  }
}

async function ecrireMeta(cache, meta) {
  try {
    await cache.put(META_URL, new Response(JSON.stringify(meta), {
      headers: { "Content-Type": "application/json" }
    }));
  } catch (_erreur) { /* le cache peut être plein : ce n'est pas bloquant */ }
}

/* Contrôle économe : version.json d'abord, document seulement si nécessaire. */
async function verifierVersion(cache) {
  const meta = await lireMeta(cache);
  const maintenant = Date.now();
  if (meta.verifieA && (maintenant - meta.verifieA) < DELAI_CONTROLE_MS) return;

  let info = null;
  try {
    const reponse = await fetch("/version.json?t=" + maintenant, { cache: "no-store" });
    if (!reponse || !reponse.ok) return;
    info = await reponse.json();
  } catch (_erreur) {
    return;
  }

  const version = String((info && info.version) || "");
  if (!version) return;

  if (meta.version && version === meta.version) {
    await ecrireMeta(cache, { version: meta.version, verifieA: maintenant });
    return;
  }

  try {
    const documentFrais = await fetch("/index.html", { cache: "no-store" });
    if (documentFrais && documentFrais.ok) {
      await cache.put("/index.html", documentFrais.clone());
      await ecrireMeta(cache, { version: version, verifieA: maintenant });
    }
  } catch (_erreur) { /* hors ligne : on garde la version en cache */ }
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname === "/version.json") return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/protected/") || url.pathname.startsWith("/modules/jeu-adams/")) return;

  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match("/index.html");
      if (cached) {
        event.waitUntil(verifierVersion(cache));
        return cached;
      }
      try {
        const reponse = await fetch(event.request, { cache: "no-store" });
        if (reponse && reponse.ok) {
          await cache.put("/index.html", reponse.clone());
          await ecrireMeta(cache, { version: "", verifieA: 0 });
        }
        return reponse;
      } catch (_erreur) {
        return new Response(
          "Nexora indisponible sans connexion lors de la première ouverture.",
          { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
        );
      }
    })());
    return;
  }

  /* Les fichiers d'/assets/ portent un numéro de version dans leur nom et sont
     marqués immutable côté Vercel : une fois lus, ils sont gardés. La rubrique
     s'ouvre alors sans réseau au coup suivant. */
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(event.request);
      try {
        const reponse = await fetch(event.request, { cache: "no-store" });
        if (reponse && reponse.ok) {
          try { await cache.put(event.request, reponse.clone()); } catch (_erreur) {}
          return reponse;
        }
      } catch (_erreur) {
        if (cached) return cached;
        throw _erreur;
      }
      return cached || fetch(event.request, { cache: "no-store" });
    })());
    return;
  }

  if (!PUBLIC_ASSETS.includes(url.pathname)) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
