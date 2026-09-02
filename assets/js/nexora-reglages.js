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


/* ===== V554 — Exercices corrigés du primaire (1ère année, 7 matières) =====
   Remplace le pilote V553. Trois corrections par rapport à celui-ci :
   - le bouton s'insère dans l'écran du primaire au lieu de flotter par-dessus,
     avec repli flottant si le conteneur n'est pas trouvé ;
   - les visuels de calcul ne mêlent plus emojis et mots à la même taille,
     ce qui rendait certaines opérations illisibles ;
   - un menu permet de choisir la matière parmi les sept du programme.

   Le moteur du primaire est chiffré et non modifiable, et le contenu ne
   stocke aucune bonne réponse. Ce module apporte donc ses propres exercices,
   sa saisie et sa correction, sans rien lire ni modifier du moteur. */
(function () {
  'use strict';
  if (window.__nxExosV554) return;
  window.__nxExosV554 = true;

  var SERIES = {"entretien": [{"t": "choix", "c": "En entrant en classe, je dis :", "p": ["Bonjour maître", "Rien"], "r": "Bonjour maître", "l": 1, "v": ""}, {"t": "choix", "c": "Quand on appelle ton nom, tu réponds :", "p": ["Présent", "Absent"], "r": "Présent", "l": 1, "v": ""}, {"t": "choix", "c": "Aujourd’hui il pleut. Le temps est :", "p": ["☔ pluvieux", "☀️ ensoleillé"], "r": "☔ pluvieux", "l": 2, "v": ""}, {"t": "choix", "c": "Le soleil brille. Le temps est :", "p": ["☀️ ensoleillé", "☔ pluvieux"], "r": "☀️ ensoleillé", "l": 2, "v": ""}, {"t": "choix", "c": "Après lundi vient :", "p": ["mardi", "dimanche"], "r": "mardi", "l": 2, "v": ""}, {"t": "choix", "c": "Tu as très soif. Tu dis :", "p": ["J’ai soif, puis-je boire ?", "Rien"], "r": "J’ai soif, puis-je boire ?", "l": 3, "v": ""}, {"t": "choix", "c": "Tu ne te sens pas bien. Tu dois :", "p": ["le dire au maître", "le cacher"], "r": "le dire au maître", "l": 3, "v": ""}, {"t": "choix", "c": "Avant le cours, je prépare :", "p": ["✏️ mon crayon et mon cahier", "🍽️ mon assiette"], "r": "✏️ mon crayon et mon cahier", "l": 4, "v": ""}, {"t": "choix", "c": "Mon cahier est en désordre. Je :", "p": ["le range", "le laisse"], "r": "le range", "l": 4, "v": ""}], "francais": [{"t": "choix", "c": "Le matin, en arrivant, on dit :", "p": ["Bonjour", "Au revoir"], "r": "Bonjour", "l": 1, "v": ""}, {"t": "choix", "c": "Le soir, en partant, on dit :", "p": ["Bonjour", "Au revoir"], "r": "Au revoir", "l": 1, "v": ""}, {"t": "choix", "c": "On te demande ton nom. Tu réponds :", "p": ["Je m’appelle Awa", "J’ai faim"], "r": "Je m’appelle Awa", "l": 2, "v": ""}, {"t": "choix", "c": "Pour demander le nom de quelqu’un, tu dis :", "p": ["Comment tu t’appelles ?", "Où est le livre ?"], "r": "Comment tu t’appelles ?", "l": 2, "v": ""}, {"t": "choix", "c": "Avec quoi écris-tu ?", "p": ["✏️ le crayon", "🍽️ l’assiette"], "r": "✏️ le crayon", "l": 3, "v": ""}, {"t": "choix", "c": "Où ranges-tu tes livres ?", "p": ["🎒 le cartable", "🚗 la voiture"], "r": "🎒 le cartable", "l": 3, "v": ""}, {"t": "choix", "c": "Le maître dit : « Levez-vous. » Que fais-tu ?", "p": ["Je me lève", "Je m’assieds"], "r": "Je me lève", "l": 4, "v": ""}, {"t": "choix", "c": "Le maître dit : « Écoutez. » Que fais-tu ?", "p": ["Je me tais et j’écoute", "Je parle fort"], "r": "Je me tais et j’écoute", "l": 4, "v": ""}, {"t": "choix", "c": "Quelle forme est différente ?", "p": ["🔺", "🔺", "🟦"], "r": "🟦", "l": 5, "v": ""}, {"t": "choix", "c": "Quelle lettre est différente ?", "p": ["a", "a", "i"], "r": "i", "l": 5, "v": ""}, {"t": "choix", "c": "Dans quel mot entends-tu le son [a] ?", "p": ["papa", "lit"], "r": "papa", "l": 6, "v": ""}, {"t": "choix", "c": "Touche la lettre a.", "p": ["a", "i", "m"], "r": "a", "l": 6, "v": ""}, {"t": "choix", "c": "Dans quel mot entends-tu le son [i] ?", "p": ["riz", "mangue"], "r": "riz", "l": 7, "v": ""}, {"t": "choix", "c": "Touche la lettre i.", "p": ["i", "l", "a"], "r": "i", "l": 7, "v": ""}, {"t": "choix", "c": "Dans quel mot entends-tu le son [m] ?", "p": ["maman", "riz"], "r": "maman", "l": 8, "v": ""}, {"t": "choix", "c": "Touche la lettre m.", "p": ["m", "a", "i"], "r": "m", "l": 8, "v": ""}, {"t": "choix", "c": "Dans quel mot entends-tu le son [l] ?", "p": ["lune", "papa"], "r": "lune", "l": 9, "v": ""}, {"t": "choix", "c": "Touche la lettre l.", "p": ["l", "m", "i"], "r": "l", "l": 9, "v": ""}, {"t": "choix", "c": "m + a se lit :", "p": ["ma", "am"], "r": "ma", "l": 10, "v": ""}, {"t": "choix", "c": "l + i se lit :", "p": ["li", "il"], "r": "li", "l": 10, "v": ""}, {"t": "choix", "c": "m + i se lit :", "p": ["mi", "im"], "r": "mi", "l": 10, "v": ""}, {"t": "choix", "c": "Lis : ma-ma. C’est le mot :", "p": ["mama", "lila"], "r": "mama", "l": 11, "v": ""}, {"t": "choix", "c": "Lis : li-li. C’est le mot :", "p": ["lili", "mimi"], "r": "lili", "l": 11, "v": ""}, {"t": "choix", "c": "Pour tracer un rond, ma main fait :", "p": ["un tour", "un trait droit"], "r": "un tour", "l": 12, "v": ""}, {"t": "choix", "c": "Quel trait est droit ?", "p": ["|", "~"], "r": "|", "l": 12, "v": ""}, {"t": "choix", "c": "Quelle lettre commence par un rond ?", "p": ["a", "i"], "r": "a", "l": 13, "v": ""}, {"t": "choix", "c": "Quelle lettre a un point au-dessus ?", "p": ["i", "m"], "r": "i", "l": 13, "v": ""}], "calcul": [{"t": "choix", "c": "Où y a-t-il BEAUCOUP de mangues ?", "p": ["🥭🥭🥭🥭🥭🥭", "🥭🥭", "(rien)"], "r": "🥭🥭🥭🥭🥭🥭", "l": 1, "v": ""}, {"t": "choix", "c": "Où n’y a-t-il RIEN ?", "p": ["🐟🐟", "(rien)", "🐟"], "r": "(rien)", "l": 1, "v": ""}, {"t": "choix", "c": "Qui a le PLUS de billes ?", "p": ["Awa 🔵🔵🔵🔵", "Sory 🔵🔵"], "r": "Awa 🔵🔵🔵🔵", "l": 2, "v": ""}, {"t": "choix", "c": "Qui a le MOINS de bananes ?", "p": ["Fatou 🍌🍌🍌", "Moussa 🍌"], "r": "Moussa 🍌", "l": 2, "v": ""}, {"t": "choix", "c": "Y a-t-il AUTANT de ronds que de carrés ?", "p": ["🔴🔴🔴 et 🟦🟦🟦 → oui", "🔴🔴🔴 et 🟦 → non"], "r": "🔴🔴🔴 et 🟦🟦🟦 → oui", "l": 2, "v": ""}, {"t": "choix", "c": "Touche la forme qui n’a pas la même COULEUR.", "p": ["🔴", "🔴", "🔵"], "r": "🔵", "l": 3, "v": ""}, {"t": "choix", "c": "Touche l’objet qui n’a pas la même FORME.", "p": ["🟦", "🟦", "🔺"], "r": "🔺", "l": 3, "v": ""}, {"t": "choix", "c": "L’oiseau est SUR l’arbre ou SOUS l’arbre ? 🌳🐦 (l’oiseau est en haut)", "p": ["sur", "sous"], "r": "sur", "l": 4, "v": ""}, {"t": "choix", "c": "Le chat est DEVANT ou DERRIÈRE la maison ? 🏠 … 🐈 (le chat est caché)", "p": ["devant", "derrière"], "r": "derrière", "l": 4, "v": ""}, {"t": "compter", "c": "Combien vois-tu de poissons ?", "o": "🐟", "r": "1", "l": 5}, {"t": "compter", "c": "Combien vois-tu de mangues ?", "o": "🥭", "r": "2", "l": 6}, {"t": "compter", "c": "Combien vois-tu de fleurs ?", "o": "🌼", "r": "3", "l": 7}, {"t": "compter", "c": "Combien vois-tu de ballons ?", "o": "⚽", "r": "4", "l": 8}, {"t": "compter", "c": "Combien vois-tu d’étoiles ?", "o": "⭐", "r": "5", "l": 9}, {"t": "compter", "c": "Combien vois-tu de bananes ?", "o": "🍌", "r": "3", "l": 7}, {"t": "compter", "c": "Combien vois-tu de tortues ?", "o": "🐢", "r": "4", "l": 8}, {"t": "compter", "c": "Le panier est vide. Combien vois-tu de poissons ?", "o": "", "r": "0", "l": 10}, {"t": "choix", "c": "Il n’y a rien dans le panier. On écrit :", "p": ["0", "1"], "r": "0", "l": 10, "v": ""}, {"t": "clavier", "c": "2 + 1 = ?", "r": "3", "l": 11, "v": "🥭🥭 + 🥭"}, {"t": "clavier", "c": "1 + 1 = ?", "r": "2", "l": 11, "v": "🐟 + 🐟"}, {"t": "clavier", "c": "3 + 2 = ?", "r": "5", "l": 11, "v": "⭐⭐⭐ + ⭐⭐"}, {"t": "clavier", "c": "2 + 2 = ?", "r": "4", "l": 11, "v": "🌼🌼 + 🌼🌼"}, {"t": "clavier", "c": "4 + 1 = ?", "r": "5", "l": 11, "v": "⚽⚽⚽⚽ + ⚽"}, {"t": "clavier", "c": "0 + 3 = ?", "r": "3", "l": 11, "v": ""}, {"t": "clavier", "c": "3 − 1 = ?", "r": "2", "l": 12, "v": "🍌🍌🍌 − 🍌"}, {"t": "clavier", "c": "5 − 2 = ?", "r": "3", "l": 12, "v": "⭐⭐⭐⭐⭐ − ⭐⭐"}, {"t": "clavier", "c": "4 − 4 = ?", "r": "0", "l": 12, "v": ""}, {"t": "clavier", "c": "2 − 1 = ?", "r": "1", "l": 12, "v": "🐢🐢 − 🐢"}, {"t": "clavier", "c": "5 − 1 = ?", "r": "4", "l": 12, "v": ""}, {"t": "choix", "c": "Quel trait est le plus LONG ?", "p": ["▬▬▬▬▬▬", "▬▬"], "r": "▬▬▬▬▬▬", "l": 13, "v": ""}, {"t": "choix", "c": "Quel serpent est le plus COURT ?", "p": ["🐍🐍🐍", "🐍"], "r": "🐍", "l": 13, "v": ""}, {"t": "choix", "c": "Touche le CARRÉ.", "p": ["🟦", "▬▬▬"], "r": "🟦", "l": 14, "v": ""}, {"t": "choix", "c": "Un carré a combien de côtés ?", "p": ["4", "3"], "r": "4", "l": 14, "v": ""}], "sciences": [{"t": "choix", "c": "Lequel est un animal ?", "p": ["🐐 la chèvre", "🪨 la pierre"], "r": "🐐 la chèvre", "l": 1, "v": ""}, {"t": "choix", "c": "Lequel est une plante ?", "p": ["🌴 le palmier", "🚗 la voiture"], "r": "🌴 le palmier", "l": 1, "v": ""}, {"t": "choix", "c": "Lequel est VIVANT ?", "p": ["🐟 le poisson", "🥄 la cuillère"], "r": "🐟 le poisson", "l": 2, "v": ""}, {"t": "choix", "c": "Lequel n’est PAS vivant ?", "p": ["🪨 la pierre", "🌱 la plante"], "r": "🪨 la pierre", "l": 2, "v": ""}, {"t": "choix", "c": "Un être vivant grandit et mange. Le caillou :", "p": ["ne grandit pas", "grandit"], "r": "ne grandit pas", "l": 2, "v": ""}, {"t": "choix", "c": "Avec quoi marches-tu ?", "p": ["🦶 les pieds", "👂 les oreilles"], "r": "🦶 les pieds", "l": 3, "v": ""}, {"t": "choix", "c": "Avec quoi attrapes-tu un objet ?", "p": ["✋ la main", "👃 le nez"], "r": "✋ la main", "l": 3, "v": ""}, {"t": "compter", "c": "Combien as-tu de mains ?", "o": "✋", "r": "2", "l": 3}, {"t": "choix", "c": "Avec quoi sens-tu l’odeur du pain ?", "p": ["👃 le nez", "👀 les yeux"], "r": "👃 le nez", "l": 4, "v": ""}, {"t": "choix", "c": "Avec quoi goûtes-tu le sucre ?", "p": ["👅 la langue", "👂 l’oreille"], "r": "👅 la langue", "l": 4, "v": ""}, {"t": "choix", "c": "Avec quoi entends-tu le tam-tam ?", "p": ["👂 les oreilles", "🦶 les pieds"], "r": "👂 les oreilles", "l": 5, "v": ""}, {"t": "choix", "c": "Quand faut-il se laver les mains ?", "p": ["Avant de manger", "Jamais"], "r": "Avant de manger", "l": 6, "v": ""}, {"t": "choix", "c": "Avec quoi te laves-tu les dents ?", "p": ["🪥 la brosse", "🥄 la cuillère"], "r": "🪥 la brosse", "l": 6, "v": ""}, {"t": "choix", "c": "D’où vient le lait ?", "p": ["🐄 la vache", "🪨 la pierre"], "r": "🐄 la vache", "l": 7, "v": ""}, {"t": "choix", "c": "D’où vient la mangue ?", "p": ["🌳 l’arbre", "🐟 le poisson"], "r": "🌳 l’arbre", "l": 7, "v": ""}, {"t": "choix", "c": "Que fais-tu avant de manger un fruit ?", "p": ["Je le lave", "Je le jette"], "r": "Je le lave", "l": 8, "v": ""}, {"t": "choix", "c": "Peut-on boire de l’eau sale ?", "p": ["Non", "Oui"], "r": "Non", "l": 8, "v": ""}, {"t": "choix", "c": "Lequel est fabriqué par l’homme ?", "p": ["🪑 la chaise", "🌳 l’arbre"], "r": "🪑 la chaise", "l": 9, "v": ""}, {"t": "choix", "c": "Lequel vient de la nature ?", "p": ["🪨 la pierre", "✏️ le crayon"], "r": "🪨 la pierre", "l": 9, "v": ""}, {"t": "choix", "c": "À quoi sert un balai ?", "p": ["À balayer", "À manger"], "r": "À balayer", "l": 10, "v": ""}, {"t": "choix", "c": "À quoi sert une cuillère ?", "p": ["À manger", "À écrire"], "r": "À manger", "l": 10, "v": ""}], "ecm": [{"t": "choix", "c": "En classe, pour parler, je :", "p": ["lève le doigt", "crie"], "r": "lève le doigt", "l": 1, "v": ""}, {"t": "choix", "c": "Pendant que le maître parle, je :", "p": ["écoute", "joue"], "r": "écoute", "l": 1, "v": ""}, {"t": "choix", "c": "On te donne quelque chose. Tu dis :", "p": ["Merci", "Rien"], "r": "Merci", "l": 2, "v": ""}, {"t": "choix", "c": "Tu bouscules quelqu’un. Tu dis :", "p": ["Pardon", "Tant pis"], "r": "Pardon", "l": 2, "v": ""}, {"t": "choix", "c": "Tu arrives en classe. Tu dis :", "p": ["Bonjour", "Au revoir"], "r": "Bonjour", "l": 2, "v": ""}, {"t": "choix", "c": "Ton ami n’a pas de crayon. Tu :", "p": ["partages le tien", "refuses"], "r": "partages le tien", "l": 3, "v": ""}, {"t": "choix", "c": "Plusieurs enfants attendent. Tu :", "p": ["attends ton tour", "passes devant"], "r": "attends ton tour", "l": 3, "v": ""}, {"t": "choix", "c": "Tu prends un livre de la classe. Tu :", "p": ["en prends soin", "le déchires"], "r": "en prends soin", "l": 4, "v": ""}, {"t": "choix", "c": "Après avoir lu, tu :", "p": ["ranges le livre", "le laisses par terre"], "r": "ranges le livre", "l": 4, "v": ""}, {"t": "choix", "c": "Un papier traîne par terre. Tu :", "p": ["le mets à la poubelle", "le laisses"], "r": "le mets à la poubelle", "l": 5, "v": ""}, {"t": "choix", "c": "Où jette-t-on les ordures ?", "p": ["🗑️ dans la poubelle", "dans la cour"], "r": "🗑️ dans la poubelle", "l": 5, "v": ""}, {"t": "choix", "c": "Avant de traverser la route, je :", "p": ["regarde à gauche et à droite", "cours vite"], "r": "regarde à gauche et à droite", "l": 6, "v": ""}, {"t": "choix", "c": "Où traverse-t-on la route ?", "p": ["Sur le passage piéton", "N’importe où"], "r": "Sur le passage piéton", "l": 6, "v": ""}], "arts": [{"t": "choix", "c": "Le tam-tam fait : ta — ta — ta. Ensuite vient :", "p": ["ta", "silence"], "r": "ta", "l": 1, "v": ""}, {"t": "choix", "c": "Quel rythme est plus rapide ?", "p": ["ta-ta-ta-ta", "ta … ta"], "r": "ta-ta-ta-ta", "l": 1, "v": ""}, {"t": "choix", "c": "Pour bien réciter, il faut :", "p": ["parler clairement", "murmurer"], "r": "parler clairement", "l": 2, "v": ""}, {"t": "choix", "c": "Touche la couleur ROUGE.", "p": ["🔴", "🔵", "🟡"], "r": "🔴", "l": 3, "v": ""}, {"t": "choix", "c": "Touche la couleur BLEUE.", "p": ["🔵", "🟢", "🔴"], "r": "🔵", "l": 3, "v": ""}, {"t": "choix", "c": "Touche la couleur JAUNE.", "p": ["🟡", "🟢", "🔵"], "r": "🟡", "l": 3, "v": ""}, {"t": "choix", "c": "Touche la couleur VERTE.", "p": ["🟢", "🔴", "🟡"], "r": "🟢", "l": 3, "v": ""}, {"t": "choix", "c": "Pour dessiner un objet, je dois d’abord :", "p": ["bien le regarder", "fermer les yeux"], "r": "bien le regarder", "l": 4, "v": ""}, {"t": "choix", "c": "Avec quoi peut-on modeler ?", "p": ["l’argile", "le verre"], "r": "l’argile", "l": 5, "v": ""}, {"t": "choix", "c": "Une étiquette-mot sert à :", "p": ["nommer un objet", "manger"], "r": "nommer un objet", "l": 6, "v": ""}], "eps": [{"t": "choix", "c": "Au signal « stop », je :", "p": ["m’arrête", "continue"], "r": "m’arrête", "l": 1, "v": ""}, {"t": "choix", "c": "Marcher, c’est :", "p": ["poser un pied puis l’autre", "sauter"], "r": "poser un pied puis l’autre", "l": 1, "v": ""}, {"t": "choix", "c": "Pour courir vite, je regarde :", "p": ["devant moi", "mes pieds"], "r": "devant moi", "l": 2, "v": ""}, {"t": "choix", "c": "Sauter à pieds joints, c’est sauter avec :", "p": ["les deux pieds ensemble", "un seul pied"], "r": "les deux pieds ensemble", "l": 3, "v": ""}, {"t": "choix", "c": "Pour lancer loin, je lance avec :", "p": ["le bras", "la tête"], "r": "le bras", "l": 4, "v": ""}, {"t": "choix", "c": "Pour garder l’équilibre, j’écarte :", "p": ["les bras", "les oreilles"], "r": "les bras", "l": 5, "v": ""}, {"t": "choix", "c": "Dans un jeu, la règle sert à :", "p": ["jouer ensemble sans se disputer", "gagner en trichant"], "r": "jouer ensemble sans se disputer", "l": 6, "v": ""}, {"t": "choix", "c": "Ton camarade tombe. Tu :", "p": ["l’aides à se relever", "ris de lui"], "r": "l’aides à se relever", "l": 6, "v": ""}]};

  var NOMS = {
    entretien: 'Entretien du matin', francais: 'Français',
    calcul: 'Calcul', sciences: 'Sciences', ecm: 'Éducation civique',
    arts: 'Arts', eps: 'Sport'
  };
  var ICONES = {
    entretien: '🌅', francais: '📖', calcul: '🔢', sciences: '🔬',
    ecm: '🤝', arts: '🎨', eps: '⚽'
  };
  var CLE = 'nexora.exos.cp1.v554';

  function melange(a) {
    var t = a.slice(), i, j, x;
    for (i = t.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); x = t[i]; t[i] = t[j]; t[j] = x; }
    return t;
  }
  function sansEmoji(s) {
    return String(s).replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu, ' ').trim();
  }
  function lire(texte) {
    try {
      if (!window.speechSynthesis) return;
      var u = new SpeechSynthesisUtterance(sansEmoji(texte));
      u.lang = 'fr-FR'; u.rate = 0.9;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    } catch (_e) {}
  }
  function scores() {
    try { return JSON.parse(localStorage.getItem(CLE) || '{}') || {}; } catch (_e) { return {}; }
  }

  function styles() {
    if (document.getElementById('nxExStyleV554')) return;
    var s = document.createElement('style');
    s.id = 'nxExStyleV554';
    s.textContent = [
      /* carte d'appel, inseree dans l'ecran du primaire */
      '.nx-ex-appel-v554{display:block;width:100%;box-sizing:border-box;margin:0 0 14px;',
      'border:0;border-radius:14px;background:#c8842a;color:#fff;text-align:left;',
      'padding:15px 16px;font:600 16px/1.3 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}',
      '.nx-ex-appel-v554 span{display:block;font-weight:400;font-size:13px;opacity:.9;margin-top:3px;}',
      '.nx-ex-appel-v554.flottant{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));',
      'width:auto;z-index:9998;box-shadow:0 6px 22px rgba(0,0,0,.3);margin:0;}',
      /* panneau */
      '.nx-ex-v554{position:fixed;inset:0;z-index:99998;background:#eceae5;color:#2b3138;overflow-y:auto;',
      'font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:16px 16px 30px;}',
      '.nx-ex-tete-v554{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;}',
      '.nx-ex-tete-v554 b{font-size:17px;}',
      '.nx-ex-x-v554{border:0;background:#2b3138;color:#fff;border-radius:9px;padding:9px 14px;font:600 14px/1 inherit;}',
      '.nx-ex-jauge-v554{height:8px;background:#d9d5cd;border-radius:5px;overflow:hidden;margin-bottom:18px;}',
      '.nx-ex-jauge-v554 i{display:block;height:100%;background:#c8842a;transition:width .3s;}',
      /* menu des matieres */
      '.nx-ex-menu-v554{display:grid;grid-template-columns:1fr 1fr;gap:11px;}',
      '.nx-ex-menu-v554 button{padding:18px 10px;border:2px solid #d9d5cd;background:#fff;border-radius:14px;',
      'font:600 15px/1.25 inherit;color:#2b3138;text-align:center;}',
      '.nx-ex-menu-v554 button em{display:block;font-style:normal;font-size:30px;margin-bottom:6px;}',
      '.nx-ex-menu-v554 button small{display:block;font-weight:400;opacity:.65;font-size:12px;margin-top:5px;}',
      /* exercice */
      '.nx-ex-consigne-v554{font-size:19px;font-weight:600;margin:0 0 4px;}',
      '.nx-ex-img-v554{font-size:38px;line-height:1.4;margin:14px 0 6px;letter-spacing:4px;word-break:break-word;}',
      '.nx-ex-mot-v554{font-size:15px;opacity:.75;margin:0 0 16px;}',
      '.nx-ex-rep-v554{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}',
      '.nx-ex-rep-v554.deux{grid-template-columns:1fr;}',
      '.nx-ex-rep-v554.pave{max-width:320px;margin:0 auto;}',
      '.nx-ex-rep-v554 button{padding:18px 10px;border:2px solid #d9d5cd;background:#fff;',
      'border-radius:14px;font:600 19px/1.3 inherit;color:#2b3138;}',
      '.nx-ex-rep-v554.pave button{padding:20px 0;font-size:26px;font-weight:700;}',
      '.nx-ex-ok-v554{border-color:#1d7a43!important;background:#e6f4ec!important;}',
      '.nx-ex-ko-v554{border-color:#b3261e!important;background:#fdeceb!important;}',
      '.nx-ex-dit-v554{margin-top:18px;font-size:18px;font-weight:600;min-height:28px;}',
      '.nx-ex-next-v554{margin-top:16px;width:100%;padding:16px;border:0;border-radius:12px;',
      'background:#2b3138;color:#fff;font:600 16px/1 inherit;}',
      '.nx-ex-bilan-v554{text-align:center;padding:26px 8px;}',
      '.nx-ex-bilan-v554 .note{font-size:44px;font-weight:700;color:#c8842a;margin:10px 0;}'
    ].join('');
    document.head.appendChild(s);
  }

  var panneau = null;
  function fermer() { if (panneau && panneau.parentNode) panneau.parentNode.removeChild(panneau); panneau = null; }

  function ouvrirMenu() {
    styles(); fermer();
    panneau = document.createElement('div');
    panneau.className = 'nx-ex-v554';
    var sc = scores();
    panneau.innerHTML =
      '<div class="nx-ex-tete-v554"><b>Exercices — 1ère année</b>' +
      '<button type="button" class="nx-ex-x-v554">Fermer</button></div>' +
      '<p style="margin:0 0 16px;opacity:.75;font-size:15px">Choisis une matière.</p>' +
      '<div class="nx-ex-menu-v554">' +
      Object.keys(SERIES).map(function (k) {
        var d = sc[k];
        return '<button type="button" data-m="' + k + '"><em>' + ICONES[k] + '</em>' + NOMS[k] +
          '<small>' + SERIES[k].length + ' exercices' +
          (d ? ' · ' + d.bons + '/' + d.total : '') + '</small></button>';
      }).join('') + '</div>';
    document.body.appendChild(panneau);
    panneau.querySelector('.nx-ex-x-v554').addEventListener('click', fermer);
    panneau.querySelector('.nx-ex-menu-v554').addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('button') : null;
      if (b && b.getAttribute('data-m')) lancer(b.getAttribute('data-m'));
    });
  }

  function lancer(mat) {
    styles(); fermer();
    var liste = melange(SERIES[mat]), n = 0, bons = 0, rate = [];
    panneau = document.createElement('div');
    panneau.className = 'nx-ex-v554';
    document.body.appendChild(panneau);

    function bilan() {
      var pc = Math.round(bons * 100 / liste.length);
      try {
        var sc = scores(); sc[mat] = { bons: bons, total: liste.length, d: Date.now() };
        localStorage.setItem(CLE, JSON.stringify(sc));
      } catch (_e) {}
      var revoir = rate.filter(function (v, i, a) { return a.indexOf(v) === i; })
                       .sort(function (a, b) { return a - b; });
      panneau.innerHTML =
        '<div class="nx-ex-bilan-v554"><div style="font-size:52px">' +
        (pc >= 80 ? '🌟' : pc >= 50 ? '👍' : '💪') + '</div>' +
        '<div class="note">' + bons + ' / ' + liste.length + '</div>' +
        '<p>' + (pc >= 80 ? 'Très bien ! Tu as bien travaillé.'
              : pc >= 50 ? 'C’est bien. Recommence pour faire encore mieux.'
              : 'Ce n’est pas grave. Recommence doucement.') + '</p>' +
        (revoir.length ? '<p style="opacity:.75;font-size:15px">À revoir : leçons ' + revoir.join(', ') + '</p>' : '') +
        '<button type="button" class="nx-ex-next-v554" id="nxRefaire">Recommencer</button>' +
        '<button type="button" class="nx-ex-next-v554" id="nxMenu" style="background:#c8842a">Autre matière</button>' +
        '<button type="button" class="nx-ex-next-v554" id="nxQuit" style="background:transparent;color:#2b3138;opacity:.7">Fermer</button></div>';
      panneau.querySelector('#nxRefaire').addEventListener('click', function () { lancer(mat); });
      panneau.querySelector('#nxMenu').addEventListener('click', ouvrirMenu);
      panneau.querySelector('#nxQuit').addEventListener('click', fermer);
    }

    function afficher() {
      if (n >= liste.length) { bilan(); return; }
      var e = liste[n], repondu = false;

      /* Les emojis et les mots ne partagent plus la même ligne ni la même
         taille : l'illustration au-dessus, l'explication en petit dessous. */
      var img = '', mot = '';
      if (e.t === 'compter') img = e.o ? new Array(Number(e.r) + 1).join(e.o) : '—';
      else if (e.v) {
        var brut = String(e.v);
        var lettres = sansEmoji(brut).replace(/[+−=\-]/g, '').trim();
        img = brut.replace(/[A-Za-zÀ-ÿ’']+/g, '').replace(/\s+/g, ' ').trim();
        if (lettres) mot = lettres;
        if (!img) { img = ''; mot = brut; }
      }

      var h =
        '<div class="nx-ex-tete-v554"><b>' + ICONES[mat] + ' ' + NOMS[mat] + '</b>' +
        '<button type="button" class="nx-ex-x-v554">Fermer</button></div>' +
        '<div class="nx-ex-jauge-v554"><i style="width:' + Math.round(n * 100 / liste.length) + '%"></i></div>' +
        '<p class="nx-ex-consigne-v554">' + e.c + '</p>' +
        (img ? '<div class="nx-ex-img-v554">' + img + '</div>' : '') +
        (mot ? '<p class="nx-ex-mot-v554">' + mot + '</p>' : '<div style="height:10px"></div>');

      if (e.t === 'compter') {
        h += '<div class="nx-ex-rep-v554" id="nxRep">' +
             [0, 1, 2, 3, 4, 5].map(function (v) { return '<button type="button" data-v="' + v + '">' + v + '</button>'; }).join('') + '</div>';
      } else if (e.t === 'choix') {
        h += '<div class="nx-ex-rep-v554' + (e.p.length === 2 ? ' deux' : '') + '" id="nxRep">' +
             melange(e.p).map(function (v) {
               return '<button type="button" data-v="' + String(v).replace(/"/g, '&quot;') + '">' + v + '</button>';
             }).join('') + '</div>';
      } else {
        h += '<div class="nx-ex-rep-v554 pave" id="nxRep">' +
             [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(function (v) { return '<button type="button" data-v="' + v + '">' + v + '</button>'; }).join('') + '</div>';
      }
      h += '<div class="nx-ex-dit-v554" id="nxDit"></div>';
      panneau.innerHTML = h;
      panneau.querySelector('.nx-ex-x-v554').addEventListener('click', fermer);
      lire(e.c);

      panneau.querySelector('#nxRep').addEventListener('click', function (ev) {
        var b = ev.target.closest ? ev.target.closest('button') : null;
        if (!b || repondu) return;
        repondu = true;
        var juste = String(b.getAttribute('data-v')) === String(e.r);
        b.className = juste ? 'nx-ex-ok-v554' : 'nx-ex-ko-v554';
        var d = panneau.querySelector('#nxDit');
        if (juste) { bons++; d.textContent = '✅ Bravo, c’est juste !'; d.style.color = '#1d7a43'; lire('Bravo'); }
        else {
          rate.push(e.l);
          d.textContent = '❌ Non. La bonne réponse est : ' + e.r;
          d.style.color = '#b3261e';
          lire('Non. La bonne réponse est ' + e.r);
        }
        var s = document.createElement('button');
        s.type = 'button'; s.className = 'nx-ex-next-v554';
        s.textContent = (n + 1 >= liste.length) ? 'Voir mon résultat' : 'Exercice suivant';
        s.addEventListener('click', function () { n++; afficher(); });
        panneau.appendChild(s);
      });
    }
    afficher();
  }

  /* Emplacement du bouton : d'abord dans l'écran du primaire, en tête de
     contenu ; à défaut seulement, en bandeau flottant en bas. */
  function conteneurPrimaire() {
    var sel = ['.nx-primary-classboard-v158', '.nx-primary-body-v145',
               '.nx-primary-class-grid-v158', '[data-nx-primary-list]'];
    for (var i = 0; i < sel.length; i++) {
      var n = document.querySelector(sel[i]);
      if (n && n.getBoundingClientRect) {
        var r = n.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return n;
      }
    }
    return null;
  }
  function primaireVisible() {
    if (conteneurPrimaire()) return true;
    var n = document.querySelector('[data-nx-primary-action]');
    if (!n) return false;
    var r = n.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function bouton() {
    var b = document.createElement('button');
    b.id = 'nxExAppelV554';
    b.type = 'button';
    b.className = 'nx-ex-appel-v554';
    b.innerHTML = '✏️ Faire des exercices <span>1ère année · 7 matières · l’application corrige</span>';
    b.addEventListener('click', ouvrirMenu);
    return b;
  }

  function poser() {
    try {
      var b = document.getElementById('nxExAppelV554');
      if (!primaireVisible()) { if (b) b.remove(); return; }
      var c = conteneurPrimaire();
      if (b) {
        if (c && b.parentNode !== c) { b.remove(); b = null; }
        else return;
      }
      styles();
      var nb = bouton();
      if (c) c.insertBefore(nb, c.firstChild);
      else { nb.classList.add('flottant'); document.body.appendChild(nb); }
    } catch (_e) { window.nxLog && window.nxLog(_e, 'exos-v554'); }
  }

  setInterval(poser, 1500);
  setTimeout(poser, 2500);
})();

/* V625 — La porte d'entrée : pas de session Supabase, pas d'accès.
   Corrige le trou de shouldOpenWelcomeGate(), qui laissait entrer
   toute personne ayant un ancien profil dans le téléphone. */
(function () {
  'use strict';
  if (window.__nxPorteV625) return;
  window.__nxPorteV625 = true;

  var DELAI_MAX = 15000;
  var connecte = false;
  var surveille = false;
  var observateur = null;

  function porte() { return document.getElementById('welcomeGate'); }

  /* V652 — Correction d'une erreur du V625.
     La porte se rouvrait meme quand c'est l'application elle-meme qui
     l'avait fermee pour afficher le formulaire de compte. Resultat :
     le formulaire s'ouvrait derriere la porte, et plus personne ne
     pouvait creer de compte. On ne rouvre donc plus la porte tant
     qu'une fenetre de compte est ouverte. */
  function fenetreCompteOuverte() {
    try {
      var m = document.getElementById('accountModal');
      if (m && m.classList.contains('open')) return true;
      /* Filet supplementaire : toute fenetre modale visible. */
      var ouvertes = document.querySelectorAll('.modal.open, [data-modal].open');
      for (var i = 0; i < ouvertes.length; i++) {
        if (ouvertes[i].offsetParent !== null) return true;
      }
    } catch (_e) {}
    return false;
  }

  function ouvrir() {
    var g = porte();
    if (!g || connecte) return;
    if (fenetreCompteOuverte()) return;
    if (g.hidden === false && document.body.classList.contains('welcome-active')) return;
    g.hidden = false;
    try { document.body.classList.add('welcome-active'); } catch (_e) {}
    try { g.scrollTop = 0; } catch (_e) {}
  }

  function surveiller() {
    if (surveille || connecte) return;
    surveille = true;
    ouvrir();
    if (typeof MutationObserver !== 'function') return;
    var g = porte();
    if (!g) return;
    observateur = new MutationObserver(function () {
      if (connecte) return;
      if (fenetreCompteOuverte()) return;
      if (porte() && porte().hidden !== false) ouvrir();
    });
    try { observateur.observe(g, { attributes: true, attributeFilter: ['hidden'] }); } catch (_e) {}
  }

  function relacher() {
    connecte = true;
    surveille = false;
    if (observateur) { try { observateur.disconnect(); } catch (_e) {} observateur = null; }
  }

  function clientPret() {
    var api = window.NexoraApp;
    if (!api) return null;
    try {
      if (typeof api.ensureSupabaseClientReady === 'function') return api.ensureSupabaseClientReady();
      if (typeof api.getSupabaseClient === 'function') {
        var c = api.getSupabaseClient();
        if (c) return Promise.resolve(c);
      }
    } catch (_e) {}
    return null;
  }

  function sessionActive(c) {
    if (!c || !c.auth || typeof c.auth.getSession !== 'function') return Promise.resolve(null);
    return c.auth.getSession().then(function (r) {
      var s = r && r.data && r.data.session;
      return (s && s.user) ? s : null;
    }).catch(function () { return null; });
  }

  function ecouterAuth(c) {
    if (!c || !c.auth || typeof c.auth.onAuthStateChange !== 'function') return;
    try {
      c.auth.onAuthStateChange(function (evenement, session) {
        if (session && session.user) relacher();
        else { connecte = false; surveille = false; surveiller(); }
      });
    } catch (_e) {}
  }

  function controler(c) {
    return sessionActive(c).then(function (s) {
      if (s) relacher(); else surveiller();
    });
  }

  var debut = Date.now();
  (function attendre() {
    var p = clientPret();
    if (!p) {
      /* Supabase pas encore prêt. On patiente sans rien bloquer :
         si le client n'arrive jamais, on ne verrouille pas l'application. */
      if (Date.now() - debut < DELAI_MAX) { setTimeout(attendre, 400); }
      return;
    }
    p.then(function (c) {
      ecouterAuth(c);
      return controler(c);
    }).catch(function () {});
  })();

  /* À chaque retour dans l'application */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    var p = clientPret();
    if (p) p.then(controler).catch(function () {});
  });
})();

/* V627 — « Reprendre » en tête de l'accueil.
   Rouvre exactement là où l'élève s'est arrêté dans le primaire.
   N'affiche rien tant qu'il n'y a rien à reprendre. */
(function () {
  'use strict';
  if (window.__nxReprendreV627) return;
  window.__nxReprendreV627 = true;

  var CLE_FAIT = 'nexora.primary.practice.done.v618';
  var CLASSES = { '1': '1ère année', '2': '2ème année', '3': '3ème année', '4': '4ème année', '5': '5ème année', '6': '6ème année' };
  var MATIERES = {
    francais: 'Français', maths: 'Mathématiques', sciences: 'Sciences d’observation',
    histoiregeo: 'Histoire-Géographie', histoire: 'Histoire', geographie: 'Géographie',
    ecm: 'ÉCM', arts: 'Arts', eps: 'EPS', entretien: 'Entretien'
  };
  var TEINTES = { '1': '#6FB7A0', '2': '#4FA894', '3': '#2F9385', '4': '#1F7A72', '5': '#16625E', '6': '#0E4A4A' };

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function dernier() {
    var brut;
    try { brut = JSON.parse(localStorage.getItem(CLE_FAIT) || '{}'); } catch (_e) { return null; }
    if (!brut || typeof brut !== 'object') return null;
    var cles = Object.keys(brut);
    if (!cles.length) return null;
    /* La clé vaut classe:matiere:partie:exercice. On reprend la plus avancée. */
    var meilleur = null;
    cles.forEach(function (k) {
      var p = k.split(':');
      if (p.length !== 4) return;
      var e = { classe: p[0], matiere: p[1], partie: parseInt(p[2], 10) || 0, exercice: parseInt(p[3], 10) || 0 };
      if (!CLASSES[e.classe]) return;
      if (!meilleur) { meilleur = e; return; }
      if (e.classe > meilleur.classe) { meilleur = e; return; }
      if (e.classe === meilleur.classe && e.partie >= meilleur.partie) meilleur = e;
    });
    return meilleur;
  }

  function styles() {
    if (document.getElementById('nxReprendreStyleV627')) return;
    var s = document.createElement('style');
    s.id = 'nxReprendreStyleV627';
    s.textContent = '.nx-reprendre-v627{display:flex;align-items:center;gap:14px;width:100%;text-align:left;' +
      'margin:0 0 14px;padding:15px 16px;border:0;border-left:6px solid var(--nxr-teinte,#2F9385);border-radius:17px;' +
      'background:#fff;box-shadow:0 3px 14px rgba(14,74,74,.09);cursor:pointer;font-family:inherit}' +
      '.nx-reprendre-v627:active{transform:scale(.99)}' +
      '.nx-reprendre-v627 .marque{flex:0 0 46px;height:46px;border-radius:15px;display:flex;align-items:center;justify-content:center;' +
      'background:var(--nxr-teinte,#2F9385);color:#fff}' +
      '.nx-reprendre-v627 .marque svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}' +
      '.nx-reprendre-v627 .txt{flex:1;min-width:0}' +
      '.nx-reprendre-v627 .eyebrow{display:block;font-size:11px;font-weight:800;letter-spacing:1.3px;text-transform:uppercase;color:var(--nxr-teinte,#2F9385)}' +
      '.nx-reprendre-v627 .titre{display:block;font-size:17px;font-weight:700;color:#12241F;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.nx-reprendre-v627 .detail{display:block;font-size:13px;color:#5b6f68;margin-top:2px}' +
      '.nx-reprendre-v627 .fleche{flex:0 0 auto;color:var(--nxr-teinte,#2F9385)}' +
      '.nx-reprendre-v627 .fleche svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}';
    (document.head || document.documentElement).appendChild(s);
  }

  function aller(e) {
    var api = window.NexoraPrimarySchoolV157;
    if (!api || typeof api.open !== 'function') {
      try { if (window.NexoraApp && window.NexoraApp.go) window.NexoraApp.go('academy'); } catch (_e) {}
      return;
    }
    function naviguer() {
      try {
        api.open();
        var pas = [
          '[data-level="' + e.classe + '"]',
          '[data-psubject="' + e.matiere + '"]',
          '[data-ppart="' + e.partie + '"]'
        ];
        var i = 0, essais = 0;
        (function suivant() {
          if (i >= pas.length) return;
          var el = document.querySelector(pas[i]);
          if (el) { el.click(); i++; essais = 0; setTimeout(suivant, 60); return; }
          if (essais++ < 80) setTimeout(suivant, 120);
        })();
      } catch (_err) {}
    }
    /* On passe par la garde d'abonnement de l'application, jamais autour. */
    if (typeof window.nxRequireSubscriptionAccess === 'function') {
      try { window.nxRequireSubscriptionAccess('academy', naviguer); return; } catch (_e) {}
    }
    naviguer();
  }

  function poser() {
    var hote = document.querySelector('[data-nx-espaces-v510="accueil"]');
    if (!hote || !hote.parentNode) return;
    var e = dernier();
    var existante = document.querySelector('.nx-reprendre-v627');
    if (!e) { if (existante) existante.remove(); return; }
    styles();
    var titre = CLASSES[e.classe] + ' · ' + (MATIERES[e.matiere] || e.matiere);
    var html = '<span class="marque"><svg viewBox="0 0 24 24"><path d="M8 5.5l10 6.5-10 6.5z"/></svg></span>' +
      '<span class="txt"><span class="eyebrow">Reprendre</span>' +
      '<span class="titre">' + esc(titre) + '</span>' +
      '<span class="detail">Leçon ' + (e.partie + 1) + ' · exercice ' + (e.exercice + 1) + '</span></span>' +
      '<span class="fleche"><svg viewBox="0 0 24 24"><path d="M9 5.5l6.5 6.5L9 18.5"/></svg></span>';
    var b = existante;
    if (!b) {
      b = document.createElement('button');
      b.type = 'button';
      b.className = 'nx-reprendre-v627';
      b.addEventListener('click', function () { aller(dernier() || e); });
      hote.parentNode.insertBefore(b, hote);
    }
    b.style.setProperty('--nxr-teinte', TEINTES[e.classe] || '#2F9385');
    b.innerHTML = html;
  }

  function surveiller() {
    poser();
    var ecran = document.getElementById('screen-student-work-feed');
    if (!ecran || typeof MutationObserver !== 'function') return;
    var minuteur = null;
    new MutationObserver(function () {
      clearTimeout(minuteur);
      minuteur = setTimeout(poser, 200);
    }).observe(ecran, { childList: true, subtree: false });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', surveiller);
  else setTimeout(surveiller, 300);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) setTimeout(poser, 200); });
})();

/* ===================================================================
   Nexora V650 — Invitation à installer l'application
   Deux manques corrigés ici :
   1. index.html ne déclare pas le manifeste, donc Chrome ne propose
      jamais l'installation. On le déclare au chargement.
   2. Aucune invitation visible. On affiche une barre discrète.
   =================================================================== */
(function () {
  'use strict';

  var CLE_REFUS = 'nexora.installation.refus.v650';
  var invite = null;

  function dejaInstalle() {
    try {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
      if (window.navigator && window.navigator.standalone) return true;
    } catch (_e) {}
    return false;
  }

  function refuseRecemment() {
    try {
      var t = Number(localStorage.getItem(CLE_REFUS) || 0);
      /* On ne represente pas la barre avant sept jours. */
      return t && (Date.now() - t) < 7 * 24 * 3600 * 1000;
    } catch (_e) { return false; }
  }

  function noterRefus() {
    try { localStorage.setItem(CLE_REFUS, String(Date.now())); } catch (_e) {}
  }

  /* 1. Declarer le manifeste s'il manque. */
  function poserManifeste() {
    try {
      if (document.querySelector('link[rel="manifest"]')) return;
      var lien = document.createElement('link');
      lien.rel = 'manifest';
      lien.href = '/manifest.json';
      (document.head || document.documentElement).appendChild(lien);
    } catch (_e) {}
  }

  /* 2. Barre d'invitation. */
  function styles() {
    if (document.getElementById('nx-install-style')) return;
    var s = document.createElement('style');
    s.id = 'nx-install-style';
    s.textContent =
      '.nx-install{position:fixed;left:12px;right:12px;bottom:14px;z-index:99990;' +
      'display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:18px;' +
      'background:#143B67;color:#fff;box-shadow:0 12px 30px rgba(10,30,60,.35);' +
      'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;' +
      'transform:translateY(140%);transition:transform .35s ease}' +
      '.nx-install.nx-visible{transform:translateY(0)}' +
      '.nx-install img{width:44px;height:44px;border-radius:12px;flex:0 0 auto;background:#fff}' +
      '.nx-install .nx-txt{flex:1;min-width:0}' +
      '.nx-install .nx-txt b{display:block;font-size:15px;font-weight:800;line-height:1.2}' +
      '.nx-install .nx-txt span{display:block;font-size:12.5px;opacity:.85;line-height:1.35;margin-top:2px}' +
      '.nx-install button{border:0;border-radius:12px;padding:10px 14px;font-size:14px;font-weight:800;cursor:pointer}' +
      '.nx-install .nx-oui{background:#F2A93B;color:#22364a}' +
      '.nx-install .nx-non{background:transparent;color:#cfe0f2;padding:10px 6px;font-weight:600}';
    (document.head || document.documentElement).appendChild(s);
  }

  function fermer(barre, refus) {
    if (!barre) return;
    barre.classList.remove('nx-visible');
    if (refus) noterRefus();
    setTimeout(function () { if (barre.parentNode) barre.parentNode.removeChild(barre); }, 400);
  }

  function afficher(mode) {
    if (document.querySelector('.nx-install')) return;
    styles();
    var barre = document.createElement('div');
    barre.className = 'nx-install';
    var texte = mode === 'ios'
      ? '<b>Installer Nexora</b><span>Touche Partager en bas, puis « Sur l’écran d’accueil ».</span>'
      : '<b>Installer Nexora</b><span>Accès direct depuis l’écran d’accueil, même hors connexion.</span>';
    barre.innerHTML =
      '<img src="/assets/icons/nexora-192.png" alt="">' +
      '<div class="nx-txt">' + texte + '</div>' +
      (mode === 'ios' ? '' : '<button type="button" class="nx-oui">Installer</button>') +
      '<button type="button" class="nx-non">Plus tard</button>';
    document.body.appendChild(barre);
    setTimeout(function () { barre.classList.add('nx-visible'); }, 60);

    var oui = barre.querySelector('.nx-oui');
    if (oui) {
      oui.addEventListener('click', function () {
        if (!invite) { fermer(barre, false); return; }
        invite.prompt();
        invite.userChoice.then(function (choix) {
          if (choix && choix.outcome !== 'accepted') noterRefus();
          invite = null;
          fermer(barre, false);
        }).catch(function () { fermer(barre, false); });
      });
    }
    barre.querySelector('.nx-non').addEventListener('click', function () { fermer(barre, true); });
  }

  function estIOS() {
    try {
      var ua = navigator.userAgent || '';
      return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    } catch (_e) { return false; }
  }

  function demarrer() {
    poserManifeste();
    if (dejaInstalle() || refuseRecemment()) return;

    window.addEventListener('beforeinstallprompt', function (ev) {
      ev.preventDefault();
      invite = ev;
      /* On laisse la personne arriver sur l'application avant d'inviter. */
      setTimeout(function () { afficher('android'); }, 20000);
    });

    window.addEventListener('appinstalled', function () {
      invite = null;
      var b = document.querySelector('.nx-install');
      if (b) fermer(b, false);
    });

    /* iOS ne declenche jamais beforeinstallprompt : on explique le geste. */
    if (estIOS()) setTimeout(function () { if (!dejaInstalle()) afficher('ios'); }, 25000);
  }

  /* Le fichier peut etre injecte avant ou apres le chargement de la page.
     On couvre les deux cas, et on garantit un seul demarrage. */
  var lance = false;
  function lancer() { if (lance) return; lance = true; demarrer(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', lancer);
  else lancer();
  setTimeout(lancer, 1200);
})();

/* ===================================================================
   Nexora V651 — Ouverture par lien et activation d'une carte
   Le code QR d'une carte conduit vers :
     /?code=NXAAAABBBBCCCC&m=12
   Ce bloc lit ces paramètres, ouvre l'écran de création de compte,
   et propose l'activation en une touche une fois la session ouverte.
   =================================================================== */
(function () {
  'use strict';

  var MEMOIRE = 'nexora.carte.attente.v651';
  var carte = null;

  function lireUrl() {
    try {
      var p = new URLSearchParams(window.location.search || '');
      var code = String(p.get('code') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      var mois = Number(p.get('m') || 0);
      var compte = String(p.get('compte') || '').toLowerCase();
      if (code.length >= 8) return { code: code, mois: mois, ouvrirCreation: true };
      if (compte === 'nouveau') return { code: '', mois: 0, ouvrirCreation: true };
    } catch (_e) {}
    return null;
  }

  function memoriser(c) {
    try { localStorage.setItem(MEMOIRE, JSON.stringify(c)); } catch (_e) {}
  }
  function relire() {
    try {
      var t = localStorage.getItem(MEMOIRE);
      return t ? JSON.parse(t) : null;
    } catch (_e) { return null; }
  }
  function oublier() {
    try { localStorage.removeItem(MEMOIRE); } catch (_e) {}
  }

  /* Retire les parametres de l'adresse pour ne pas les rejouer au rechargement. */
  function nettoyerUrl() {
    try {
      if (!window.history || !window.history.replaceState) return;
      var u = new URL(window.location.href);
      u.searchParams.delete('code');
      u.searchParams.delete('m');
      u.searchParams.delete('compte');
      window.history.replaceState({}, '', u.pathname + (u.search || '') + (u.hash || ''));
    } catch (_e) {}
  }

  /* ---- Ouvrir l'ecran de creation de compte ---- */
  function ouvrirCreation(essaisRestants) {
    var bouton = document.querySelector('[data-action="welcome-create"]');
    if (bouton) { bouton.click(); return true; }
    if (essaisRestants > 0) {
      setTimeout(function () { ouvrirCreation(essaisRestants - 1); }, 400);
    }
    return false;
  }

  /* ---- Barre d'activation ---- */
  function styles() {
    if (document.getElementById('nx-carte-style')) return;
    var s = document.createElement('style');
    s.id = 'nx-carte-style';
    s.textContent =
      '.nx-carte{position:fixed;left:12px;right:12px;bottom:14px;z-index:99991;' +
      'padding:14px 16px;border-radius:18px;background:#143B67;color:#fff;' +
      'box-shadow:0 12px 30px rgba(10,30,60,.35);' +
      'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;' +
      'transform:translateY(150%);transition:transform .35s ease}' +
      '.nx-carte.nx-vu{transform:translateY(0)}' +
      '.nx-carte h4{margin:0 0 4px;font-size:15px;font-weight:800}' +
      '.nx-carte p{margin:0;font-size:13px;line-height:1.45;opacity:.9}' +
      '.nx-carte .nx-code{display:block;margin:9px 0 11px;padding:9px;border-radius:11px;' +
      'background:rgba(255,255,255,.12);text-align:center;font-family:ui-monospace,Menlo,monospace;' +
      'font-size:15px;font-weight:800;letter-spacing:2px}' +
      '.nx-carte .nx-actions{display:flex;gap:9px}' +
      '.nx-carte button{flex:1;border:0;border-radius:12px;padding:11px;font-size:14px;' +
      'font-weight:800;cursor:pointer}' +
      '.nx-carte .nx-go{background:#F2A93B;color:#22364a}' +
      '.nx-carte .nx-plus{background:transparent;color:#cfe0f2;flex:0 0 auto;padding:11px 8px;font-weight:600}';
    (document.head || document.documentElement).appendChild(s);
  }

  function joliCode(c) {
    return String(c || '').replace(/(.{4})/g, '$1 ').trim();
  }

  function fermerBarre(barre) {
    if (!barre) return;
    barre.classList.remove('nx-vu');
    setTimeout(function () { if (barre.parentNode) barre.parentNode.removeChild(barre); }, 400);
  }

  function afficherBarre(etat) {
    var ancienne = document.querySelector('.nx-carte');
    if (ancienne) ancienne.parentNode.removeChild(ancienne);
    styles();

    var barre = document.createElement('div');
    barre.className = 'nx-carte';

    if (etat === 'aConnecter') {
      barre.innerHTML =
        '<h4>Carte Nexora reconnue</h4>' +
        '<p>Crée ton compte ou connecte-toi. La carte sera activée juste après.</p>' +
        '<span class="nx-code">' + joliCode(carte.code) + '</span>';
    } else if (etat === 'aActiver') {
      barre.innerHTML =
        '<h4>Activer ma carte</h4>' +
        '<p>Ton compte est ouvert. Une touche suffit pour activer l’accès.</p>' +
        '<span class="nx-code">' + joliCode(carte.code) + '</span>' +
        '<div class="nx-actions">' +
          '<button type="button" class="nx-go">Activer maintenant</button>' +
          '<button type="button" class="nx-plus">Plus tard</button>' +
        '</div>';
    }

    document.body.appendChild(barre);
    setTimeout(function () { barre.classList.add('nx-vu'); }, 60);

    var go = barre.querySelector('.nx-go');
    if (go) {
      go.addEventListener('click', function () {
        go.disabled = true;
        go.textContent = 'Activation…';
        activer(barre, go);
      });
    }
    var plus = barre.querySelector('.nx-plus');
    if (plus) plus.addEventListener('click', function () { fermerBarre(barre); });
    return barre;
  }

  function activer(barre, bouton) {
    if (typeof window.nxActivateSubscriptionCode !== 'function') {
      bouton.disabled = false;
      bouton.textContent = 'Réessayer';
      barre.querySelector('p').textContent =
        'L’activation n’est pas encore prête. Attends un instant puis réessaie.';
      return;
    }
    window.nxActivateSubscriptionCode(carte.code, carte.mois || 0, 'all')
      .then(function () {
        oublier();
        barre.querySelector('h4').textContent = 'Carte activée';
        barre.querySelector('p').textContent = 'Ton accès est ouvert. Bon travail.';
        var a = barre.querySelector('.nx-actions');
        if (a) a.parentNode.removeChild(a);
        setTimeout(function () { fermerBarre(barre); }, 4000);
        setTimeout(function () { window.location.reload(); }, 1200);
      })
      .catch(function (err) {
        bouton.disabled = false;
        bouton.textContent = 'Réessayer';
        barre.querySelector('p').textContent =
          (err && err.message) ? String(err.message) : 'Activation impossible pour le moment.';
      });
  }

  /* ---- Suivi de la session ---- */
  function sessionOuverte() {
    return new Promise(function (resolve) {
      var api = window.NexoraApp;
      if (!api || typeof api.ensureSupabaseClientReady !== 'function') { resolve(false); return; }
      api.ensureSupabaseClientReady().then(function (c) {
        if (!c || !c.auth) { resolve(false); return; }
        c.auth.getSession().then(function (r) {
          resolve(!!(r && r.data && r.data.session));
        }).catch(function () { resolve(false); });
      }).catch(function () { resolve(false); });
    });
  }

  function surveiller() {
    var essais = 0;
    var minuteur = setInterval(function () {
      essais++;
      if (essais > 120) { clearInterval(minuteur); return; }
      sessionOuverte().then(function (ouverte) {
        if (!ouverte) return;
        clearInterval(minuteur);
        afficherBarre('aActiver');
      });
    }, 1500);
  }

  function demarrer() {
    var depuisUrl = lireUrl();
    if (depuisUrl) {
      if (depuisUrl.code) { carte = { code: depuisUrl.code, mois: depuisUrl.mois }; memoriser(carte); }
      nettoyerUrl();
      setTimeout(function () { ouvrirCreation(12); }, 600);
    } else {
      carte = relire();
    }
    if (!carte || !carte.code) return;

    sessionOuverte().then(function (ouverte) {
      if (ouverte) { setTimeout(function () { afficherBarre('aActiver'); }, 1200); }
      else { setTimeout(function () { afficherBarre('aConnecter'); }, 1200); surveiller(); }
    });
  }

  var lance = false;
  function lancer() { if (lance) return; lance = true; demarrer(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', lancer);
  else lancer();
  setTimeout(lancer, 1500);
})();

/* ===================================================================
   Nexora V653 — L'écran d'accueil s'adapte à qui revient
   Première visite : « Créer mon compte » reste le bouton principal.
   Retour après une inscription : « Se connecter » passe devant.
   Les deux boutons restent toujours présents.

   Ce bloc agit une seule fois, au chargement. Il ne surveille rien
   en continu et ne corrige aucun élément derrière l'application.
   =================================================================== */
(function () {
  'use strict';
  if (window.__nxAccueilV653) return;
  window.__nxAccueilV653 = true;

  var MEMOIRE = 'nexora.compte.deja.cree.v653';

  function dejaInscrit() {
    try {
      if (localStorage.getItem(MEMOIRE) === '1') return true;
      /* Un compte Supabase memorise sur ce telephone vaut aussi preuve. */
      for (var i = 0; i < localStorage.length; i++) {
        var cle = localStorage.key(i) || '';
        if (cle.indexOf('sb-') === 0 && cle.indexOf('-auth-token') > 0) return true;
      }
    } catch (_e) {}
    return false;
  }

  function noterInscription() {
    try { localStorage.setItem(MEMOIRE, '1'); } catch (_e) {}
  }

  /* Des qu'une session s'ouvre, on retient que ce telephone a servi. */
  function suivreSession() {
    var api = window.NexoraApp;
    if (!api || typeof api.ensureSupabaseClientReady !== 'function') return;
    api.ensureSupabaseClientReady().then(function (c) {
      if (!c || !c.auth) return;
      c.auth.getSession().then(function (r) {
        if (r && r.data && r.data.session) noterInscription();
      }).catch(function () {});
      if (typeof c.auth.onAuthStateChange === 'function') {
        try {
          c.auth.onAuthStateChange(function (_e, session) {
            if (session && session.user) noterInscription();
          });
        } catch (_e) {}
      }
    }).catch(function () {});
  }

  function styles() {
    if (document.getElementById('nx-accueil-v653')) return;
    var s = document.createElement('style');
    s.id = 'nx-accueil-v653';
    /* On echange l'apparence des deux boutons sans toucher au balisage. */
    s.textContent =
      '.nx-retour .nxo-create-main-v379{order:2;min-height:48px;margin-top:10px;' +
      'border:1px solid #BCCFE5;border-radius:6px;background:#fff;color:#323942;' +
      'font-size:13.5px;font-weight:950;box-shadow:none}' +
      '.nx-retour .nxo-login-main-v379{order:1;min-height:52px;margin-top:0;border:0;' +
      'border-radius:6px;background:linear-gradient(135deg,#13457E,#3A754E);color:#fff;' +
      'font-size:15px;font-weight:1000;box-shadow:0 13px 28px rgba(19,69,126,.22)}' +
      '.nx-retour .nxo-single-account-v379{display:flex;flex-direction:column}' +
      '.nx-retour .nxo-single-head-v379{order:0}';
    (document.head || document.documentElement).appendChild(s);
  }

  function adapter() {
    var bloc = document.querySelector('.nxo-single-account-v379');
    if (!bloc) return false;
    if (bloc.classList.contains('nx-retour')) return true;

    styles();
    bloc.classList.add('nx-retour');

    /* Le titre et le texte suivent, sinon la page se contredit. */
    var titre = bloc.querySelector('.nxo-single-head-v379 h2');
    var texte = bloc.querySelector('.nxo-single-head-v379 p');
    if (titre) titre.textContent = 'Me connecter';
    if (texte) texte.textContent =
      'Retrouve ton compte avec ton adresse email et ton mot de passe. ' +
      'Ta progression est conservée.';

    var creer = bloc.querySelector('.nxo-create-main-v379');
    var entrer = bloc.querySelector('.nxo-login-main-v379');
    if (entrer) entrer.textContent = 'Se connecter';
    if (creer) {
      /* On garde la fleche d'origine si elle existe. */
      creer.textContent = 'Créer un autre compte';
    }
    return true;
  }

  function essayer(restants) {
    if (adapter()) return;
    if (restants > 0) setTimeout(function () { essayer(restants - 1); }, 400);
  }

  function demarrer() {
    suivreSession();
    if (!dejaInscrit()) return;
    essayer(10);
  }

  var lance = false;
  function lancer() { if (lance) return; lance = true; demarrer(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', lancer);
  else lancer();
  setTimeout(lancer, 1500);
})();

/* ===================================================================
   Nexora V654 — La mise à jour se fait seule
   Personne ne devrait avoir à vider les données du site.

   Ce que fait ce bloc :
   1. Il écoute l'annonce du service worker, jusqu'ici ignorée.
   2. Il contrôle la version au retour dans l'application.
   3. Il propose la mise à jour, sans jamais l'imposer pendant
      qu'on travaille.
   4. Si la personne ne répond pas, la mise à jour s'applique
      au retour suivant. Si la version est marquée « critical »,
      elle s'applique dès le premier retour.
   =================================================================== */
(function () {
  'use strict';
  if (window.__nxMajV654) return;
  window.__nxMajV654 = true;

  var CLE_VUE = 'nexora.version.vue.v654';
  var CLE_ATTENTE = 'nexora.version.attente.v654';
  var DELAI_CONTROLE = 90 * 1000;   /* au plus un controle par minute et demie */
  var dernierControle = 0;
  var barreVisible = false;

  function lire(cle) { try { return localStorage.getItem(cle) || ''; } catch (_e) { return ''; } }
  function ecrire(cle, v) { try { localStorage.setItem(cle, v); } catch (_e) {} }
  function effacer(cle) { try { localStorage.removeItem(cle); } catch (_e) {} }

  /* ---- Peut-on recharger sans faire perdre son travail ? ---- */
  function travailEnCours() {
    try {
      /* Une épreuve blanche est commencée : on ne touche à rien. */
      if (document.querySelector('[data-echrono]')) return true;
      /* Une réponse est en cours de rédaction. */
      var zones = document.querySelectorAll('textarea');
      for (var i = 0; i < zones.length; i++) {
        if (zones[i].value && zones[i].value.trim().length > 2) return true;
      }
      /* Un formulaire de compte est ouvert et rempli. */
      var champs = document.querySelectorAll('#accountModal input');
      for (var j = 0; j < champs.length; j++) {
        if (champs[j].value && champs[j].value.length > 2) return true;
      }
      /* Le clavier est actif sur un champ. */
      var actif = document.activeElement;
      if (actif && (actif.tagName === 'INPUT' || actif.tagName === 'TEXTAREA')) return true;
    } catch (_e) {}
    return false;
  }

  function appliquer() {
    var attendue = lire(CLE_ATTENTE);
    if (attendue) { ecrire(CLE_VUE, attendue); effacer(CLE_ATTENTE); }
    try { window.location.reload(); } catch (_e) {}
  }

  /* ---- Barre d'information ---- */
  function styles() {
    if (document.getElementById('nx-maj-style')) return;
    var s = document.createElement('style');
    s.id = 'nx-maj-style';
    s.textContent =
      '.nx-maj{position:fixed;left:12px;right:12px;bottom:14px;z-index:99992;' +
      'display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:16px;' +
      'background:#1F7A72;color:#fff;box-shadow:0 12px 30px rgba(10,40,40,.32);' +
      'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;' +
      'transform:translateY(150%);transition:transform .35s ease}' +
      '.nx-maj.nx-vu{transform:translateY(0)}' +
      '.nx-maj .nx-txt{flex:1;min-width:0}' +
      '.nx-maj .nx-txt b{display:block;font-size:14.5px;font-weight:800}' +
      '.nx-maj .nx-txt span{display:block;font-size:12.5px;opacity:.9;margin-top:2px;line-height:1.35}' +
      '.nx-maj button{border:0;border-radius:12px;padding:10px 14px;font-size:14px;' +
      'font-weight:800;cursor:pointer;background:#F2A93B;color:#22364a;flex:0 0 auto}';
    (document.head || document.documentElement).appendChild(s);
  }

  function proposer(version) {
    if (barreVisible || document.querySelector('.nx-maj')) return;
    barreVisible = true;
    styles();
    var barre = document.createElement('div');
    barre.className = 'nx-maj';
    barre.innerHTML =
      '<div class="nx-txt"><b>Nexora s’est amélioré</b>' +
      '<span>La nouvelle version s’installera à votre prochain retour.</span></div>' +
      '<button type="button">Maintenant</button>';
    document.body.appendChild(barre);
    setTimeout(function () { barre.classList.add('nx-vu'); }, 60);
    barre.querySelector('button').addEventListener('click', appliquer);
    /* La barre s'efface d'elle-meme : la mise a jour se fera au retour. */
    setTimeout(function () {
      barre.classList.remove('nx-vu');
      setTimeout(function () {
        if (barre.parentNode) barre.parentNode.removeChild(barre);
        barreVisible = false;
      }, 400);
    }, 12000);
  }

  /* ---- Contrôle de la version publiée ---- */
  function controler(auRetour) {
    var maintenant = Date.now();
    if (!auRetour && (maintenant - dernierControle) < DELAI_CONTROLE) return;
    dernierControle = maintenant;

    fetch('/version.json?t=' + maintenant, { cache: 'no-store' })
      .then(function (r) { return r && r.ok ? r.json() : null; })
      .then(function (info) {
        if (!info || !info.version) return;
        var publiee = String(info.version);
        var vue = lire(CLE_VUE);

        /* Première ouverture : on note simplement la version en place. */
        if (!vue) { ecrire(CLE_VUE, publiee); return; }
        if (publiee === vue) { effacer(CLE_ATTENTE); return; }

        ecrire(CLE_ATTENTE, publiee);

        /* Une correction importante s'applique dès le retour. */
        if (info.critical === true && auRetour && !travailEnCours()) { appliquer(); return; }
        /* Sinon, on applique au retour suivant, quand rien n'est en cours. */
        if (auRetour && !travailEnCours()) { appliquer(); return; }
        proposer(publiee);
      })
      .catch(function () {});
  }

  /* ---- Le service worker annonce lui-même les nouveautés ---- */
  function ecouterServiceWorker() {
    try {
      if (!navigator.serviceWorker) return;
      navigator.serviceWorker.addEventListener('message', function (ev) {
        var d = ev && ev.data;
        if (!d || d.type !== 'NEXORA_NOUVELLE_VERSION') return;
        if (d.version) ecrire(CLE_ATTENTE, String(d.version));
        if (!travailEnCours()) { appliquer(); return; }
        proposer(d.version);
      });
    } catch (_e) {}
  }

  function demarrer() {
    ecouterServiceWorker();
    controler(false);

    /* Au retour dans l'application : c'est le bon moment pour changer de version. */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) return;
      setTimeout(function () { controler(true); }, 400);
    });
    window.addEventListener('focus', function () {
      setTimeout(function () { controler(true); }, 600);
    });
  }

  var lance = false;
  function lancer() { if (lance) return; lance = true; demarrer(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', lancer);
  else lancer();
  setTimeout(lancer, 2000);
})();
