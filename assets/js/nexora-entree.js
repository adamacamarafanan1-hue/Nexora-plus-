/* V705 — Nouvel écran d'entrée de Nexora : installer d'abord, créer son compte ensuite.
   Ce module ne remplace rien : il habille la porte d'entrée existante (#welcomeGate)
   et réutilise ses vrais boutons (data-action="welcome-create" / "welcome-login")
   ainsi que le bloc d'installation déjà présent (data-nx-install-action-v468).
   Si ce fichier ne se charge pas, l'ancien écran reste affiché tel quel. */
(function () {
  'use strict';
  if (window.__nxEntreeV705) return;
  window.__nxEntreeV705 = true;

  var invite = null;
  window.addEventListener('beforeinstallprompt', function (ev) {
    try { ev.preventDefault(); } catch (_e) {}
    invite = ev;
  });
  window.addEventListener('appinstalled', function () {
    invite = null;
    try { localStorage.setItem('nxe:installee', '1'); } catch (_e) {}
    etat.installee = true;
    dessiner();
  });

  var etat = { etape: 1, aide: false, installee: false };

  function estInstallee() {
    try {
      if (window.matchMedia && (window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches)) return true;
      if (window.navigator.standalone === true) return true;
    } catch (_e) {}
    return false;
  }
  function plateforme() {
    var ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && Number(navigator.maxTouchPoints || 0) > 1)) return 'ios';
    if (/Android/i.test(ua)) return /Chrome\//.test(ua) && !/(SamsungBrowser|OPR|Opera|UCBrowser|Firefox|FBAN|FBAV|Instagram|wv\))/i.test(ua) ? 'android-chrome' : 'android-autre';
    return 'ordinateur';
  }

  function porte() { return document.getElementById('welcomeGate'); }
  function carte() { var g = porte(); return g ? g.querySelector('.welcome-card') : null; }
  function boutonNexora(action) { var g = porte(); return g ? g.querySelector('[data-action="' + action + '"]') : null; }

  var CSS = [
    '#welcomeGate .welcome-card.nxe-carte{padding:0!important;background:#EDEFF2!important;border:0!important;box-shadow:none!important;border-radius:0!important;max-width:560px!important;width:100%!important;margin:0 auto!important;overflow:visible!important}',
    '#welcomeGate .welcome-card.nxe-carte>*:not(.nxe-entree){display:none!important}',
    '.nxe-entree{font-family:inherit;color:#16324F;background:#EDEFF2;min-height:100%;display:flex;flex-direction:column}',
    '.nxe-tete{background:#16324F;color:#fff;padding:26px 24px 24px;display:flex;flex-direction:column;gap:14px}',
    '.nxe-marque{display:flex;align-items:center;gap:12px}',
    '.nxe-mono{width:40px;height:40px;border:2px solid #fff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-weight:700;font-size:16px}',
    '.nxe-nom{font-family:Georgia,serif;font-weight:700;font-size:24px}',
    '.nxe-tete h1{margin:0;font-family:Georgia,serif;font-weight:700;font-size:28px;line-height:1.15;color:#fff}',
    '.nxe-tete p{margin:0;font-size:16px;line-height:1.45;color:#D6DEE8}',
    '.nxe-ok{display:flex;align-items:center;gap:10px;background:#0F243A;border-radius:10px;padding:10px 12px;font-size:15px;font-weight:600}',
    '.nxe-corps{padding:20px 24px 0;display:flex;flex-direction:column;gap:14px}',
    '.nxe-etiq{font-size:14px;font-weight:700;color:#4A5A6E}',
    '#welcomeGate .nxe-puces{display:flex!important;flex-direction:row!important;flex-wrap:wrap!important;gap:8px!important;margin:0!important;padding:0!important;list-style:none!important;grid-template-columns:none!important}',
    '#welcomeGate .nxe-puces li{display:inline-block!important;width:auto!important;flex:0 0 auto!important;margin:0!important;background:#fff;border:1px solid #CBD3DD;border-radius:999px;padding:6px 11px;font-size:13.5px;font-weight:600;color:#16324F}',
    '#welcomeGate .nxe-puces li::before,#welcomeGate .nxe-puces li::after{content:none!important;display:none!important}',
    '#accountModal [data-action="create-account"]{color:#fff!important}',
    '.nxe-prix{margin:0;font-size:15px;color:#4A5A6E}.nxe-prix b{color:#16324F}',
    '.nxe-etape{display:flex;align-items:center;gap:10px;font-size:16px;font-weight:700}',
    '.nxe-num{width:28px;height:28px;flex:none;border-radius:50%;background:#16324F;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px}',
    '.nxe-num.nxe-vide{background:transparent;border:2px solid #8C98A8;color:#4A5A6E;box-sizing:border-box}',
    '.nxe-suite{color:#4A5A6E;font-weight:400;font-size:15px}',
    '.nxe-txt{margin:0;font-size:15px;line-height:1.45;color:#4A5A6E}',
    '.nxe-btn{min-height:56px;width:100%;border:0;border-radius:12px;font-family:inherit;font-size:18px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:10px;cursor:pointer}',
    '.nxe-ocre{background:#C9861B;color:#0F243A}.nxe-ardoise{background:#16324F;color:#fff}',
    '.nxe-ligne{min-height:52px;width:100%;border:1.5px solid #16324F;border-radius:12px;background:#fff;color:#16324F;font-family:inherit;font-size:17px;font-weight:700;cursor:pointer}',
    '.nxe-aide{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px}',
    '.nxe-aide li{display:flex;gap:12px;align-items:center;background:#fff;border:1px solid #CBD3DD;border-radius:12px;padding:12px 14px;font-size:15.5px;line-height:1.4}',
    '.nxe-bas{margin-top:auto;padding:20px 24px 28px;display:flex;flex-direction:column;align-items:center;gap:12px;font-size:15px}',
    '.nxe-lien{border:0;background:none;color:#16324F;font-family:inherit;font-size:15px;font-weight:700;text-decoration:underline;cursor:pointer;padding:6px}',
    '.nxe-gris{margin:0;color:#4A5A6E}'
  ].join('\n');

  function styles() {
    if (document.getElementById('nxeStyleV705')) return;
    var s = document.createElement('style');
    s.id = 'nxeStyleV705';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  var ICONE_INSTALLER = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path></svg>';
  var ICONE_OK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9861B" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>';

  function etapesAide() {
    var pf = plateforme();
    if (pf === 'ios') return ['Ouvrez Nexora dans <b>Safari</b>.', 'Touchez <b>Partager</b>, en bas de l’écran.', 'Choisissez <b>Sur l’écran d’accueil</b>, puis <b>Ajouter</b>.'];
    if (pf === 'android-autre') return ['Ouvrez Nexora dans <b>Google Chrome</b> : nexora-plus-beta.vercel.app', 'Touchez les <b>⋮</b> en haut à droite.', 'Touchez <b>Installer l’application</b> ou <b>Ajouter à l’écran d’accueil</b>.'];
    if (pf === 'android-chrome') return ['Touchez les <b>⋮</b> en haut à droite de Chrome.', 'Touchez <b>Installer l’application</b> (ou <b>Ajouter à l’écran d’accueil</b>).', 'Confirmez avec <b>Installer</b>.'];
    return ['Dans Chrome ou Edge, cliquez sur l’icône d’installation, à droite de la barre d’adresse.', 'Ou ouvrez le menu ⋮, puis <b>Installer Nexora</b>.', 'Sur téléphone, c’est encore plus simple : ouvrez Nexora dans Chrome.'];
  }

  function html() {
    var installee = etat.installee || estInstallee();
    var tete = '<div class="nxe-tete"><div class="nxe-marque"><span class="nxe-mono" aria-hidden="true">NX</span><span class="nxe-nom">Nexora</span></div>';
    if (installee || etat.etape === 2) {
      tete += (installee ? '<div class="nxe-ok">' + ICONE_OK + '<span>Nexora est installée sur votre téléphone</span></div>' : '') +
        '<h1>Créez votre compte</h1><p>Votre compte garde votre progression et ouvre les cours, les sujets et la Bibliothèque Livria.</p></div>';
      return tete +
        '<div class="nxe-corps"><div class="nxe-etape"><span class="nxe-num">2</span><span>Votre compte Nexora</span></div>' +
        '<button type="button" class="nxe-btn nxe-ardoise" data-nxe="creer">Créer mon compte</button>' +
        '<button type="button" class="nxe-ligne" data-nxe="connexion">J’ai déjà un compte</button></div>' +
        '<div class="nxe-bas">' + (installee ? '' : '<button type="button" class="nxe-lien" data-nxe="retour">Revenir à l’installation</button>') + '</div>';
    }
    tete += '<h1>Réussissez le Brevet et le BAC avec le programme guinéen</h1><p>Des cours de la maternelle à la Terminale, et des formations pour les professionnels.</p></div>';
    var aide = etat.aide ? '<ol class="nxe-aide">' + etapesAide().map(function (t, i) { return '<li><span class="nxe-num">' + (i + 1) + '</span><span>' + t + '</span></li>'; }).join('') + '</ol>' +
      '<button type="button" class="nxe-btn nxe-ocre" data-nxe="fait">J’ai installé Nexora</button>' : '';
    return tete +
      '<div class="nxe-corps">' +
        '<div class="nxe-etiq">Inclus dans l’abonnement</div>' +
        '<ul class="nxe-puces"><li>Tous les niveaux</li><li>Sujets Brevet et BAC</li><li>22 formations pro</li><li>Bibliothèque Livria</li></ul>' +
        '<p class="nxe-prix">À partir de <b>60 000 GNF par mois</b></p>' +
      '</div>' +
      '<div class="nxe-corps">' +
        '<div class="nxe-etape"><span class="nxe-num">1</span><span>Installez Nexora sur votre téléphone</span></div>' +
        (etat.aide ? aide :
          '<p class="nxe-txt">Nexora s’ouvre ensuite comme une application, depuis votre écran d’accueil. Aucune boutique à télécharger.</p>' +
          '<button type="button" class="nxe-btn nxe-ocre" data-nxe="installer">' + ICONE_INSTALLER + 'Installer Nexora</button>') +
        '<div class="nxe-etape"><span class="nxe-num nxe-vide">2</span><span class="nxe-suite">Ensuite : créez votre compte</span></div>' +
      '</div>' +
      '<div class="nxe-bas">' +
        '<button type="button" class="nxe-lien" data-nxe="navigateur">Continuer dans le navigateur</button>' +
        '<p class="nxe-gris">Déjà inscrit ? <button type="button" class="nxe-lien" data-nxe="connexion">Se connecter</button></p>' +
      '</div>';
  }

  function dessiner() {
    var c = carte(); if (!c) return;
    var b = c.querySelector('.nxe-entree');
    if (!b) {
      b = document.createElement('div');
      b.className = 'nxe-entree';
      b.addEventListener('click', clic);
      c.insertBefore(b, c.firstChild);
    }
    c.classList.add('nxe-carte');
    b.innerHTML = html();
  }

  function installer() {
    var inv0 = invite || window.__nxeInvite || null;
    if (inv0) {
      var inv = inv0; invite = null; window.__nxeInvite = null;
      Promise.resolve().then(function () { return inv.prompt(); })
        .then(function () { return inv.userChoice; })
        .then(function (choix) {
          if (choix && choix.outcome === 'accepted') { etat.installee = true; }
          else { invite = inv; window.__nxeInvite = inv; }
          dessiner();
        })
        .catch(function () { invite = null; window.__nxeInvite = null; etat.aide = true; dessiner(); });
      return;
    }
    /* Pas d'invitation du navigateur (iPhone, autre navigateur, ou déjà proposée) :
       on montre les gestes à faire, adaptés au téléphone. */
    etat.aide = true; dessiner();
  }

  function clic(ev) {
    var t = ev.target.closest ? ev.target.closest('[data-nxe]') : null;
    if (!t) return;
    var a = t.getAttribute('data-nxe');
    if (a === 'installer') installer();
    else if (a === 'fait' || a === 'navigateur') { etat.etape = 2; etat.aide = false; dessiner(); }
    else if (a === 'retour') { etat.etape = 1; dessiner(); }
    else if (a === 'creer') { var b = boutonNexora('welcome-create'); if (b) b.click(); }
    else if (a === 'connexion') { var l = boutonNexora('welcome-login'); if (l) l.click(); }
  }

  function veiller() {
    var g = porte();
    if (!g) return;
    styles();
    if (!g.querySelector('.nxe-entree')) dessiner();
    window.__nxEntreeV705Pret = true;
    var m = document.getElementById('nxeMasque'); if (m) m.remove();
  }

  try { etat.installee = localStorage.getItem('nxe:installee') === '1' && estInstallee(); } catch (_e) {}
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', veiller); else veiller();
  setInterval(veiller, 3000);
})();
