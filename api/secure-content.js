import { createHash, webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const CONTENT_VERSION = "v525-20260813-1";
const CONTENT_MAP = Object.freeze({"assets/js/nx-v157-primary-school-script.js":{"url":"/protected/files/ab3f1a6cceba9724f3a5d36d.nxe","product_code":"eleves"},"modules/bac/index.html":{"url":"/protected/files/a6a283ff94a2851e734c5ede.nxe","product_code":"eleves"},"modules/classes/11eme.json":{"url":"/protected/files/e51b620cd75e93ae83e344c8.nxe","product_code":"eleves"},"modules/classes/12eme.json":{"url":"/protected/files/c4e39149108b567b6aef2360.nxe","product_code":"eleves"},"modules/classes/7eme.json":{"url":"/protected/files/ad67300d269c5eb12616e8f4.nxe","product_code":"eleves"},"modules/classes/8eme.json":{"url":"/protected/files/ac40a7493db7ee01c150db2b.nxe","product_code":"eleves"},"modules/classes/9eme.json":{"url":"/protected/files/bbad4d2aa74d8c0419a46916.nxe","product_code":"eleves"},"modules/classes/primaire.json":{"url":"/protected/files/54c1c7fd9d390962c3d68bfb.nxe","product_code":"eleves"},"modules/classes/terminale.json":{"url":"/protected/files/bc635c6e12a4ac6a9aa34984.nxe","product_code":"eleves"},"modules/dixieme/index.html":{"url":"/protected/files/50df30c2ca0408fada514c78.nxe","product_code":"eleves"},"modules/formation/citoyennete/cours.json":{"url":"/protected/files/b87458fc2914449f611e8d49.nxe","product_code":"pro"},"modules/formation/communication/cours.json":{"url":"/protected/files/70ffb6c264ea415aaa3146d5.nxe","product_code":"pro"},"modules/formation/creation-entreprise/cours.json":{"url":"/protected/files/cc2adb251b5525e12cb2a138.nxe","product_code":"pro"},"modules/formation/culture-generale/cours.json":{"url":"/protected/files/800e13b3fc260b2ca779c98f.nxe","product_code":"pro"},"modules/formation/developpement-personnel/cours.json":{"url":"/protected/files/1e355e206e34deab1f650ad7.nxe","product_code":"pro"},"modules/formation/education-financiere/cours.json":{"url":"/protected/files/c4601f75f15602d0cab9a8d8.nxe","product_code":"pro"},"modules/formation/employabilite/cours.json":{"url":"/protected/files/737011d2130509ec3f613692.nxe","product_code":"pro"},"modules/formation/entrepreneuriat/cours.json":{"url":"/protected/files/fd863597acb06e79c195f4a3.nxe","product_code":"pro"},"modules/formation/gestion-projet/cours.json":{"url":"/protected/files/ff82af2b327b9d1feb1fd1d9.nxe","product_code":"pro"},"modules/formation/hygiene/cours.json":{"url":"/protected/files/33704dd90a9fc8c527d47652.nxe","product_code":"pro"},"modules/formation/ia/cours.json":{"url":"/protected/files/a272d2f1382a5717af8eaca4.nxe","product_code":"pro"},"modules/formation/innovation/cours.json":{"url":"/protected/files/dcf95fad6d78abf795407a90.nxe","product_code":"pro"},"modules/formation/leadership/cours.json":{"url":"/protected/files/6e21ccf998bd556ea111bf91.nxe","product_code":"pro"},"modules/formation/marketing-digital/cours.json":{"url":"/protected/files/d67b762cbfc60f0bcf5d22f5.nxe","product_code":"pro"},"modules/formation/orientation-ethique/cours.json":{"url":"/protected/files/5518d5256ec9e2eeebb3fd19.nxe","product_code":"pro"},"modules/formation/premiers-secours/cours.json":{"url":"/protected/files/1ad0a481b30869986f085316.nxe","product_code":"pro"},"modules/formation/preparation-emploi/cours.json":{"url":"/protected/files/b3934a0ed6f210ca029b2eb0.nxe","product_code":"pro"},"modules/formation/prise-parole/cours.json":{"url":"/protected/files/1ca2aa93d3546de9ff428126.nxe","product_code":"pro"},"modules/formation/redaction-pro/cours.json":{"url":"/protected/files/899d38cbbc0a08dd422af742.nxe","product_code":"pro"},"modules/formation/sante/cours.json":{"url":"/protected/files/f8133a0bd578209962f8ca76.nxe","product_code":"pro"},"modules/formation/securite-numerique/cours.json":{"url":"/protected/files/14e1b5ac292e0cff9388e259.nxe","product_code":"pro"},"modules/formation/securite-travail/cours.json":{"url":"/protected/files/ffe3252543d1ea8f4ba8557a.nxe","product_code":"pro"},"modules/jeu-adams/10e/index.html":{"url":"/protected/files/7b64982ff9e0e9274fb3b330.nxe","product_code":"adams"},"modules/jeu-adams/11e/index.html":{"url":"/protected/files/7a86a637559fc1ee163f4046.nxe","product_code":"adams"},"modules/jeu-adams/12e/index.html":{"url":"/protected/files/27eecb4c7c00c7ae65446f6c.nxe","product_code":"adams"},"modules/jeu-adams/7e/index.html":{"url":"/protected/files/acf7b16c305e3004db814392.nxe","product_code":"adams"},"modules/jeu-adams/8e/index.html":{"url":"/protected/files/758c531393e77afbb234de59.nxe","product_code":"adams"},"modules/jeu-adams/9e/index.html":{"url":"/protected/files/37e2f1871ce6f1c4905b11c4.nxe","product_code":"adams"},"modules/jeu-adams/art/index.html":{"url":"/protected/files/34b9764be6b69788e5592371.nxe","product_code":"adams"},"modules/jeu-adams/ecole/index.html":{"url":"/protected/files/df7970129fb5078c4d9b80f0.nxe","product_code":"adams"},"modules/jeu-adams/histoire/index.html":{"url":"/protected/files/724b30787cb4a81865dc3892.nxe","product_code":"adams"},"modules/jeu-adams/maternelle-v454/index.html":{"url":"/protected/files/f8f841d4419df5851b1308f7.nxe","product_code":"adams"},"modules/jeu-adams/musique/index.html":{"url":"/protected/files/dfaa9629c4fa3098ae0b2150.nxe","product_code":"adams"},"modules/jeu-adams/preuniv/index.html":{"url":"/protected/files/ae8c1fc15ca20e69904fd864.nxe","product_code":"adams"},"modules/jeu-adams/pro/index.html":{"url":"/protected/files/d853106639d06718d008e1bd.nxe","product_code":"adams"},"modules/jeu-adams/sante/index.html":{"url":"/protected/files/d228572e3a1b7cbabf7f9e4a.nxe","product_code":"adams"},"modules/jeu-adams/sport/index.html":{"url":"/protected/files/eb842cd280c43faac25f5b5c.nxe","product_code":"adams"},"modules/jeu-adams/terminale/index.html":{"url":"/protected/files/437f718937bd6f1fdc282341.nxe","product_code":"adams"},"modules/jeu-adams/univ/index.html":{"url":"/protected/files/ac2f16ad6eaadc5835256164.nxe","product_code":"adams"},"modules/orientation/index.html":{"url":"/protected/files/ed0bda6b2d0a1715ca75cc45.nxe","product_code":"eleves"},"modules/recherche-lettres/index.html":{"url":"/protected/files/262c2a2606a75dcc9450f8a5.nxe","product_code":"eleves"}});

const MAX_BODY_BYTES = 8 * 1024;
const FETCH_TIMEOUT_MS = 12_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 120;
const DEFAULT_SUPABASE_URL = "https://lzypxingcykvgxdifccq.supabase.co";
const DEFAULT_PUBLISHABLE_KEY = "sb_publishable_BOYKDhcighKMhX4k3I6RBw_F-B2jaPY";
const rateLimitBuckets = new Map();

function normalizePath(value) {
  return String(value || "")
    .split("#")[0]
    .split("?")[0]
    .replace(/\\/g, "/")
    .replace(/^https?:\/\/[^/]+\//i, "")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
}

function decodeResult(value) {
  let current = value;
  for (let index = 0; index < 6; index += 1) {
    if (Array.isArray(current) && current.length === 1) current = current[0];
    if (typeof current === "string") {
      try { current = JSON.parse(current); continue; } catch { break; }
    }
    if (current && typeof current === "object") {
      if ("active" in current || "status" in current) break;
      const wrappedKey = ["data", "result", "resultat", "nexora_my_subscription_status_v264"]
        .find((key) => key in current);
      if (wrappedKey) {
        current = current[wrappedKey];
        continue;
      }
    }
    break;
  }
  return current && typeof current === "object" ? current : {};
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return {}; }
}

function fetchWithTimeout(url, options = {}) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
}

function requestBody(request) {
  const length = Number(request.headers["content-length"] || 0);
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
    const error = new Error("REQUEST_TOO_LARGE"); error.statusCode = 413; throw error;
  }
  const contentType = String(request.headers["content-type"] || "").toLowerCase();
  if (contentType && !contentType.includes("application/json")) {
    const error = new Error("UNSUPPORTED_MEDIA_TYPE"); error.statusCode = 415; throw error;
  }
  if (typeof request.body === "string") {
    if (Buffer.byteLength(request.body, "utf8") > MAX_BODY_BYTES) {
      const error = new Error("REQUEST_TOO_LARGE"); error.statusCode = 413; throw error;
    }
    try { return request.body ? JSON.parse(request.body) : {}; }
    catch { const error = new Error("INVALID_JSON"); error.statusCode = 400; throw error; }
  }
  if (!request.body) return {};
  if (typeof request.body !== "object" || Array.isArray(request.body)) {
    const error = new Error("INVALID_JSON"); error.statusCode = 400; throw error;
  }
  return request.body;
}

function rateLimitKey(request, token) {
  const forwarded = String(request.headers["x-vercel-forwarded-for"] || request.headers["x-forwarded-for"] || "");
  const ip = forwarded.split(",")[0].trim().slice(0, 80) || "unknown";
  const tokenHash = createHash("sha256").update(token).digest("base64url").slice(0, 24);
  return ip + ":" + tokenHash;
}

function consumeRateLimit(request, token) {
  const now = Date.now();
  if (rateLimitBuckets.size > 5000) {
    for (const [key, value] of rateLimitBuckets) if (value.resetAt <= now) rateLimitBuckets.delete(key);
  }
  const key = rateLimitKey(request, token);
  let bucket = rateLimitBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitBuckets.set(key, bucket);
  }
  bucket.count += 1;
  return {
    allowed: bucket.count <= RATE_LIMIT_MAX_REQUESTS,
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - bucket.count),
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
  };
}

async function activeSubscription(url, publishableKey, token, productCode) {
  const response = await fetchWithTimeout(url + "/rest/v1/rpc/nexora_my_subscription_status_v264", {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: "Bearer " + token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ p_product_code: productCode })
  });
  if (!response.ok) throw new Error("SUBSCRIPTION_CHECK_FAILED");
  const data = decodeResult(await readJson(response));
  const serverNow = Date.parse(data.server_now || "") || Date.now();
  const endsAt = Date.parse(data.ends_at || "") || 0;
  return data.active === true && String(data.status || "") === "active" && endsAt > serverNow;
}

async function currentUser(url, publishableKey, token) {
  const response = await fetchWithTimeout(url + "/auth/v1/user", {
    headers: { apikey: publishableKey, Authorization: "Bearer " + token }
  });
  if (!response.ok) return null;
  const data = await readJson(response);
  return data && data.id ? data : null;
}

async function encryptedBytes(entry, request) {
  const relative = normalizePath(entry.url);
  try {
    return await readFile(join(process.cwd(), relative));
  } catch {
    const deploymentHost = String(process.env.VERCEL_URL || "").trim();
    const fallbackHost = String(request.headers["x-forwarded-host"] || request.headers.host || "").trim();
    const host = deploymentHost || fallbackHost;
    if (!host) throw new Error("CONTENT_FILE_UNAVAILABLE");
    const proto = deploymentHost ? "https" : String(request.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
    const response = await fetchWithTimeout(proto + "://" + host + "/" + relative, {
      method: "GET",
      cache: "no-store",
      headers: { "User-Agent": "Nexora-V525-Secure-Content" }
    });
    if (!response.ok) throw new Error("CONTENT_FILE_UNAVAILABLE");
    return Buffer.from(await response.arrayBuffer());
  }
}

async function decryptNxe(buffer, path, keyBytes) {
  if (!buffer || buffer.length < 33 || buffer.subarray(0, 4).toString("ascii") !== "NXE1") {
    throw new Error("INVALID_NXE");
  }
  const iv = buffer.subarray(4, 16);
  const ciphertextAndTag = buffer.subarray(16);
  const key = await webcrypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
  const plain = await webcrypto.subtle.decrypt(
    { name: "AES-GCM", iv, additionalData: Buffer.from(path, "utf8") },
    key,
    ciphertextAndTag
  );
  return Buffer.from(plain);
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  response.setHeader("Pragma", "no-cache");
  response.setHeader("Vary", "Authorization");
  response.setHeader("X-Content-Type-Options", "nosniff");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ success: false, message: "Méthode refusée." });
  }

  try {
    const authorization = String(request.headers.authorization || "");
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (!token || token.length > 10000) {
      return response.status(401).json({ success: false, message: "Connexion Nexora obligatoire." });
    }

    const rateLimit = consumeRateLimit(request, token);
    response.setHeader("X-RateLimit-Limit", String(RATE_LIMIT_MAX_REQUESTS));
    response.setHeader("X-RateLimit-Remaining", String(rateLimit.remaining));
    if (!rateLimit.allowed) {
      response.setHeader("Retry-After", String(rateLimit.retryAfter));
      return response.status(429).json({ success: false, message: "Trop de chargements rapprochés. Réessaie dans un instant." });
    }

    const body = requestBody(request);
    if (String(body.content_version || "") !== CONTENT_VERSION) {
      return response.status(409).json({ success: false, message: "Version Nexora expirée. Recharge l’application." });
    }

    const path = normalizePath(body.path);
    const entry = CONTENT_MAP[path];
    if (!entry || !entry.url || !["eleves", "pro", "adams"].includes(entry.product_code)) {
      return response.status(404).json({ success: false, message: "Contenu Nexora introuvable." });
    }

    const url = String(process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/$/, "");
    const publishableKey = String(process.env.SUPABASE_PUBLISHABLE_KEY || DEFAULT_PUBLISHABLE_KEY);
    const contentKey = Buffer.from(String(process.env.NEXORA_CONTENT_KEY_B64 || ""), "base64");
    if (!url || !publishableKey || contentKey.length !== 32) throw new Error("SERVER_CONFIGURATION_MISSING");

    const user = await currentUser(url, publishableKey, token);
    if (!user) return response.status(401).json({ success: false, message: "Session Nexora invalide ou expirée." });

    const allowed = await activeSubscription(url, publishableKey, token, entry.product_code);
    if (!allowed) {
      const label = entry.product_code === "pro" ? "professionnel" : entry.product_code === "eleves" ? "élève" : "Jeu Adams";
      return response.status(403).json({ success: false, message: "Un abonnement " + label + " actif est requis pour ce contenu." });
    }

    const packed = await encryptedBytes(entry, request);
    const plain = await decryptNxe(packed, path, contentKey);
    response.setHeader("Content-Type", "application/octet-stream");
    response.setHeader("Content-Length", String(plain.length));
    response.setHeader("X-Nexora-Product", entry.product_code);
    return response.status(200).send(plain);
  } catch (error) {
    if (error && error.statusCode) {
      const messages = { 400: "Corps JSON invalide.", 413: "Demande trop volumineuse.", 415: "Format de demande refusé. Utilise JSON." };
      return response.status(error.statusCode).json({ success: false, message: messages[error.statusCode] || "Demande refusée." });
    }
    console.error("Nexora secure-content", error && error.message ? error.message : error);
    return response.status(500).json({ success: false, message: "Ouverture sécurisée momentanément indisponible." });
  }
}
