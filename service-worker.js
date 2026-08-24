/* Nexora V600 — mise à jour fiable des contenus sans vider le cache manuellement. */

const CACHE_NAME = "nexora-v600-coque-1";
const CACHE_PREFIX = "nexora-";
const META_URL = "/__nexora_version_connue__";
const DELAI_CONTROLE_MS = 5 * 60 * 1000;

const PUBLIC_ASSETS = [
  "/index.html",
  "/manifest.json",
  "/assets/icons/nexora-192.png",
  "/assets/icons/nexora-512.png"
];

const TOUJOURS_FRAIS = new Set([
  "/assets/js/nx-v157-primary-school-script.js",
  "/assets/js/nexora-reglages.js"
]);

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

/* index.html reste enrichi à la volée avec le module léger de réglages. */
const LIGNE_AJOUTEE = '<script src="/assets/js/nexora-reglages.js" defer></' + 'script>';

async function enrichir(reponse) {
  try {
    if (!reponse || !reponse.ok) return reponse;
    const type = reponse.headers.get("Content-Type") || "";
    if (type && type.indexOf("text/html") < 0) return reponse;

    const texte = await reponse.clone().text();
    if (!texte || texte.length < 10000) return reponse;
    if (texte.indexOf("nexora-reglages.js") >= 0) return reponse;
    const fin = texte.lastIndexOf("</body>");
    if (fin < 0) return reponse;

    const enrichi = texte.slice(0, fin) + LIGNE_AJOUTEE + texte.slice(fin);
    if (enrichi.length <= texte.length) return reponse;

    const entetes = new Headers(reponse.headers);
    entetes.delete("Content-Length");
    return new Response(enrichi, {
      status: reponse.status,
      statusText: reponse.statusText,
      headers: entetes
    });
  } catch (_erreur) {
    return reponse;
  }
}

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
  } catch (_erreur) {}
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
    const documentFrais = await fetch("/index.html?t=" + maintenant, { cache: "no-store" });
    if (documentFrais && documentFrais.ok) {
      await cache.put("/index.html", documentFrais.clone());

      try {
        const clesGardees = await cache.keys();
        for (const requete of clesGardees) {
          if (new URL(requete.url).pathname.startsWith("/assets/")) {
            await cache.delete(requete);
          }
        }
      } catch (_menage) {}

      await ecrireMeta(cache, { version: version, verifieA: maintenant });

      try {
        const pages = await self.clients.matchAll({ type: "window" });
        for (const page of pages) {
          page.postMessage({ type: "NEXORA_NOUVELLE_VERSION", version: version });
        }
      } catch (_avis) {}
    }
  } catch (_erreur) {}
}

async function reseauPuisCache(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const url = new URL(request.url);
    url.searchParams.set("_nxv", Date.now().toString());
    const frais = await fetch(new Request(url.toString(), request), { cache: "no-store" });
    if (frais && frais.ok) {
      try { await cache.put(request, frais.clone()); } catch (_cache) {}
      return frais;
    }
  } catch (_reseau) {}

  const ancien = await cache.match(request);
  if (ancien) return ancien;
  return fetch(request, { cache: "reload" });
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname === "/version.json") return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/protected/") || url.pathname.startsWith("/modules/jeu-adams/")) return;

  /* Ces fichiers portent un nom stable mais leur contenu change. On vérifie donc
     le réseau à chaque demande. Le cache ne sert que de secours hors connexion. */
  if (TOUJOURS_FRAIS.has(url.pathname)) {
    event.respondWith(reseauPuisCache(event.request));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match("/index.html");
      if (cached) {
        event.waitUntil(verifierVersion(cache));
        return await enrichir(cached);
      }
      try {
        const reponse = await fetch(event.request, { cache: "no-store" });
        if (reponse && reponse.ok) {
          await cache.put("/index.html", reponse.clone());
          await ecrireMeta(cache, { version: "", verifieA: 0 });
        }
        return await enrichir(reponse);
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
      const reponse = await fetch(event.request, { cache: "reload" });
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
