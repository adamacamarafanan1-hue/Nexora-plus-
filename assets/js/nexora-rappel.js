
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

  /* V710 : la fenetre d'autorisation s'affiche toute seule (Android/ordinateur). iPhone : bouton du bandeau. */
  function demandeAuto(sb) {
    if (!pushPossible() || Notification.permission !== 'default') return;
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return;
    var dernier = parseInt(lire('nx_rappel_auto_v710') || '0', 10);
    if (dernier && (Date.now() - dernier) < 3 * 24 * 3600 * 1000) return;
    ecrire('nx_rappel_auto_v710', String(Date.now()));
    activerPush(sb).catch(function () {});
  }

  function styles() {
    if (document.getElementById('nxRappelStyleV709')) return;
    var s = document.createElement('style');
    s.id = 'nxRappelStyleV709';
    s.textContent =
      '#nxRappelV709{position:fixed;left:8px;right:8px;top:8px;top:calc(env(safe-area-inset-top,0px) + 8px);z-index:2147483000;' +
      'background:#16324F;color:#fff;border-radius:12px;padding:12px 14px;box-shadow:0 6px 22px rgba(0,0,0,.28);' +
      'font:14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto}' +
      '#nxRappelV709 b{display:block;font-size:15px;margin:0 26px 2px 0}' +
      '#nxRappelV709 p{margin:0 0 10px;color:#E3E8EE}' +
      '#nxRappelV709 .nx-r-btns{display:flex;flex-wrap:wrap;gap:8px}' +
      '#nxRappelV709 button{font:inherit;font-weight:700;border-radius:9px;padding:9px 13px;min-height:40px;cursor:pointer;border:0}' +
      '#nxRappelV709 .nx-r-go{background:#fff;color:#16324F}' +
      '#nxRappelV709 .nx-r-push{background:#C9A24B;color:#16324F}' +
      '#nxRappelV709 .nx-r-x{position:absolute;top:6px;right:6px;background:transparent;color:#fff;font-size:20px;min-height:34px;padding:2px 10px}' +
      '#nxRappelV709 .nx-r-ok{margin:8px 0 0;font-size:13px;color:#BFE6C8}';
    document.head.appendChild(s);
  }

  function fermer() {
    var el = document.getElementById('nxRappelV709');
    if (el && el.parentNode) el.parentNode.removeChild(el);
    ecrire('nx_rappel_ferme_v709', jourCle());
  }

  function afficher(sb, msg) {
    if (document.getElementById('nxRappelV709')) return;
    styles();
    var box = document.createElement('div');
    box.id = 'nxRappelV709';
    box.setAttribute('role', 'status');
    var t = document.createElement('b'); t.textContent = msg.title || 'Nexora';
    var p = document.createElement('p'); p.textContent = msg.body || '';
    var x = document.createElement('button'); x.className = 'nx-r-x'; x.type = 'button';
    x.setAttribute('aria-label', 'Fermer'); x.textContent = '×'; x.onclick = fermer;
    var row = document.createElement('div'); row.className = 'nx-r-btns';
    var go = document.createElement('button'); go.type = 'button'; go.className = 'nx-r-go';
    go.textContent = 'Je révise'; go.onclick = fermer;
    row.appendChild(go);
    if (pushPossible() && Notification.permission === 'default') {
      var pu = document.createElement('button'); pu.type = 'button'; pu.className = 'nx-r-push';
      pu.textContent = 'Recevoir ce rappel chaque jour';
      pu.onclick = function () {
        pu.disabled = true;
        activerPush(sb).then(function (r) {
          var m = document.createElement('div'); m.className = 'nx-r-ok';
          m.textContent = r === 'granted' ? 'C’est activé : rendez-vous demain à 11 h.' :
            'Notifications non autorisées. Vous pouvez les activer dans les réglages du navigateur.';
          if (pu.parentNode) pu.parentNode.removeChild(pu);
          box.appendChild(m);
        }).catch(function () { pu.disabled = false; });
      };
      row.appendChild(pu);
    }
    box.appendChild(x); box.appendChild(t); box.appendChild(p); box.appendChild(row);
    document.body.appendChild(box);
  }

  function demarrer() {
    attendreClient(12).then(function (sb) {
      if (!sb) return;
      rafraichirPush(sb);
      demandeAuto(sb);
      if (new Date().getHours() < HEURE) return;
      if (lire('nx_rappel_ferme_v709') === jourCle()) return;
      sb.rpc('nexora_rappel_du_jour').then(function (r) {
        if (r && r.data && r.data.title) afficher(sb, r.data);
      }).catch(function () {});
    }).catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(demarrer, 2500); });
  else setTimeout(demarrer, 2500);
})();
