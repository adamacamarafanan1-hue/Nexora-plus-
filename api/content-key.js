import { createHash, webcrypto } from "node:crypto";

const CONTENT_VERSION = "v523-20260813-1";
const MAX_BODY_BYTES = 16 * 1024;
const FETCH_TIMEOUT_MS = 8_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const DEFAULT_SUPABASE_URL = "https://lzypxingcykvgxdifccq.supabase.co";
const DEFAULT_PUBLISHABLE_KEY = "sb_publishable_BOYKDhcighKMhX4k3I6RBw_F-B2jaPY";
const rateLimitBuckets = new Map();

function normalizeProduct(value) {
  const product = String(value || "").trim().toLowerCase();
  if (["modules", "pro", "professional", "professionnel"].includes(product)) return "pro";
  if (["academy", "orientation", "subjects", "novels", "eleves", "élèves", "student"].includes(product)) return "eleves";
  if (product === "adams") return "adams";
  return "";
}

function decodeResult(value) {
  let current = value;
  for (let index = 0; index < 3; index += 1) {
    if (Array.isArray(current) && current.length === 1) current = current[0];
    if (typeof current === "string") {
      try { current = JSON.parse(current); continue; } catch { break; }
    }
    if (current && typeof current === "object" && "data" in current) {
      current = current.data;
      continue;
    }
    break;
  }
  return current && typeof current === "object" ? current : {};
}

function validPublicJwk(jwk) {
  if (!jwk || typeof jwk !== "object" || jwk.kty !== "RSA") return false;
  if (typeof jwk.n !== "string" || typeof jwk.e !== "string") return false;
  if (jwk.n.length < 300 || jwk.n.length > 800 || jwk.e.length > 16) return false;
  return !["d", "p", "q", "dp", "dq", "qi", "oth"].some((field) => field in jwk);
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return {}; }
}

function fetchWithTimeout(url, options = {}) {
  return fetch(url, {
    ...options,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
}

function requestBody(request) {
  const length = Number(request.headers["content-length"] || 0);
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
    const error = new Error("REQUEST_TOO_LARGE");
    error.statusCode = 413;
    throw error;
  }
  const contentType = String(request.headers["content-type"] || "").toLowerCase();
  if (contentType && !contentType.includes("application/json")) {
    const error = new Error("UNSUPPORTED_MEDIA_TYPE");
    error.statusCode = 415;
    throw error;
  }
  if (typeof request.body === "string") {
    if (Buffer.byteLength(request.body, "utf8") > MAX_BODY_BYTES) {
      const error = new Error("REQUEST_TOO_LARGE");
      error.statusCode = 413;
      throw error;
    }
    try {
      return request.body ? JSON.parse(request.body) : {};
    } catch {
      const error = new Error("INVALID_JSON");
      error.statusCode = 400;
      throw error;
    }
  }
  if (!request.body) return {};
  if (typeof request.body !== "object" || Array.isArray(request.body)) {
    const error = new Error("INVALID_JSON");
    error.statusCode = 400;
    throw error;
  }
  if (Buffer.byteLength(JSON.stringify(request.body), "utf8") > MAX_BODY_BYTES) {
    const error = new Error("REQUEST_TOO_LARGE");
    error.statusCode = 413;
    throw error;
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
  if (rateLimitBuckets.size > 5_000) {
    for (const [key, value] of rateLimitBuckets) {
      if (value.resetAt <= now) rateLimitBuckets.delete(key);
    }
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
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1_000))
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
  if (data.active === true && String(data.status || "") === "active" && endsAt > serverNow) {
    return {
      starts_at: data.starts_at || null,
      ends_at: new Date(endsAt).toISOString(),
      server_now: new Date(serverNow).toISOString()
    };
  }
  return null;
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Vary", "Authorization");
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
      return response.status(429).json({ success: false, message: "Trop de demandes rapprochées. Réessaie dans un instant." });
    }
    const body = requestBody(request);
    const productCode = normalizeProduct(body.product_code);
    if (body.content_version !== CONTENT_VERSION || !productCode || !validPublicJwk(body.public_key_jwk)) {
      return response.status(400).json({ success: false, message: "Demande de contenu invalide." });
    }
    const url = String(process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/$/, "");
    const publishableKey = String(process.env.SUPABASE_PUBLISHABLE_KEY || DEFAULT_PUBLISHABLE_KEY);
    const contentKey = Buffer.from(String(process.env.NEXORA_CONTENT_KEY_B64 || ""), "base64");
    if (!url || !publishableKey || contentKey.length !== 32) throw new Error("SERVER_CONFIGURATION_MISSING");

    const userResponse = await fetchWithTimeout(url + "/auth/v1/user", {
      headers: { apikey: publishableKey, Authorization: "Bearer " + token }
    });
    if (!userResponse.ok) {
      return response.status(401).json({ success: false, message: "Session Nexora invalide ou expirée." });
    }
    const user = await readJson(userResponse);
    if (!user || !user.id) return response.status(401).json({ success: false, message: "Compte Nexora introuvable." });

    const subscription = await activeSubscription(url, publishableKey, token, productCode);
    if (!subscription) return response.status(403).json({ success: false, message: "Cet espace Nexora n’est pas actif sur ce compte." });

    // Les navigateurs exportent la clé publique RSA avec key_ops=["wrapKey"]
    // lorsque la paire locale sert à wrapKey/unwrapKey. Le chiffrement RSA-OAEP
    // produit ici est néanmoins exactement le paquet que le navigateur déplie
    // ensuite avec unwrapKey. Retirer uniquement cette indication d'usage avant
    // l'import évite le rejet WebCrypto "Key operations and usage mismatch",
    // sans modifier ni élargir les données cryptographiques de la clé publique.
    const publicJwk = { ...body.public_key_jwk };
    delete publicJwk.key_ops;
    const publicKey = await webcrypto.subtle.importKey(
      "jwk",
      publicJwk,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["encrypt"]
    );
    const wrapped = await webcrypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, contentKey);
    return response.status(200).json({
      success: true,
      user_id: String(user.id),
      content_version: CONTENT_VERSION,
      wrapped_key: Buffer.from(wrapped).toString("base64url"),
      starts_at: subscription.starts_at,
      ends_at: subscription.ends_at,
      server_now: subscription.server_now
    });
  } catch (error) {
    if (error && error.statusCode) {
      const messages = {
        400: "Corps JSON invalide.",
        413: "Demande trop volumineuse.",
        415: "Format de demande refusé. Utilise JSON."
      };
      return response.status(error.statusCode).json({ success: false, message: messages[error.statusCode] || "Demande refusée." });
    }
    console.error("Nexora content-key", error && error.message ? error.message : error);
    return response.status(500).json({ success: false, message: "Activation sécurisée momentanément indisponible." });
  }
}
