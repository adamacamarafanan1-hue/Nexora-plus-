/* ═══════════════════════════════════════════════════════════════════════════
   V543 · MES RÉGLAGES

   Charge par le service worker, sans toucher a index.html.
   Ajoute un bouton discret en haut de l'ecran Profil, qui ouvre un panneau :
     - le compte (nom, adresse, changement de mot de passe)
     - l'abonnement et sa date de fin
     - « Vider et recharger Nexora » — le geste que l'on explique aujourd'hui
       au telephone a chaque personne bloquee
     - un lien vers le service client

   Tout est enveloppe : si quoi que ce soit echoue, Nexora continue de
   fonctionner normalement et le bouton n'apparait simplement pas.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__nxReglagesV543) return;
  window.__nxReglagesV543 = true;

  var WHATSAPP = '';   /* a renseigner : ex. '224620000000' */

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
      'padding:0 15px;border:1px solid var(--nx-cendre-2,#C6CBD2);border-radius:10px;background:#fff;' +
      'color:var(--nx-ardoise,#16324F);font:inherit;font-size:15px;font-weight:800;text-align:left;cursor:pointer}' +
      '.nx-reg-ouvrir-v543 span{margin-left:auto;font-weight:400;font-size:12.5px;color:var(--nx-cendre-6,#5F656C)}' +
      /* V543.1 : l'ecran Profil n'est pas atteignable dans l'interface actuelle.
         On pose donc un bouton flottant, visible partout, juste au-dessus de la
         barre du bas. */
      '.nx-reg-flottant-v543{position:fixed;right:14px;bottom:calc(78px + env(safe-area-inset-bottom,0px));' +
      'z-index:2147481350;display:grid;place-items:center;width:48px;height:48px;border:1px solid var(--nx-cendre-2,#C6CBD2);' +
      'border-radius:50%;background:#fff;color:var(--nx-ardoise,#16324F);font-size:20px;line-height:1;cursor:pointer;' +
      'box-shadow:0 3px 12px rgba(22,50,79,.18)}' +
      '[data-theme="dark"] .nx-reg-flottant-v543{background:#171A1E;border-color:#2A2F36}' +
      '.nx-reg-v543{position:fixed;inset:0;z-index:2147481400;overflow-y:auto;background:var(--nx-cendre-0,#EDEFF2);' +
      'color:#21252B;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
      '.nx-reg-v543[hidden]{display:none}' +
      '.nx-reg-tete-v543{position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;gap:12px;' +
      'padding:16px 16px calc(16px + env(safe-area-inset-top,0px));background:var(--nx-ardoise,#16324F);color:var(--nx-craie,#EEF2F6)}' +
      '.nx-reg-tete-v543 h2{margin:0;font-size:19px;font-weight:800}' +
      '.nx-reg-tete-v543 button{width:42px;height:42px;border:0;border-radius:8px;background:rgba(238,242,246,.16);' +
      'color:#fff;font:inherit;font-size:17px;cursor:pointer}' +
      '.nx-reg-corps-v543{max-width:60ch;margin:0 auto;padding:18px 16px calc(30px + env(safe-area-inset-bottom,0px))}' +
      '.nx-reg-bloc-v543{margin:0 0 14px;padding:15px 16px;border:1px solid var(--nx-cendre-2,#C6CBD2);' +
      'border-radius:10px;background:#fff}' +
      '.nx-reg-bloc-v543 h3{margin:0 0 11px;color:var(--nx-ardoise,#16324F);font-size:11px;font-weight:800;' +
      'letter-spacing:.15em;text-transform:uppercase}' +
      '.nx-reg-ligne-v543{display:flex;justify-content:space-between;gap:12px;padding:7px 0;font-size:14.5px;line-height:1.5}' +
      '.nx-reg-ligne-v543 b{flex:0 0 auto;color:var(--nx-cendre-6,#5F656C);font-weight:600}' +
      '.nx-reg-ligne-v543 span{text-align:right;font-weight:700;word-break:break-word}' +
      '.nx-reg-action-v543{display:block;width:100%;min-height:50px;margin:9px 0 0;padding:0 15px;' +
      'border:1px solid var(--nx-cendre-2,#C6CBD2);border-radius:9px;background:var(--nx-cendre-0,#EDEFF2);' +
      'color:var(--nx-ardoise,#16324F);font:inherit;font-size:14.5px;font-weight:800;text-align:left;cursor:pointer}' +
      '.nx-reg-action-v543.principal{background:var(--nx-ardoise,#16324F);border-color:var(--nx-ardoise,#16324F);color:var(--nx-craie,#EEF2F6)}' +
      '.nx-reg-note-v543{margin:7px 0 0;color:var(--nx-cendre-6,#5F656C);font-size:12.5px;line-height:1.55}' +
      '.nx-reg-etat-v543{margin:9px 0 0;font-size:13.5px;font-weight:700}' +
      '[data-theme="dark"] .nx-reg-v543{background:#0F1216;color:#CDD1D7}' +
      '[data-theme="dark"] .nx-reg-bloc-v543,[data-theme="dark"] .nx-reg-ouvrir-v543{background:#171A1E;border-color:#2A2F36;color:#DDE4ED}';
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
    p.setAttribute('aria-modal', 'true');
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
    var p = panneau();
    var corps = p.querySelector('[data-reg-corps]');

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
    } catch (_e) { window.nxLog && window.nxLog(_e); }

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
        (fin ? '<div class="nx-reg-ligne-v543"><b>Jusqu’au</b><span>' + esc(fin) + '</span></div>' : '') +
        '<p class="nx-reg-note-v543">' +
          (actif
            ? 'Tes cours restent ouverts jusqu’à cette date.'
            : 'Pour ouvrir les cours, choisis une formule depuis l’Académie.') +
        '</p>' +
      '</section>' +

      '<section class="nx-reg-bloc-v543"><h3>Un problème ?</h3>' +
        '<button type="button" class="nx-reg-action-v543 principal" data-reg-action="vider">Vider et recharger Nexora</button>' +
        '<p class="nx-reg-note-v543">À faire si une page reste bloquée ou si tu ne vois pas les nouveautés. ' +
        'Tes cours et ton abonnement ne sont pas effacés — tu auras peut-être à te reconnecter.</p>' +
        '<p class="nx-reg-etat-v543" data-reg-etat-vider></p>' +
        (WHATSAPP
          ? '<a class="nx-reg-action-v543" style="text-decoration:none;line-height:50px" ' +
            'href="https://wa.me/' + esc(WHATSAPP) + '" target="_blank" rel="noopener">Écrire au service Nexora</a>'
          : '') +
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
      if (etat) etat.textContent = 'Lien envoyé à ' + adresse + '. Regarde ta boîte mail.';
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
    } catch (err) { window.nxLog && window.nxLog(err); }
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

  /* Le bouton d'entree, pose en haut de l'ecran Profil des qu'il est monte. */
  function poserBouton() {
    try {
      styles();

      /* 1. Si l'ecran Profil est monte, on s'y insere : c'est sa place naturelle. */
      var hote = document.querySelector('[data-screen-panel="profile"] [data-profile]');
      if (hote && hote.parentNode && !document.getElementById('nxReglagesBoutonV543')) {
        var b = document.createElement('button');
        b.id = 'nxReglagesBoutonV543';
        b.type = 'button';
        b.className = 'nx-reg-ouvrir-v543';
        b.innerHTML = '⚙️ Mes réglages <span>compte, abonnement, aide</span>';
        b.addEventListener('click', ouvrir);
        hote.parentNode.insertBefore(b, hote);
      }

      /* 2. Bouton flottant, toujours disponible — l'ecran Profil n'etant pas
            atteignable depuis la navigation actuelle. */
      if (!document.getElementById('nxReglagesFlottantV543')) {
        var f = document.createElement('button');
        f.id = 'nxReglagesFlottantV543';
        f.type = 'button';
        f.className = 'nx-reg-flottant-v543';
        f.setAttribute('aria-label', 'Mes réglages');
        f.title = 'Mes réglages';
        f.textContent = '⚙️';
        f.addEventListener('click', ouvrir);
        document.body.appendChild(f);
      }
    } catch (err) { window.nxLog && window.nxLog(err); }
  }

  document.addEventListener('nx-screen-change', function () { setTimeout(poserBouton, 300); });
  window.addEventListener('nexora:remote-ready', function () { setTimeout(poserBouton, 600); });
  setTimeout(poserBouton, 1500);
  setInterval(poserBouton, 4000);
})();
