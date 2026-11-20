/* V740 — Cadeaux de la semaine : carte d'accueil + classement (1er = livre IA, 2e = formation). */
(function () {
  'use strict';
  if (window.__nxCadeauxV740) return;
  window.__nxCadeauxV740 = true;
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function client() {
    try {
      if (window.NexoraApp && typeof window.NexoraApp.ensureSupabaseClientReady === 'function') return window.NexoraApp.ensureSupabaseClientReady();
      return Promise.resolve(window.NexoraApp && window.NexoraApp.getSupabaseClient ? window.NexoraApp.getSupabaseClient() : null);
    } catch (_e) { return Promise.resolve(null); }
  }
  function rpc(n, a) {
    return client().then(function (sb) {
      if (!sb) throw new Error('CLIENT_ABSENT');
      return sb.rpc(n, a || {}).then(function (r) { if (r.error) throw r.error; return r.data; });
    });
  }
  function styles() {
    if (document.getElementById('nxcStyle')) return;
    var s = document.createElement('style'); s.id = 'nxcStyle';
    s.textContent = '.nxc{margin:0 0 14px;padding:14px 15px;border-radius:12px;background:#2E3630;color:#F6F4EE;border-left:4px solid #C9862F}.nxc h3{margin:0 0 4px;font-size:16px;font-weight:800}.nxc p{margin:0 0 10px;font-size:13.5px;opacity:.9}.nxc-g{display:flex;gap:8px;margin-bottom:10px}.nxc-g span{flex:1;background:rgba(246,244,238,.1);border-radius:10px;padding:8px 10px;font-size:12.5px}.nxc-g b{display:block;font-size:12px;color:#E8B66A;margin-bottom:2px}.nxc ol{margin:0;padding:0;list-style:none;font-size:14px}.nxc li{display:flex;justify-content:space-between;padding:5px 0;border-top:1px solid rgba(246,244,238,.15)}.nxc li i{font-style:normal;opacity:.85}.nxc small{display:block;margin-top:8px;opacity:.7;font-size:12px}';
    document.head.appendChild(s);
  }
  function rendre(box, cl, cat) {
    var liv = (cat || []).filter(function (c) { return c.type === 'livre'; }).length;
    var frm = (cat || []).filter(function (c) { return c.type === 'formation'; }).length;
    var lignes = (cl || []).slice(0, 5).map(function (x) {
      return '<li><span>' + (x.rang === 1 ? '🥇' : x.rang === 2 ? '🥈' : x.rang + '.') + ' ' + esc(x.prenom) + '</span><i>' + esc(x.score) + ' pts · ' + esc(x.duree_s) + ' s</i></li>';
    }).join('');
    box.innerHTML = '<h3>🎁 Gagne un livre ou une formation</h3>' +
      '<p>Chaque semaine, les deux meilleurs scores du défi KDO gagnent un cadeau.</p>' +
      '<div class="nxc-g"><span><b>🥇 1er</b>Un livre IA<br>(' + liv + ' au choix)</span><span><b>🥈 2e</b>Une formation Pro<br>(' + frm + ' au choix)</span></div>' +
      (lignes ? '<ol>' + lignes + '</ol>' : '<p style="margin:0">Aucun score cette semaine : sois le premier !</p>') +
      '<small>Classement de la semaine en cours (lundi à dimanche). À score égal, le plus rapide gagne.</small>';
  }
  var cache = null, t0 = 0;
  function poser() {
    var accueil = document.getElementById('screen-student-work-feed');
    if (!accueil || accueil.querySelector('.nxc')) return;
    styles();
    var box = document.createElement('div'); box.className = 'nxc';
    var ref = accueil.querySelector('.nxl-entree');
    if (ref && ref.parentNode) ref.parentNode.insertBefore(box, ref.nextSibling); else accueil.insertBefore(box, accueil.firstChild);
    if (cache && Date.now() - t0 < 120000) { rendre(box, cache[0], cache[1]); return; }
    Promise.all([rpc('nx_cadeaux_classement_semaine', {}), rpc('nx_cadeaux_catalogue_public', {})]).then(function (r) {
      cache = r; t0 = Date.now(); rendre(box, r[0], r[1]);
    }).catch(function () { box.remove(); });
  }
  document.addEventListener('nx-screen-change', function () { setTimeout(poser, 400); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', poser); else poser();
  setInterval(poser, 5000);
})();
