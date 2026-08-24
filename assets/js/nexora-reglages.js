/* V543.3 — Mes réglages, en tete de l'accueil. */
(function () {
  'use strict';
  if (window.__nxReglagesV543) return;
  window.__nxReglagesV543 = true;

  var WHATSAPP = '';

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function client() {
    try {
      if (window.NexoraApp && typeof window.NexoraApp.ensureSupabaseClientReady === 'function')
        return window.NexoraApp.ensureSupabaseClientReady();
      return Promise.resolve(window.NexoraApp && window.NexoraApp.getSupabaseClient
        ? window.NexoraApp.getSupabaseClient() : null);
    } catch (_e) { return Promise.resolve(null); }
  }

  function dateLisible(valeur) {
    try {
      var d = new Date(valeur);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (_e) { return ''; }
  }

  function styles() {
    if (document.getElementById('nxReglagesStyleV543')) return;
    var s = document.createElement('style');
    s.id = 'nxReglagesStyleV543';
    s.textContent =
      '.nx-reg-ouvrir-v543{display:flex;align-items:center;gap:9px;width:100%;min-height:52px;margin:0 0 14px;' +
      'padding:0 15px;border:1px solid #C6CBD2;border-radius:10px;background:#fff;' +
      'color:#16324F;font:inherit;font-size:15px;font-weight:800;text-align:left;cursor:pointer}' +
      '.nx-reg-ouvrir-v543 span{margin-left:auto;font-weight:400;font-size:12.5px;color:#5F656C}' +
      '.nx-reg-v543{position:fixed;inset:0;z-index:2147481400;overflow-y:auto;background:#EDEFF2;' +
      'color:#21252B;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
      '.nx-reg-v543[hidden]{display:none}' +
      '.nx-reg-tete-v543{position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;gap:12px;' +
      'padding:16px 16px calc(16px + env(safe-area-inset-top,0px));background:#16324F;color:#EEF2F6}' +
      '.nx-reg-tete-v543 h2{margin:0;font-size:19px;font-weight:800}' +
      '.nx-reg-tete-v543 button{width:42px;height:42px;border:0;border-radius:8px;background:rgba(238,242,246,.16);' +
      'color:#fff;font:inherit;font-size:17px;cursor:pointer}' +
      '.nx-reg-corps-v543{max-width:60ch;margin:0 auto;padding:18px 16px calc(30px + env(safe-area-inset-bottom,0px))}' +
      '.nx-reg-bloc-v543{margin:0 0 14px;padding:15px 16px;border:1px solid #C6CBD2;border-radius:10px;background:#fff}' +
      '.nx-reg-bloc-v543 h3{margin:0 0 11px;color:#16324F;font-size:11px;font-weight:800;' +
      'letter-spacing:.15em;text-transform:uppercase}' +
      '.nx-reg-ligne-v543{display:flex;justify-content:space-between;gap:12px;padding:7px 0;font-size:14.5px;line-height:1.5}' +
      '.nx-reg-ligne-v543 b{flex:0 0 auto;color:#5F656C;font-weight:600}' +
      '.nx-reg-ligne-v543 span{text-align:right;font-weight:700;word-break:break-word}' +
      '.nx-reg-action-v543{display:block;width:100%;min-height:50px;margin:9px 0 0;padding:0 15px;' +
      'border:1px solid #C6CBD2;border-radius:9px;background:#EDEFF2;' +
      'color:#16324F;font:inherit;font-size:14.5px;font-weight:800;text-align:left;cursor:pointer}' +
      '.nx-reg-action-v543.principal{background:#16324F;border-color:#16324F;color:#EEF2F6}' +
      '.nx-reg-note-v543{margin:7px 0 0;color:#5F656C;font-size:12.5px;line-height:1.55}' +
      '.nx-reg-etat-v543{margin:9px 0 0;font-size:13.5px;font-weight:700}';
    document.head.appendChild(s);
  }

  function panneau() {
    var p = document.getElementById('nxReglagesV543');
    if (p) return p;
    styles();
    p = document.createElement('section');
    p.id = 'nxReglagesV543';
    p.className = 'nx-reg-v543';
    p.setAttribute('role', 'dialog');
    p.hidden = true;
    p.innerHTML =
      '<header class="nx-reg-tete-v543"><h2>Mes réglages</h2>' +
      '<button type="button" data-reg-fermer aria-label="Fermer">✕</button></header>' +
      '<div class="nx-reg-corps-v543" data-reg-corps></div>';
    document.body.appendChild(p);

    p.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('[data-reg-fermer]')) { fermer(); return; }
      var b = e.target && e.target.closest ? e.target.closest('[data-reg-action]') : null;
      if (!b) return;
      var quoi = b.getAttribute('data-reg-action');
      if (quoi === 'motdepasse') changerMotDePasse(b);
      if (quoi === 'vider') viderEtRecharger(b);
    });
    return p;
  }

  function fermer() {
    var p = document.getElementById('nxReglagesV543');
    if (p) p.hidden = true;
    document.body.style.overflow = '';
  }

  async function remplir() {
    var corps = panneau().querySelector('[data-reg-corps]');
    var nom = '', adresse = '';
    try {
      var c = await client();
      var session = c && (await c.auth.getSession()).data.session;
      var u = session && session.user;
      if (u) {
        var meta = u.user_metadata || {};
        nom = meta.full_name || meta.name || '';
        adresse = u.email || '';
      }
    } catch (_e) {}

    var abo = null;
    try {
      if (typeof window.nxOfflineSubscriptionStatus === 'function') abo = window.nxOfflineSubscriptionStatus();
    } catch (_e) {}

    var fin = abo && abo.ends_at ? dateLisible(abo.ends_at) : '';
    var actif = !!(abo && abo.allowed);

    corps.innerHTML =
      '<section class="nx-reg-bloc-v543"><h3>Mon compte</h3>' +
        '<div class="nx-reg-ligne-v543"><b>Nom</b><span>' + esc(nom || 'Non renseigné') + '</span></div>' +
        '<div class="nx-reg-ligne-v543"><b>Adresse</b><span>' + esc(adresse || '—') + '</span></div>' +
        '<button type="button" class="nx-reg-action-v543" data-reg-action="motdepasse">Changer mon mot de passe</button>' +
        '<p class="nx-reg-note-v543">Un lien te sera envoyé à ton adresse.</p>' +
        '<p class="nx-reg-etat-v543" data-reg-etat-motdepasse></p>' +
      '</section>' +
      '<section class="nx-reg-bloc-v543"><h3>Mon abonnement</h3>' +
        '<div class="nx-reg-ligne-v543"><b>État</b><span>' + (actif ? 'Actif' : 'Aucun abonnement actif') + '</span></div>' +
        (fin ? '<div class="nx-reg-ligne-v543"><b>Jusqu\u2019au</b><span>' + esc(fin) + '</span></div>' : '') +
        '<p class="nx-reg-note-v543">' +
        (actif ? 'Tes cours restent ouverts jusqu\u2019à cette date.'
               : 'Pour ouvrir les cours, choisis une formule depuis l\u2019Académie.') + '</p>' +
      '</section>' +
      '<section class="nx-reg-bloc-v543"><h3>Un problème ?</h3>' +
        '<button type="button" class="nx-reg-action-v543 principal" data-reg-action="vider">Vider et recharger Nexora</button>' +
        '<p class="nx-reg-note-v543">À faire si une page reste bloquée ou si tu ne vois pas les nouveautés. ' +
        'Tes cours et ton abonnement ne sont pas effacés.</p>' +
        '<p class="nx-reg-etat-v543" data-reg-etat-vider></p>' +
        (WHATSAPP ? '<a class="nx-reg-action-v543" style="text-decoration:none;line-height:50px" ' +
          'href="https://wa.me/' + esc(WHATSAPP) + '" target="_blank" rel="noopener">Écrire au service Nexora</a>' : '') +
      '</section>';
  }

  async function changerMotDePasse(bouton) {
    var etat = document.querySelector('[data-reg-etat-motdepasse]');
    bouton.disabled = true;
    try {
      var c = await client();
      var session = c && (await c.auth.getSession()).data.session;
      var adresse = session && session.user && session.user.email;
      if (!c || !adresse) throw new Error('Adresse introuvable.');
      var r = await c.auth.resetPasswordForEmail(adresse, { redirectTo: location.origin });
      if (r && r.error) throw r.error;
      if (etat) etat.textContent = 'Lien envoyé à ' + adresse + '.';
    } catch (err) {
      if (etat) etat.textContent = 'Envoi impossible : ' + String(err && err.message || err);
    }
    bouton.disabled = false;
  }

  async function viderEtRecharger(bouton) {
    var etat = document.querySelector('[data-reg-etat-vider]');
    bouton.disabled = true;
    if (etat) etat.textContent = 'Nettoyage en cours…';
    try {
      if (window.caches && caches.keys) {
        var noms = await caches.keys();
        for (var i = 0; i < noms.length; i++) { try { await caches.delete(noms[i]); } catch (_e) {} }
      }
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
        var regs = await navigator.serviceWorker.getRegistrations();
        for (var j = 0; j < regs.length; j++) { try { await regs[j].unregister(); } catch (_e) {} }
      }
    } catch (_e) {}
    if (etat) etat.textContent = 'Rechargement…';
    setTimeout(function () { location.reload(); }, 600);
  }

  function ouvrir() {
    var p = panneau();
    p.hidden = false;
    document.body.style.overflow = 'hidden';
    p.scrollTop = 0;
    remplir();
  }

  function poserBouton() {
    try {
      var accueil = document.getElementById('screen-student-work-feed');
      if (!accueil) return;
      if (document.getElementById('nxReglagesBoutonV543')) return;
      styles();
      var b = document.createElement('button');
      b.id = 'nxReglagesBoutonV543';
      b.type = 'button';
      b.className = 'nx-reg-ouvrir-v543';
      b.innerHTML = '⚙️ Mes réglages <span>compte, abonnement, aide</span>';
      b.addEventListener('click', ouvrir);
      accueil.insertBefore(b, accueil.firstChild);
    } catch (_e) {}
  }

  document.addEventListener('nx-screen-change', function () { setTimeout(poserBouton, 300); });
  window.addEventListener('nexora:remote-ready', function () { setTimeout(poserBouton, 600); });
  setTimeout(poserBouton, 1500);
  setInterval(poserBouton, 4000);
})();

/* ===== V552 — invitation à installer Nexora =====
   Le bloc nx-install-v468 existe déjà dans index.html, mais il est placé
   en bas de l'écran d'entrée et reste masqué : presque personne ne le voit.
   Ce module propose l'installation dès l'ouverture, avec une carte visible,
   sans toucher à index.html (1,86 Mo, indéployable depuis un téléphone).

   Règles de politesse appliquées :
   - jamais si l'application est déjà installée ;
   - « Plus tard » repousse d'une semaine ;
   - trois refus et on n'insiste plus jamais ;
   - sur iPhone, où le navigateur n'autorise aucune installation
     automatique, on affiche les trois gestes à faire. */
(function () {
  'use strict';
  if (window.__nxInstallV552) return;
  window.__nxInstallV552 = true;

  var CLE = 'nexora.install.v552';
  var DELAI_AVANT = 3500;          /* laisser l'application s'ouvrir d'abord */
  var REPOUSSE = 7 * 24 * 3600 * 1000;
  var REFUS_MAX = 3;

  var invite = null;               /* l'événement retenu par le navigateur */
  var carteAffichee = false;

  function etat() {
    try { return JSON.parse(localStorage.getItem(CLE) || '{}') || {}; }
    catch (_e) { return {}; }
  }
  function noter(o) {
    try { localStorage.setItem(CLE, JSON.stringify(o)); } catch (_e) {}
  }

  function dejaInstallee() {
    try {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
      if (window.navigator && window.navigator.standalone === true) return true;  /* iOS */
    } catch (_e) {}
    return etat().installee === true;
  }

  function estIOS() {
    try {
      var ua = navigator.userAgent || '';
      return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    } catch (_e) { return false; }
  }

  function autorisee() {
    if (dejaInstallee()) return false;
    var e = etat();
    if ((e.refus || 0) >= REFUS_MAX) return false;
    if (e.prochaine && Date.now() < e.prochaine) return false;
    return true;
  }

  function styles() {
    if (document.getElementById('nxInstallStyleV552')) return;
    var s = document.createElement('style');
    s.id = 'nxInstallStyleV552';
    s.textContent = [
      '.nx-inst-v552{position:fixed;left:0;right:0;bottom:0;z-index:99999;',
      'background:#eceae5;color:#2b3138;border-radius:18px 18px 0 0;',
      'box-shadow:0 -8px 32px rgba(0,0,0,.28);padding:20px 18px 18px;',
      'font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;',
      'transform:translateY(110%);transition:transform .38s cubic-bezier(.22,.8,.3,1);}',
      '.nx-inst-v552.on{transform:translateY(0);}',
      '.nx-inst-tete-v552{display:flex;align-items:center;gap:12px;margin-bottom:12px;}',
      '.nx-inst-ico-v552{width:46px;height:46px;border-radius:12px;flex:0 0 auto;',
      'background:#2b3138;display:flex;align-items:center;justify-content:center;',
      'font-size:24px;color:#fff;}',
      '.nx-inst-tete-v552 strong{display:block;font-size:17px;line-height:1.25;}',
      '.nx-inst-tete-v552 small{display:block;opacity:.7;font-size:13px;margin-top:2px;}',
      '.nx-inst-list-v552{list-style:none;margin:0 0 16px;padding:0;}',
      '.nx-inst-list-v552 li{display:flex;gap:9px;align-items:flex-start;margin:7px 0;font-size:14px;}',
      '.nx-inst-list-v552 li b{color:#c8842a;flex:0 0 auto;font-size:15px;line-height:1.4;}',
      '.nx-inst-btns-v552{display:flex;gap:10px;}',
      '.nx-inst-btns-v552 button{flex:1;padding:14px 10px;border:0;border-radius:11px;',
      'font-size:15px;font-weight:600;font-family:inherit;}',
      '.nx-inst-oui-v552{background:#c8842a;color:#fff;}',
      '.nx-inst-non-v552{background:transparent;color:#2b3138;opacity:.65;flex:0 0 38%!important;}',
      '.nx-inst-pas-v552{margin:0 0 16px;padding:0 0 0 20px;font-size:14px;}',
      '.nx-inst-pas-v552 li{margin:8px 0;}',
      '@media(min-width:620px){.nx-inst-v552{left:auto;right:20px;bottom:20px;',
      'width:380px;border-radius:18px;}}'
    ].join('');
    document.head.appendChild(s);
  }

  function fermer(carte, refus) {
    carte.classList.remove('on');
    setTimeout(function () { if (carte.parentNode) carte.parentNode.removeChild(carte); }, 400);
    if (refus) {
      var e = etat();
      e.refus = (e.refus || 0) + 1;
      e.prochaine = Date.now() + REPOUSSE;
      noter(e);
    }
  }

  function carteIOS() {
    styles();
    var c = document.createElement('div');
    c.className = 'nx-inst-v552';
    c.setAttribute('role', 'dialog');
    c.innerHTML =
      '<div class="nx-inst-tete-v552"><span class="nx-inst-ico-v552" aria-hidden="true">📚</span>' +
      '<div><strong>Ajouter Nexora à votre écran d’accueil</strong>' +
      '<small>Trois gestes, une seule fois.</small></div></div>' +
      '<ol class="nx-inst-pas-v552">' +
      '<li>Touchez l’icône <b>Partager</b> en bas de Safari.</li>' +
      '<li>Choisissez <b>Sur l’écran d’accueil</b>.</li>' +
      '<li>Touchez <b>Ajouter</b>.</li></ol>' +
      '<div class="nx-inst-btns-v552">' +
      '<button type="button" class="nx-inst-oui-v552">J’ai compris</button></div>';
    document.body.appendChild(c);
    c.querySelector('.nx-inst-oui-v552').addEventListener('click', function () { fermer(c, true); });
    setTimeout(function () { c.classList.add('on'); }, 60);
    carteAffichee = true;
  }

  function carte() {
    if (carteAffichee || !autorisee()) return;
    if (estIOS()) { carteIOS(); return; }
    if (!invite) return;
    styles();

    var c = document.createElement('div');
    c.className = 'nx-inst-v552';
    c.setAttribute('role', 'dialog');
    c.innerHTML =
      '<div class="nx-inst-tete-v552"><span class="nx-inst-ico-v552" aria-hidden="true">📚</span>' +
      '<div><strong>Installer Nexora</strong>' +
      '<small>Gratuit, en quelques secondes.</small></div></div>' +
      '<ul class="nx-inst-list-v552">' +
      '<li><b>✓</b><span>S’ouvre depuis votre écran d’accueil, sans passer par le navigateur.</span></li>' +
      '<li><b>✓</b><span>Vos cours restent disponibles même sans connexion.</span></li>' +
      '<li><b>✓</b><span>Ouverture plus rapide et affichage en plein écran.</span></li>' +
      '</ul><div class="nx-inst-btns-v552">' +
      '<button type="button" class="nx-inst-oui-v552">Installer</button>' +
      '<button type="button" class="nx-inst-non-v552">Plus tard</button></div>';
    document.body.appendChild(c);

    c.querySelector('.nx-inst-non-v552').addEventListener('click', function () { fermer(c, true); });
    c.querySelector('.nx-inst-oui-v552').addEventListener('click', function () {
      var p = invite; invite = null;
      fermer(c, false);
      try {
        p.prompt();
        if (p.userChoice && p.userChoice.then) {
          p.userChoice.then(function (r) {
            if (!r || r.outcome !== 'accepted') {
              var e = etat(); e.refus = (e.refus || 0) + 1;
              e.prochaine = Date.now() + REPOUSSE; noter(e);
            }
          });
        }
      } catch (_e) { window.nxLog && window.nxLog(_e, 'install-v552'); }
    });

    setTimeout(function () { c.classList.add('on'); }, 60);
    carteAffichee = true;
  }

  /* Le navigateur signale que l'application est installable. index.html capte
     déjà cet événement pour son propre bloc ; plusieurs écouteurs peuvent
     coexister sans se gêner, chacun recevant le même objet. */
  window.addEventListener('beforeinstallprompt', function (ev) {
    try { ev.preventDefault(); } catch (_e) {}
    invite = ev;
    if (autorisee()) setTimeout(carte, DELAI_AVANT);
  });

  window.addEventListener('appinstalled', function () {
    invite = null;
    var e = etat(); e.installee = true; noter(e);
  });

  /* Sur iPhone, aucun événement n'est émis : on décide seuls. */
  if (estIOS() && autorisee()) setTimeout(carte, DELAI_AVANT + 1500);
})();


/* ===== V553 — Exercices corrigés du primaire (pilote : Calcul, 1ère année) =====
   Le moteur du primaire est chiffré et non modifiable, et le contenu ne
   stocke aucune bonne réponse : l'application ne peut donc pas corriger.
   Ce module apporte ses propres exercices, sa saisie et sa correction.
   Il ne lit rien du moteur et ne le modifie pas : il s'ajoute par-dessus.

   Trois formes d'exercices, adaptées à un enfant de 6-7 ans qui lit peu :
   - compter  : on montre des objets, l'enfant touche le bon chiffre ;
   - choix    : deux ou trois propositions, l'enfant touche la bonne ;
   - clavier  : un pavé de chiffres pour les additions et soustractions.
   La consigne est lue à voix haute quand l'appareil sait le faire. */
(function () {
  'use strict';
  if (window.__nxExosV553) return;
  window.__nxExosV553 = true;

  var SERIE = [{"t": "choix", "c": "Où y a-t-il BEAUCOUP de mangues ?", "p": ["🥭🥭🥭🥭🥭🥭", "🥭🥭", "(rien)"], "r": "🥭🥭🥭🥭🥭🥭", "l": 1, "v": ""}, {"t": "choix", "c": "Où n’y a-t-il RIEN ?", "p": ["🐟🐟", "(rien)", "🐟"], "r": "(rien)", "l": 1, "v": ""}, {"t": "choix", "c": "Qui a le PLUS de billes ?", "p": ["Awa 🔵🔵🔵🔵", "Sory 🔵🔵"], "r": "Awa 🔵🔵🔵🔵", "l": 2, "v": ""}, {"t": "choix", "c": "Qui a le MOINS de bananes ?", "p": ["Fatou 🍌🍌🍌", "Moussa 🍌"], "r": "Moussa 🍌", "l": 2, "v": ""}, {"t": "choix", "c": "Y a-t-il AUTANT de ronds que de carrés ?", "p": ["🔴🔴🔴 et 🟦🟦🟦 → oui", "🔴🔴🔴 et 🟦 → non"], "r": "🔴🔴🔴 et 🟦🟦🟦 → oui", "l": 2, "v": ""}, {"t": "choix", "c": "Touche la forme qui n’a pas la même COULEUR.", "p": ["🔴", "🔴", "🔵"], "r": "🔵", "l": 3, "v": ""}, {"t": "choix", "c": "Touche l’objet qui n’a pas la même FORME.", "p": ["🟦", "🟦", "🔺"], "r": "🔺", "l": 3, "v": ""}, {"t": "choix", "c": "L’oiseau est SUR l’arbre ou SOUS l’arbre ? 🌳🐦 (l’oiseau est en haut)", "p": ["sur", "sous"], "r": "sur", "l": 4, "v": ""}, {"t": "choix", "c": "Le chat est DEVANT ou DERRIÈRE la maison ? 🏠 … 🐈 (le chat est caché)", "p": ["devant", "derrière"], "r": "derrière", "l": 4, "v": ""}, {"t": "compter", "c": "Combien vois-tu de poissons ?", "o": "🐟", "r": "1", "l": 5}, {"t": "compter", "c": "Combien vois-tu de mangues ?", "o": "🥭", "r": "2", "l": 6}, {"t": "compter", "c": "Combien vois-tu de fleurs ?", "o": "🌼", "r": "3", "l": 7}, {"t": "compter", "c": "Combien vois-tu de ballons ?", "o": "⚽", "r": "4", "l": 8}, {"t": "compter", "c": "Combien vois-tu d’étoiles ?", "o": "⭐", "r": "5", "l": 9}, {"t": "compter", "c": "Combien vois-tu de bananes ?", "o": "🍌", "r": "3", "l": 7}, {"t": "compter", "c": "Combien vois-tu de tortues ?", "o": "🐢", "r": "4", "l": 8}, {"t": "compter", "c": "Le panier est vide. Combien vois-tu de poissons ?", "o": "", "r": "0", "l": 10}, {"t": "choix", "c": "Il n’y a rien dans le panier. On écrit :", "p": ["0", "1"], "r": "0", "l": 10, "v": ""}, {"t": "clavier", "c": "2 + 1 = ?", "r": "3", "l": 11, "v": "🥭🥭 + 🥭"}, {"t": "clavier", "c": "1 + 1 = ?", "r": "2", "l": 11, "v": "🐟 + 🐟"}, {"t": "clavier", "c": "3 + 2 = ?", "r": "5", "l": 11, "v": "⭐⭐⭐ + ⭐⭐"}, {"t": "clavier", "c": "2 + 2 = ?", "r": "4", "l": 11, "v": "🌼🌼 + 🌼🌼"}, {"t": "clavier", "c": "4 + 1 = ?", "r": "5", "l": 11, "v": "⚽⚽⚽⚽ + ⚽"}, {"t": "clavier", "c": "0 + 3 = ?", "r": "3", "l": 11, "v": ""}, {"t": "clavier", "c": "3 − 1 = ?", "r": "2", "l": 12, "v": "🍌🍌🍌 on enlève 🍌"}, {"t": "clavier", "c": "5 − 2 = ?", "r": "3", "l": 12, "v": "⭐⭐⭐⭐⭐ on enlève ⭐⭐"}, {"t": "clavier", "c": "4 − 4 = ?", "r": "0", "l": 12, "v": ""}, {"t": "clavier", "c": "2 − 1 = ?", "r": "1", "l": 12, "v": "🐢🐢 on enlève 🐢"}, {"t": "clavier", "c": "5 − 1 = ?", "r": "4", "l": 12, "v": ""}, {"t": "choix", "c": "Quel trait est le plus LONG ?", "p": ["▬▬▬▬▬▬", "▬▬"], "r": "▬▬▬▬▬▬", "l": 13, "v": ""}, {"t": "choix", "c": "Quel serpent est le plus COURT ?", "p": ["🐍🐍🐍", "🐍"], "r": "🐍", "l": 13, "v": ""}, {"t": "choix", "c": "Touche le CARRÉ.", "p": ["🟦", "▬▬▬"], "r": "🟦", "l": 14, "v": ""}, {"t": "choix", "c": "Un carré a combien de côtés ?", "p": ["4", "3"], "r": "4", "l": 14, "v": ""}];
  var CLE = 'nexora.exos.cp1.calcul.v553';

  function melange(a) {
    var t = a.slice(), i, j, x;
    for (i = t.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); x = t[i]; t[i] = t[j]; t[j] = x; }
    return t;
  }
  function dire(texte) {
    try {
      if (!window.speechSynthesis) return;
      var u = new SpeechSynthesisUtterance(String(texte).replace(/[🥭🐟🌼⚽⭐🍌🐢🔴🔵🟦🔺🐍▬🌳🐦🏠🐈]/g, ''));
      u.lang = 'fr-FR'; u.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (_e) {}
  }

  function styles() {
    if (document.getElementById('nxExosStyleV553')) return;
    var s = document.createElement('style');
    s.id = 'nxExosStyleV553';
    s.textContent = [
      '.nx-ex-btn-v553{position:fixed;right:14px;bottom:88px;z-index:9998;border:0;',
      'background:#c8842a;color:#fff;font:600 15px/1.2 system-ui,sans-serif;',
      'padding:14px 18px;border-radius:26px;box-shadow:0 6px 20px rgba(0,0,0,.3);}',
      '.nx-ex-v553{position:fixed;inset:0;z-index:99998;background:#eceae5;color:#2b3138;',
      'font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow-y:auto;',
      'display:flex;flex-direction:column;padding:16px;}',
      '.nx-ex-tete-v553{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}',
      '.nx-ex-tete-v553 b{font-size:17px;}',
      '.nx-ex-fermer-v553{border:0;background:#2b3138;color:#fff;border-radius:9px;',
      'padding:9px 14px;font:600 14px/1 inherit;}',
      '.nx-ex-jauge-v553{height:8px;background:#d9d5cd;border-radius:5px;overflow:hidden;margin-bottom:18px;}',
      '.nx-ex-jauge-v553 i{display:block;height:100%;background:#c8842a;transition:width .3s;}',
      '.nx-ex-consigne-v553{font-size:19px;font-weight:600;margin:0 0 6px;}',
      '.nx-ex-visuel-v553{font-size:34px;line-height:1.35;margin:10px 0 18px;word-break:break-word;}',
      '.nx-ex-objets-v553{font-size:40px;line-height:1.35;margin:10px 0 18px;letter-spacing:6px;}',
      '.nx-ex-grille-v553{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}',
      '.nx-ex-grille-v553.deux{grid-template-columns:repeat(2,1fr);}',
      '.nx-ex-grille-v553 button{padding:20px 8px;border:2px solid #d9d5cd;background:#fff;',
      'border-radius:14px;font:600 20px/1.3 inherit;color:#2b3138;}',
      '.nx-ex-pave-v553{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:320px;margin:0 auto;}',
      '.nx-ex-pave-v553 button{padding:22px 0;border:2px solid #d9d5cd;background:#fff;',
      'border-radius:14px;font:700 26px/1 inherit;color:#2b3138;}',
      '.nx-ex-juste-v553{border-color:#1d7a43!important;background:#e6f4ec!important;}',
      '.nx-ex-faux-v553{border-color:#b3261e!important;background:#fdeceb!important;}',
      '.nx-ex-verdict-v553{margin-top:18px;font-size:18px;font-weight:600;min-height:30px;}',
      '.nx-ex-suivant-v553{margin-top:16px;width:100%;padding:16px;border:0;border-radius:12px;',
      'background:#2b3138;color:#fff;font:600 16px/1 inherit;}',
      '.nx-ex-bilan-v553{text-align:center;padding:30px 10px;}',
      '.nx-ex-bilan-v553 .note{font-size:44px;font-weight:700;color:#c8842a;margin:12px 0;}'
    ].join('');
    document.head.appendChild(s);
  }

  function lancer() {
    styles();
    var liste = melange(SERIE), n = 0, bons = 0, rate = [];

    var p = document.createElement('div');
    p.className = 'nx-ex-v553';
    document.body.appendChild(p);

    function fermer() { if (p.parentNode) p.parentNode.removeChild(p); }

    function bilan() {
      var pc = Math.round(bons * 100 / liste.length);
      try {
        var h = JSON.parse(localStorage.getItem(CLE) || '[]');
        h.push({ d: Date.now(), bons: bons, total: liste.length });
        localStorage.setItem(CLE, JSON.stringify(h.slice(-20)));
      } catch (_e) {}
      p.innerHTML =
        '<div class="nx-ex-bilan-v553"><div style="font-size:52px">' +
        (pc >= 80 ? '🌟' : pc >= 50 ? '👍' : '💪') + '</div>' +
        '<div class="note">' + bons + ' / ' + liste.length + '</div>' +
        '<p>' + (pc >= 80 ? 'Très bien ! Tu as bien travaillé.'
              : pc >= 50 ? 'C’est bien. Recommence pour faire encore mieux.'
              : 'Ce n’est pas grave. Recommence doucement.') + '</p>' +
        (rate.length ? '<p style="opacity:.75;font-size:15px">À revoir : leçons ' +
          rate.filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; }).join(', ') + '</p>' : '') +
        '<button type="button" class="nx-ex-suivant-v553" id="nxExRefaire">Recommencer</button>' +
        '<button type="button" class="nx-ex-suivant-v553" id="nxExQuitter" ' +
        'style="background:transparent;color:#2b3138;opacity:.7">Fermer</button></div>';
      p.querySelector('#nxExRefaire').addEventListener('click', function () { fermer(); lancer(); });
      p.querySelector('#nxExQuitter').addEventListener('click', fermer);
    }

    function afficher() {
      if (n >= liste.length) { bilan(); return; }
      var e = liste[n], repondu = false;

      var html =
        '<div class="nx-ex-tete-v553"><b>Calcul — 1ère année</b>' +
        '<button type="button" class="nx-ex-fermer-v553">Fermer</button></div>' +
        '<div class="nx-ex-jauge-v553"><i style="width:' + Math.round(n * 100 / liste.length) + '%"></i></div>' +
        '<p class="nx-ex-consigne-v553">' + e.c + '</p>';

      if (e.t === 'compter') {
        html += '<div class="nx-ex-objets-v553">' + (e.o ? new Array(Number(e.r) + 1).join(e.o) : '(rien)') + '</div>' +
                '<div class="nx-ex-grille-v553" id="nxExRep">' +
                [0, 1, 2, 3, 4, 5].map(function (v) {
                  return '<button type="button" data-v="' + v + '">' + v + '</button>';
                }).join('') + '</div>';
      } else if (e.t === 'choix') {
        if (e.v) html += '<div class="nx-ex-visuel-v553">' + e.v + '</div>';
        html += '<div class="nx-ex-grille-v553' + (e.p.length === 2 ? ' deux' : '') + '" id="nxExRep">' +
                melange(e.p).map(function (v) {
                  return '<button type="button" data-v="' + String(v).replace(/"/g, '&quot;') + '">' + v + '</button>';
                }).join('') + '</div>';
      } else {
        if (e.v) html += '<div class="nx-ex-visuel-v553">' + e.v + '</div>';
        html += '<div class="nx-ex-pave-v553" id="nxExRep">' +
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(function (v) {
                  return '<button type="button" data-v="' + v + '">' + v + '</button>';
                }).join('') + '</div>';
      }

      html += '<div class="nx-ex-verdict-v553" id="nxExVerdict"></div>';
      p.innerHTML = html;
      p.querySelector('.nx-ex-fermer-v553').addEventListener('click', fermer);
      dire(e.c);

      p.querySelector('#nxExRep').addEventListener('click', function (ev) {
        var b = ev.target.closest ? ev.target.closest('button') : null;
        if (!b || repondu) return;
        repondu = true;
        var juste = String(b.getAttribute('data-v')) === String(e.r);
        b.className = juste ? 'nx-ex-juste-v553' : 'nx-ex-faux-v553';
        var v = p.querySelector('#nxExVerdict');
        if (juste) { bons++; v.textContent = '✅ Bravo, c’est juste !'; v.style.color = '#1d7a43'; dire('Bravo, c’est juste'); }
        else {
          rate.push(e.l);
          v.textContent = '❌ Non. La bonne réponse est : ' + e.r;
          v.style.color = '#b3261e';
          dire('Non. La bonne réponse est ' + e.r);
        }
        var s = document.createElement('button');
        s.type = 'button'; s.className = 'nx-ex-suivant-v553';
        s.textContent = (n + 1 >= liste.length) ? 'Voir mon résultat' : 'Exercice suivant';
        s.addEventListener('click', function () { n++; afficher(); });
        p.appendChild(s);
      });
    }
    afficher();
  }

  /* Le bouton n'apparaît que dans la partie primaire, repérée par les
     marqueurs du moteur. Ailleurs, il est retiré. */
  function primaireVisible() {
    try {
      var n = document.querySelector('[data-nx-primary-action], .nx-primary-body-v145, .nx-primary-classboard-v158');
      if (!n) return false;
      var r = n.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    } catch (_e) { return false; }
  }

  function poserBouton() {
    try {
      var b = document.getElementById('nxExosBoutonV553');
      if (!primaireVisible()) { if (b) b.remove(); return; }
      if (b) return;
      styles();
      b = document.createElement('button');
      b.id = 'nxExosBoutonV553';
      b.type = 'button';
      b.className = 'nx-ex-btn-v553';
      b.textContent = '✏️ Exercices';
      b.addEventListener('click', lancer);
      document.body.appendChild(b);
    } catch (_e) { window.nxLog && window.nxLog(_e, 'exos-v553'); }
  }

  setInterval(poserBouton, 1500);
  setTimeout(poserBouton, 2500);
})();
