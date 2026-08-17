/* Nexora V538 — coque d'ouverture rapide et mise à jour immédiate. */

const CACHE_NAME = "nexora-v539-coque-1";
const CACHE_PREFIX = "nexora-";
const META_URL = "/__nexora_version_connue__";
/* V538 : le controle passe de 6 heures a 5 minutes. Un eleve qui vient de payer
   ou qui rouvre apres une correction ne doit pas attendre une demi-journee. */
const DELAI_CONTROLE_MS = 5 * 60 * 1000;

const PUBLIC_ASSETS = [
  "/index.html",
  "/manifest.json",
  "/assets/icons/nexora-192.png",
  "/assets/icons/nexora-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PUBLIC_ASSETS)));
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

let versionAnnoncee = false;

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

      /* V538 : les fichiers d'/assets/ gardent souvent le meme nom d'une version
         a l'autre. Sans ce menage, l'eleve recevrait le nouveau document mais
         l'ancien code. On les retire pour qu'ils soient repris. */
      try {
        const clesGardees = await cache.keys();
        for (const requete of clesGardees) {
          if (new URL(requete.url).pathname.startsWith("/assets/")) {
            await cache.delete(requete);
          }
        }
      } catch (_menage) { /* sans consequence : ils seront repris plus tard */ }

      await ecrireMeta(cache, { version: version, verifieA: maintenant });

      /* V538 : la page ouverte affiche encore l'ancienne version. On previent
         l'application ; si personne n'ecoute, on la recharge nous-memes. */
      try {
        const pages = await self.clients.matchAll({ type: "window" });
        for (const page of pages) {
          page.postMessage({ type: "NEXORA_NOUVELLE_VERSION", version: version });
        }
        if (!versionAnnoncee) {
          versionAnnoncee = true;
          for (const page of pages) {
            if (typeof page.navigate === "function") {
              try { await page.navigate(page.url); } catch (_nav) {}
            }
          }
        }
      } catch (_avis) {}
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

  if (url.pathname.startsWith("/assets/")) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const reponse = await fetch(event.request);
      if (reponse && reponse.ok) {
        try { await cache.put(event.request, reponse.clone()); } catch (_erreur) {}
      }
      return reponse;
    })());
    return;
  }

  if (!PUBLIC_ASSETS.includes(url.pathname)) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
