
/* V710 (V709 + demande automatique) — Rappel quotidien de 11 h : bandeau dans Nexora + notifications sur le telephone. */
(function () {
  'use strict';
  if (window.__nxRappelV709) return;
  window.__nxRappelV709 = true;

  var HEURE = 11;
  function jourCle() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function lire(k) { try { return localStorage.getItem(k); } catch (_e) { return null; } }
  function ecrire(k, v) { try { localStorage.setItem(k, v); } catch (_e) {} }

  function client() {
    try {
      if (window.NexoraApp && typeof window.NexoraApp.ensureSupabaseClientReady === 'function')
        return window.NexoraApp.ensureSupabaseClientReady();
      return Promise.resolve(window.NexoraApp && window.NexoraApp.getSupabaseClient
        ? window.NexoraApp.getSupabaseClient() : null);
    } catch (_e) { return Promise.resolve(null); }
  }
  function attendreClient(essais) {
    return client().then(function (c) {
      if (c) return c;
      if (essais <= 0) return null;
      return new Promise(function (ok) { setTimeout(ok, 1500); }).then(function () { return attendreClient(essais - 1); });
    });
  }

  function pushPossible() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }
  function b64versBuffer(b64) {
    var pad = '='.repeat((4 - b64.length % 4) % 4);
    var s = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
    var raw = atob(s), out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }
  function versB64(buf) {
    var b = new Uint8Array(buf), s = '';
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function enregistrer(sb, sub) {
    var j = sub.toJSON ? sub.toJSON() : null;
    var keys = (j && j.keys) || {};
    var p256 = keys.p256dh || versB64(sub.getKey('p256dh'));
    var auth = keys.auth || versB64(sub.getKey('auth'));
    return sb.rpc('nexora_push_register', {
      p_endpoint: sub.endpoint, p_p256dh: p256, p_auth: auth, p_ua: navigator.userAgent
    });
  }

  function activerPush(sb) {
    if (!pushPossible()) return Promise.resolve('indisponible');
    return Notification.requestPermission().then(function (perm) {
      if (perm !== 'granted') return perm;
      return sb.rpc('nexora_push_public_key').then(function (r) {
        var cle = r && r.data;
        if (!cle) throw new Error('cle');
        return navigator.serviceWorker.ready.then(function (reg) {
          return reg.pushManager.getSubscription().then(function (existante) {
            return existante || reg.pushManager.subscribe({
              userVisibleOnly: true, applicationServerKey: b64versBuffer(cle)
            });
          });
        });
      }).then(function (sub) {
        return enregistrer(sb, sub).then(function () { ecrire('nx_rappel_push_v709', jourCle()); return 'granted'; });
      });
    });
  }

  /* Deja autorise : on rafraichit l'inscription une fois par jour (lie aussi le compte connecte). */
  function rafraichirPush(sb) {
    if (!pushPossible() || Notification.permission !== 'granted') return;
    if (lire('nx_rappel_push_v709') === jourCle()) return;
    navigator.serviceWorker.ready.then(function (reg) {
      return reg.pushManager.getSubscription();
    }).then(function (sub) {
      if (!sub) return;
      return enregistrer(sb, sub).then(function () { ecrire('nx_rappel_push_v709', jourCle()); });
    }).catch(function () {});
  }

  /* V731 : carte d'invitation aux alertes (matin 7 h et soir 18 h), avec le logo, au bon moment. */
  var CLE_CARTE = 'nx_alertes_carte_v731';
  function etatCarte() {
    try { return JSON.parse(lire(CLE_CARTE) || '{}') || {}; } catch (_e) { return {}; }
  }
  function noterCarte(o) { ecrire(CLE_CARTE, JSON.stringify(o)); }

  function styles() {
    if (document.getElementById('nxAlertesStyleV731')) return;
    var s = document.createElement('style');
    s.id = 'nxAlertesStyleV731';
    s.textContent =
      '#nxAlertesV731{position:fixed;left:10px;right:10px;top:calc(env(safe-area-inset-top,0px) + 10px);z-index:2147482000;max-width:480px;margin:0 auto;' +
      'background:#fff;color:#16324F;border-radius:18px;padding:16px;box-shadow:0 14px 40px rgba(8,18,32,.35);border:1px solid rgba(22,50,79,.12);' +
      'font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;animation:nxAlV731 .35s cubic-bezier(.2,.8,.2,1) both}' +
      '@keyframes nxAlV731{from{opacity:0;transform:translateY(-18px)}to{opacity:1;transform:none}}' +
      '@media (prefers-reduced-motion:reduce){#nxAlertesV731{animation:none}}' +
      '#nxAlertesV731 .nx-al-top{display:flex;gap:12px;align-items:center}' +
      '#nxAlertesV731 img{width:52px;height:52px;border-radius:12px;flex:none}' +
      '#nxAlertesV731 b{display:block;font-size:17px;line-height:1.2}' +
      '#nxAlertesV731 p{margin:10px 0 0;color:#3D5168}' +
      '#nxAlertesV731 .nx-al-btns{display:flex;gap:8px;margin-top:14px}' +
      '#nxAlertesV731 button{font:inherit;font-weight:800;border-radius:12px;padding:12px 14px;min-height:46px;cursor:pointer;border:0;flex:1}' +
      '#nxAlertesV731 .nx-al-go{background:linear-gradient(135deg,#16324F,#1E5FA9);color:#fff;flex:1.6}' +
      '#nxAlertesV731 .nx-al-no{background:#EEF2F7;color:#16324F}' +
      '#nxAlertesV731 .nx-al-ok{margin:12px 0 0;font-weight:700;color:#1b7a46}';
    document.head.appendChild(s);
  }

  function fermerCarte() {
    var el = document.getElementById('nxAlertesV731');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function afficherCarte(sb) {
    if (document.getElementById('nxAlertesV731')) return;
    styles();
    var box = document.createElement('div');
    box.id = 'nxAlertesV731';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Activer les rappels Nexora');
    var top = document.createElement('div'); top.className = 'nx-al-top';
    var img = document.createElement('img'); img.src = '/assets/icons/nexora-192.png'; img.alt = 'Nexora';
    var t = document.createElement('b'); t.textContent = 'Reçois ta leçon du jour';
    top.appendChild(img); top.appendChild(t);
    var p = document.createElement('p');
    p.textContent = 'Un petit rappel le matin et le soir pour ne pas perdre le rythme. Tu peux l’arrêter quand tu veux.';
    var row = document.createElement('div'); row.className = 'nx-al-btns';
    var go = document.createElement('button'); go.type = 'button'; go.className = 'nx-al-go'; go.textContent = 'Activer les rappels';
    var no = document.createElement('button'); no.type = 'button'; no.className = 'nx-al-no'; no.textContent = 'Plus tard';
    no.onclick = function () {
      var e = etatCarte(); e.refus = (e.refus || 0) + 1; e.dernier = Date.now(); noterCarte(e);
      fermerCarte();
    };
    go.onclick = function () {
      go.disabled = true; go.textContent = 'Un instant…';
      activerPush(sb).then(function (r) {
        var e = etatCarte(); e.dernier = Date.now(); if (r === 'granted') e.fait = true; else e.refus = (e.refus || 0) + 1; noterCarte(e);
        var m = document.createElement('div'); m.className = 'nx-al-ok';
        m.textContent = r === 'granted' ? '✓ Activé. À demain matin !' :
          'Les notifications sont bloquées. Tu pourras les activer dans les réglages du navigateur.';
        if (r !== 'granted') m.style.color = '#8a5a00';
        box.replaceChild(m, row);
        setTimeout(fermerCarte, r === 'granted' ? 2200 : 4500);
      }).catch(function () { go.disabled = false; go.textContent = 'Activer les rappels'; });
    };
    row.appendChild(go); row.appendChild(no);
    box.appendChild(top); box.appendChild(p); box.appendChild(row);
    document.body.appendChild(box);
  }

  function ecranLibre() {
    /* pas de carte par-dessus l'inscription, le code de récupération ou la fenêtre d'installation (la barre d'installation du bas reste visible) */
    var m = document.getElementById('accountModal');
    if (m && m.classList.contains('open')) return false;
    if (document.getElementById('nxRcOkV716') && document.getElementById('nxRcOkV716').offsetParent) return false;
    if (document.querySelector('.nx-isheet-v721.on, .nx-isheet-v721.open')) return false;
    return !document.hidden;
  }

  function carteEnAttente(sb) {
    if (!pushPossible() || Notification.permission !== 'default') return;
    var e = etatCarte();
    if (e.fait || (e.refus || 0) >= 3) return;
    if (e.dernier && (Date.now() - e.dernier) < 3 * 24 * 3600 * 1000) return;
    var essais = 0;
    var iv = setInterval(function () {
      essais++;
      if (essais > 60) { clearInterval(iv); return; }
      if (!ecranLibre()) return;
      sb.auth.getSession().then(function (r) {
        var u = r && r.data && r.data.session && r.data.session.user;
        if (!u || u.is_anonymous) return;
        if (!ecranLibre() || document.getElementById('nxAlertesV731')) return;
        clearInterval(iv);
        afficherCarte(sb);
      }).catch(function () {});
    }, 6000);
  }

  function demarrer() {
    attendreClient(12).then(function (sb) {
      if (!sb) return;
      rafraichirPush(sb);
      setTimeout(function () { carteEnAttente(sb); }, 20000);
    }).catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(demarrer, 2500); });
  else setTimeout(demarrer, 2500);
})();
