/* V775 — « Échanger » : discussion avec l'IA de Nexora (programme scolaire + Nexora).
   Réservée aux abonnés. Serveur : /api/echanger (la clé IA reste côté serveur).
   Ouverture : tout élément [data-nx-echanger] ou window.NexoraEchanger.open(). */
(function () {
  'use strict';
  if (window.NexoraEchanger) return;

  var API = '/api/echanger';
  var CLE = 'nx.echanger.v775';
  var CLASSES = ['Maternelle', '1ère année', '2ème année', '3ème année', '4ème année', '5ème année', '6ème année', '7ème année', '8ème année', '9ème année', '10ème année (Brevet)', '11ème année', '12ème année', 'Terminale (BAC)'];
  var SUGGESTIONS = ['Explique-moi une leçon que je ne comprends pas', 'Comment bien préparer le BAC ?', 'Comment fonctionne l’abonnement Nexora ?'];

  var etatApp = { messages: [], classe: '', occupe: false, etat: null, pret: false };

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lire() { try { return JSON.parse(localStorage.getItem(CLE) || 'null'); } catch (e) { return null; } }
  function sauver() { try { localStorage.setItem(CLE, JSON.stringify({ messages: etatApp.messages.slice(-20), classe: etatApp.classe })); } catch (e) {} }

  /* Mise en forme légère : **gras**, listes, retours à la ligne. Tout est échappé d'abord. */
  function mettreEnForme(t) {
    var h = esc(t).replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    var lignes = h.split('\n'), out = [], liste = false;
    lignes.forEach(function (l) {
      var m = /^\s*(?:[-•]|\d+[.)])\s+(.*)$/.exec(l);
      if (m) { if (!liste) { out.push('<ul>'); liste = true; } out.push('<li>' + m[1] + '</li>'); }
      else { if (liste) { out.push('</ul>'); liste = false; } out.push(l.trim() ? '<p>' + l + '</p>' : ''); }
    });
    if (liste) out.push('</ul>');
    return out.join('');
  }

  /* ---------- session ---------- */
  function jetonLocal() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/^sb-.+-auth-token$/.test(k)) {
          var v = JSON.parse(localStorage.getItem(k) || 'null'), s = v && (v.currentSession || v);
          if (s && s.access_token) return s.access_token;
        }
      }
    } catch (e) {}
    return '';
  }
  function jeton() {
    try {
      var c = (window.NexoraApp && typeof window.NexoraApp.getSupabaseClient === 'function') ? window.NexoraApp.getSupabaseClient() : null;
      if (c && c.auth && typeof c.auth.getSession === 'function') {
        return c.auth.getSession().then(function (r) { var s = r && r.data && r.data.session; return (s && s.access_token) || jetonLocal(); }).catch(jetonLocal);
      }
    } catch (e) {}
    return Promise.resolve(jetonLocal());
  }
  function appel(methode, corps) {
    return jeton().then(function (t) {
      if (!t) return { status: 401, data: { success: false, code: 'connexion', message: 'Connecte-toi à Nexora pour utiliser Échanger.' } };
      return fetch(API, {
        method: methode, cache: 'no-store', credentials: 'same-origin',
        headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' },
        body: corps ? JSON.stringify(corps) : undefined
      }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { status: r.status, data: d || {} }; }); });
    }).catch(function () { return { status: 0, data: { success: false, code: 'reseau', message: 'Pas de connexion internet. Vérifie ton réseau et réessaie.' } }; });
  }

  /* ---------- interface ---------- */
  var racine = null;
  function css() {
    if (document.getElementById('nxEchStyleV775')) return;
    var s = document.createElement('style'); s.id = 'nxEchStyleV775';
    s.textContent =
      '#nxEchV775{position:fixed;inset:0;z-index:99990;display:flex;flex-direction:column;background:#EEF2F6;color:#16222E;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
      '#nxEchV775[hidden]{display:none!important}' +
      '#nxEchV775 .e-head{display:flex;align-items:center;gap:12px;padding:calc(12px + env(safe-area-inset-top)) 14px 12px;background:#16324F;color:#fff}' +
      '#nxEchV775 .e-ico{width:42px;height:42px;border-radius:12px;background:#C9862F;display:grid;place-items:center;flex:0 0 42px}' +
      '#nxEchV775 .e-ico svg{width:24px;height:24px;stroke:#16324F;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
      '#nxEchV775 .e-tit{flex:1;min-width:0}#nxEchV775 .e-tit b{display:block;font-size:19px;letter-spacing:-.01em}' +
      '#nxEchV775 .e-tit span{display:block;font-size:12px;color:rgba(255,255,255,.78);margin-top:2px}' +
      '#nxEchV775 .e-x{appearance:none;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);color:#fff;border-radius:10px;width:42px;height:42px;font-size:22px;cursor:pointer}' +
      '#nxEchV775 .e-corps{flex:1;min-height:0;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:10px;-webkit-overflow-scrolling:touch}' +
      '#nxEchV775 .e-msg{max-width:88%;padding:11px 13px;border-radius:14px;font-size:15px;line-height:1.55;word-wrap:break-word;overflow-wrap:anywhere}' +
      '#nxEchV775 .e-msg p{margin:0 0 7px}#nxEchV775 .e-msg p:last-child{margin:0}#nxEchV775 .e-msg ul{margin:4px 0 7px;padding-left:20px}' +
      '#nxEchV775 .e-moi{align-self:flex-end;background:#16324F;color:#fff;border-bottom-right-radius:4px}' +
      '#nxEchV775 .e-ia{align-self:flex-start;background:#fff;border:1px solid #D5DDE6;border-bottom-left-radius:4px}' +
      '#nxEchV775 .e-note{align-self:center;text-align:center;font-size:12.5px;color:#5B6776;max-width:92%}' +
      '#nxEchV775 .e-sugg{display:flex;flex-direction:column;gap:8px;margin-top:4px}' +
      '#nxEchV775 .e-sugg button{appearance:none;text-align:left;cursor:pointer;border:1px solid #BFCBD8;background:#fff;color:#16324F;border-radius:12px;padding:12px 13px;font:600 14.5px/1.3 inherit}' +
      '#nxEchV775 .e-vide{justify-content:center;padding-bottom:6vh}' +
      '#nxEchV775 .e-accueil{text-align:center;padding:0 6px 6px}' +
      '#nxEchV775 .e-logo{display:grid;place-items:center;width:56px;height:56px;margin:0 auto 14px;border-radius:16px;background:#C9862F}#nxEchV775 .e-logo svg{width:30px;height:30px;stroke:#16324F;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
      '#nxEchV775 .e-accueil h2{margin:0 0 8px;font:700 25px/1.2 Georgia,"Times New Roman",serif;letter-spacing:-.01em;color:#16324F}#nxEchV775 .e-accueil p{margin:0 auto;max-width:320px;font-size:15px;line-height:1.55;color:#4A5766}' +
      '#nxEchV775 .e-gate{align-self:stretch;background:#fff;border:2px solid #C9862F;border-radius:14px;padding:16px;text-align:center}' +
      '#nxEchV775 .e-gate p{margin:0 0 12px;font-size:15px;line-height:1.5}' +
      '#nxEchV775 .e-btn{appearance:none;border:0;cursor:pointer;border-radius:12px;background:#E8B368;color:#16222E;font:800 16px/1 inherit;padding:15px 20px;width:100%}' +
      '#nxEchV775 .e-pied{padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:#fff;border-top:1px solid #D5DDE6}' +
      '#nxEchV775 .e-classe{display:flex;align-items:center;gap:8px;margin:0 0 8px;font-size:12.5px;color:#5B6776}' +
      '#nxEchV775 .e-classe select{flex:1;min-width:0;border:1px solid #BFCBD8;border-radius:8px;padding:7px;background:#fff;color:#16222E;font:inherit}' +
      '#nxEchV775 .e-saisie{display:flex;gap:8px;align-items:flex-end}' +
      '#nxEchV775 textarea[disabled]{opacity:.7;cursor:not-allowed}#nxEchV775 .e-env[disabled]{opacity:.45}' +
      '@supports(height:100dvh){#nxEchV775{height:100dvh}}' +
      '#nxEchV775 textarea{flex:1;min-width:0;resize:none;border:1px solid #BFCBD8;border-radius:22px;padding:12px 16px;font:15px/1.4 inherit;max-height:120px;background:#fff;color:#16222E}' +
      '#nxEchV775 .e-env{appearance:none;border:0;cursor:pointer;border-radius:50%;background:#16324F;color:#fff;width:46px;height:46px;font-size:19px;flex:0 0 46px}' +
      '#nxEchV775 .e-env[disabled]{opacity:.45;cursor:default}' +
      '#nxEchV775 .e-reste{font-size:11.5px;color:#5B6776;text-align:right;margin-top:6px}' +
      '#nxEchV775 .e-point{display:inline-block;width:7px;height:7px;border-radius:50%;background:#7A8696;margin:0 2px;animation:nxEchP 1s infinite ease-in-out}' +
      '#nxEchV775 .e-point:nth-child(2){animation-delay:.15s}#nxEchV775 .e-point:nth-child(3){animation-delay:.3s}' +
      '@keyframes nxEchP{0%,80%,100%{opacity:.25}40%{opacity:1}}' +
      '@media (prefers-reduced-motion:reduce){#nxEchV775 .e-point{animation:none}}' +
      '@media (prefers-color-scheme:dark){#nxEchV775{background:#10151B;color:#E6ECF2}#nxEchV775 .e-ia,#nxEchV775 .e-accueil,#nxEchV775 .e-gate,#nxEchV775 .e-pied,#nxEchV775 .e-sugg button,#nxEchV775 textarea,#nxEchV775 .e-classe select{background:#1A212A;color:#E6ECF2;border-color:#2C3745}#nxEchV775 .e-accueil h2,#nxEchV775 .e-sugg button{color:#E6ECF2}#nxEchV775 .e-accueil p{color:#C2CCD6}#nxEchV775 .e-accueil{background:none;border:0}#nxEchV775 .e-note,#nxEchV775 .e-reste,#nxEchV775 .e-classe{color:#98A5B3}}';
    document.head.appendChild(s);
  }

  function construire() {
    if (racine) return racine;
    css();
    racine = document.createElement('div');
    racine.id = 'nxEchV775'; racine.hidden = true;
    racine.setAttribute('role', 'dialog'); racine.setAttribute('aria-modal', 'true'); racine.setAttribute('aria-label', 'Échanger');
    racine.innerHTML =
      '<div class="e-head"><span class="e-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg></span>' +
      '<div class="e-tit"><b>Échanger</b><span>Pose tes questions : cours et Nexora</span></div>' +
      '<button class="e-x" type="button" aria-label="Fermer" data-e-fermer>×</button></div>' +
      '<div class="e-corps" data-e-corps aria-live="polite"></div>' +
      '<div class="e-pied" data-e-pied><label class="e-classe"><span>Ta classe</span><select data-e-classe><option value="">Facultatif</option>' +
      CLASSES.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select></label>' +
      '<div class="e-saisie"><textarea rows="1" maxlength="1500" placeholder="Pose ta question à Échanger…" aria-label="Ta question" data-e-texte></textarea>' +
      '<button class="e-env" type="button" aria-label="Envoyer" data-e-envoyer>➤</button></div><div class="e-reste" data-e-reste></div></div>';
    document.body.appendChild(racine);
    racine.querySelector('[data-e-fermer]').addEventListener('click', fermer);
    racine.querySelector('[data-e-envoyer]').addEventListener('click', envoyer);
    var ta = racine.querySelector('[data-e-texte]');
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); } });
    ta.addEventListener('input', function () { ta.style.height = 'auto'; ta.style.height = Math.min(120, ta.scrollHeight) + 'px'; });
    racine.querySelector('[data-e-classe]').addEventListener('change', function (e) { etatApp.classe = e.target.value; sauver(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && racine && !racine.hidden) fermer(); });
    return racine;
  }

  function corps() { return racine.querySelector('[data-e-corps]'); }
  function defiler() { var c = corps(); c.scrollTop = c.scrollHeight; }
  function bulle(role, html) { var d = document.createElement('div'); d.className = 'e-msg ' + (role === 'user' ? 'e-moi' : 'e-ia'); d.innerHTML = html; corps().appendChild(d); return d; }
  function note(t) { var d = document.createElement('div'); d.className = 'e-note'; d.textContent = t; corps().appendChild(d); }

  function majReste() {
    var e = etatApp.etat, r = racine.querySelector('[data-e-reste]');
    r.textContent = e && typeof e.restant_jour === 'number' ? e.restant_jour + ' message' + (e.restant_jour > 1 ? 's' : '') + ' restant' + (e.restant_jour > 1 ? 's' : '') + ' aujourd’hui' : '';
  }
  function pied(actif, raison) {
    var ta = racine.querySelector('[data-e-texte]'), bt = racine.querySelector('[data-e-envoyer]');
    etatApp.bloque = !actif;
    ta.disabled = !actif; bt.disabled = !actif;
    ta.placeholder = actif ? 'Pose ta question à Échanger…' : (raison || 'Écriture indisponible pour le moment');
  }

  function porte(texte, bouton, action) {
    pied(false, 'Connecte-toi ou abonne-toi pour écrire');
    var sg = corps().querySelector('.e-sugg'); if (sg) sg.remove();
    var g = document.createElement('div'); g.className = 'e-gate';
    g.innerHTML = '<p>' + esc(texte) + '</p><button class="e-btn" type="button">' + esc(bouton) + '</button>';
    g.querySelector('button').addEventListener('click', function () { fermer(); setTimeout(action, 150); });
    corps().appendChild(g); defiler();
  }
  function ouvrirConnexion() {
    var b = document.querySelector('[data-action="open-account"]');
    if (b) b.click(); else if (window.NexoraApp && typeof window.NexoraApp.go === 'function') window.NexoraApp.go('student-work-feed');
  }
  function ouvrirAbonnement() {
    var b = document.querySelector('[data-nx-subscribe-home]');
    if (b) { b.click(); return; }
    if (window.NexoraApp && typeof window.NexoraApp.go === 'function') window.NexoraApp.go('student-work-feed');
  }

  function afficherHistorique() {
    corps().innerHTML = ''; corps().classList.remove('e-vide');
    if (!etatApp.messages.length) {
      corps().classList.add('e-vide');
      var a = document.createElement('div'); a.className = 'e-accueil';
      a.innerHTML = '<span class="e-logo" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg></span><h2>Il y a une leçon que tu n’as pas comprise ? Je peux t’expliquer.</h2><p>Cours, devoirs, Brevet, BAC, Nexora : écris ta question dans la zone en bas.</p>';
      corps().appendChild(a);
      var sg = document.createElement('div'); sg.className = 'e-sugg';
      SUGGESTIONS.forEach(function (q) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = q;
        b.addEventListener('click', function () { racine.querySelector('[data-e-texte]').value = q; envoyer(); });
        sg.appendChild(b);
      });
      corps().appendChild(sg);
    } else {
      etatApp.messages.forEach(function (m) { bulle(m.role, m.role === 'user' ? esc(m.texte).replace(/\n/g, '<br>') : mettreEnForme(m.texte)); });
    }
    defiler();
  }

  function envoyer() {
    if (etatApp.occupe || !etatApp.pret) return;
    var ta = racine.querySelector('[data-e-texte]');
    var q = ta.value.replace(/\s+/g, ' ').trim();
    if (!q) return;
    if (!etatApp.messages.length) { corps().innerHTML = ''; corps().classList.remove('e-vide'); }
    etatApp.messages.push({ role: 'user', texte: q });
    bulle('user', esc(q));
    ta.value = ''; ta.style.height = 'auto';
    etatApp.occupe = true; racine.querySelector('[data-e-envoyer]').disabled = true;
    var att = bulle('assistant', '<span class="e-point"></span><span class="e-point"></span><span class="e-point"></span>');
    defiler();
    appel('POST', { messages: etatApp.messages.slice(-10), classe: etatApp.classe }).then(function (r) {
      var d = r.data || {};
      att.remove();
      if (r.status === 200 && d.success && d.reponse) {
        etatApp.messages.push({ role: 'assistant', texte: d.reponse });
        bulle('assistant', mettreEnForme(d.reponse));
        if (d.etat) etatApp.etat = d.etat;
        sauver(); majReste();
      } else {
        etatApp.messages.pop(); sauver();
        if (d.code === 'abonnement') { porte(d.message || 'Échanger est réservé aux abonnés Nexora.', 'S’abonner', ouvrirAbonnement); }
        else if (d.code === 'connexion') { porte(d.message || 'Connecte-toi pour utiliser Échanger.', 'Me connecter', ouvrirConnexion); }
        else { note(d.message || 'Petit souci technique. Réessaie dans un instant.'); ta.value = q; }
      }
    }).then(function () { etatApp.occupe = false; racine.querySelector('[data-e-envoyer]').disabled = !!etatApp.bloque; defiler(); });
  }

  function ouvrir() {
    construire();
    var sauve = lire();
    if (sauve && Array.isArray(sauve.messages) && !etatApp.messages.length) { etatApp.messages = sauve.messages.filter(function (m) { return m && m.texte && (m.role === 'user' || m.role === 'assistant'); }); etatApp.classe = sauve.classe || ''; }
    racine.querySelector('[data-e-classe]').value = etatApp.classe;
    racine.hidden = false; document.documentElement.style.overflow = 'hidden';
    pied(false, 'Un instant…'); etatApp.pret = false; afficherHistorique(); majReste();
    appel('GET').then(function (r) {
      var d = r.data || {};
      if (r.status === 401 || d.code === 'connexion') return porte('Connecte-toi à ton compte Nexora pour poser tes questions.', 'Me connecter', ouvrirConnexion);
      if (r.status === 200 && d.success) {
        etatApp.etat = d.etat;
        if (d.etat && d.etat.abonne === false) return porte('Échanger est réservé aux abonnés Nexora. Abonne-toi pour poser toutes tes questions sur les cours.', 'S’abonner', ouvrirAbonnement);
        if (d.disponible === false) { pied(false, 'Échanger arrive très bientôt'); return note('Échanger arrive très bientôt. Revenez dans quelques heures !'); }
        etatApp.pret = true; pied(true); majReste(); racine.querySelector('[data-e-texte]').focus();
        return;
      }
      pied(false, 'Échanger indisponible pour le moment'); note(d.message || 'Échanger n’est pas disponible pour le moment. Réessaie dans un instant.');
    });
  }
  function fermer() { if (racine) racine.hidden = true; document.documentElement.style.overflow = ''; }

  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-nx-echanger]') : null;
    if (!b) return;
    e.preventDefault(); e.stopPropagation(); ouvrir();
  }, true);

  window.NexoraEchanger = { open: ouvrir, close: fermer };
})();
