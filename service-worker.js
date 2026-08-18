/* Nexora V542 — coque d'ouverture rapide, mise a jour immediate et
   chargement d'un fichier leger sans toucher a index.html. */

const CACHE_NAME = "nexora-v542-coque-1";
const CACHE_PREFIX = "nexora-";
const META_URL = "/__nexora_version_connue__";
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

/* V542 : index.html pese 1,85 Mo et ne peut plus etre televerse depuis un
   telephone. On ajoute au vol une seule ligne qui charge un fichier leger.
   PROTECTION : a la moindre anomalie, on rend le document d'origine intact. */
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
    const documentFrais = await fetch("/index.html", { cache: "no-store" });
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
  } catch (_erreur) {}
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
