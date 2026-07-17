const { webcrypto } = require('crypto');

const DEFAULT_SUPABASE_URL = 'https://lzypxingcykvgxdifccq.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable_BOYKDhcighKMhX4k3I6RBw_F-B2jaPY';
const CONTENT_VERSION = 'v211-20260717-1';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.end(JSON.stringify(body));
}
function unpack(value) {
  if (Array.isArray(value) && value.length === 1) value = value[0];
  if (typeof value === 'string') { try { value = JSON.parse(value); } catch (_) {} }
  return value || {};
}
function decodeJwtSubject(token) {
  try { return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')).sub || ''; } catch (_) { return ''; }
}
async function rpc(url, anonKey, token, name, payload) {
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { 'apikey': anonKey, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload || {})
  });
  let data = null; try { data = await response.json(); } catch (_) {}
  return { ok: response.ok, status: response.status, data };
}
async function subscriptionStatus(url, anonKey, token) {
  const attempts = [
    ['nexora_my_subscription_status_v4', { p_product_code: 'all' }],
    ['nexora_my_subscription_status_v3', {}],
    ['nexora_my_subscription_status_v2', {}],
    ['nexora_my_subscription_status', {}]
  ];
  let last = null;
  for (const [name, payload] of attempts) {
    const result = await rpc(url, anonKey, token, name, payload);
    last = result;
    if (result.ok) {
      const data = unpack(result.data);
      if (data.active === true && String(data.status || 'active') === 'active') return data;
      if (name === 'nexora_my_subscription_status') return data;
    } else {
      const code = String(result.data && result.data.code || '');
      if (result.status === 401 || result.status === 403) throw new Error('AUTH');
      if (!(result.status === 404 || code === 'PGRST202' || code === '42883')) throw new Error(String(result.data && result.data.message || 'RPC_ERROR'));
    }
  }
  return unpack(last && last.data);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { success: false, message: 'Méthode non autorisée.' });
  const authorization = String(req.headers.authorization || '');
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) return json(res, 401, { success: false, message: 'Connexion Nexora obligatoire.' });
  const secret = String(process.env.NEXORA_CONTENT_KEY_B64 || '').trim();
  if (!secret) return json(res, 503, { success: false, message: 'La clé sécurisée Vercel n’est pas configurée.' });
  let keyBytes;
  try { keyBytes = Buffer.from(secret, 'base64'); } catch (_) {}
  if (!keyBytes || keyBytes.length !== 32) return json(res, 503, { success: false, message: 'La clé Vercel doit contenir exactement 32 octets en base64.' });
  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body || '{}'); } catch (_) { return json(res, 400, { success: false, message: 'Requête invalide.' }); } }
  if (body.content_version && body.content_version !== CONTENT_VERSION) return json(res, 409, { success: false, message: 'Mise à jour de Nexora requise.' });
  const jwk = body.public_key_jwk;
  if (!jwk || jwk.kty !== 'RSA' || !jwk.n || !jwk.e) return json(res, 400, { success: false, message: 'Clé du téléphone invalide.' });
  try {
    const url = String(process.env.NEXORA_SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/$/, '');
    const anonKey = String(process.env.NEXORA_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY);
    const status = await subscriptionStatus(url, anonKey, token);
    const serverNow = Date.now();
    const endsAtMs = Date.parse(status.ends_at || '');
    if (!(status.active === true && String(status.status || 'active') === 'active' && endsAtMs > serverNow)) {
      return json(res, 403, { success: false, message: 'Aucun abonnement actif avec une date d’expiration valide.' });
    }
    const publicKey = await webcrypto.subtle.importKey('jwk', jwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['wrapKey']);
    const contentKey = await webcrypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
    const wrapped = await webcrypto.subtle.wrapKey('raw', contentKey, publicKey, { name: 'RSA-OAEP' });
    return json(res, 200, {
      success: true,
      content_version: CONTENT_VERSION,
      wrapped_key: Buffer.from(wrapped).toString('base64'),
      user_id: decodeJwtSubject(token),
      starts_at: status.starts_at || null,
      ends_at: status.ends_at,
      server_now: new Date(serverNow).toISOString()
    });
  } catch (error) {
    if (String(error && error.message) === 'AUTH') return json(res, 401, { success: false, message: 'Session Nexora invalide ou expirée.' });
    console.error('Nexora content-key', error);
    return json(res, 500, { success: false, message: 'Vérification sécurisée momentanément indisponible.' });
  }
};
