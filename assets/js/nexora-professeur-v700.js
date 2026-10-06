/* =====================================================================
   NEXORA V700 — Professeur Nexora
   L'élève photographie un exercice : Nexora l'explique étape par étape.
   - 3 essais gratuits, puis 10 questions par jour pour les abonnés
   - « Explique encore » : jusqu'à 3 explications par exercice
   Serveur : /api/professeur (clé IA uniquement côté serveur).
   ===================================================================== */
(function () {
  'use strict';
  if (window.NexoraProfesseur) return;

  var API = '/api/professeur';
  var CLE_PREF = 'nx_professeur_pref_v700';
  var MATIERES = [
    ['maths', 'Maths'], ['physique', 'Physique'], ['chimie', 'Chimie'], ['svt', 'SVT'],
    ['francais', 'Français'], ['anglais', 'Anglais'], ['histoire', 'Histoire'], ['geographie', 'Géographie'],
    ['philo', 'Philo'], ['eco', 'Économie'], ['ecm', 'ECM'], ['autre', 'Autre']
  ];
  var CLASSES = ['Maternelle', '1ère année', '2ème année', '3ème année', '4ème année', '5ème année', '6ème année',
    '7ème année', '8ème année', '9ème année', '10ème année', '11ème année', '12ème année', 'Terminale', 'Université', 'Adulte / pro'];
  var CODES_CLASSE = { maternelle: 'Maternelle', '1': '1ère année', '2': '2ème année', '3': '3ème année', '4': '4ème année', '5': '5ème année', '6': '6ème année',
    '7': '7ème année', '8': '8ème année', '9': '9ème année', '10': '10ème année', '11': '11ème année', '12': '12ème année', terminale: 'Terminale' };

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lire(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function ecrire(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ---------- session ---------- */
  function jetonLocal() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/^sb-.+-auth-token$/.test(k)) {
          var v = JSON.parse(localStorage.getItem(k) || 'null');
          var s = v && (v.currentSession || v);
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
        return c.auth.getSession().then(function (r) {
          var s = r && r.data && r.data.session;
          return (s && s.access_token) || jetonLocal();
        }).catch(jetonLocal);
      }
    } catch (e) {}
    return Promise.resolve(jetonLocal());
  }
  function appel(methode, corps) {
    return jeton().then(function (t) {
      if (!t) return { status: 401, data: { success: false, code: 'connexion', message: 'Connecte-toi à Nexora pour utiliser le Professeur.' } };
      return fetch(API, {
        method: methode, cache: 'no-store', credentials: 'same-origin',
        headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' },
        body: corps ? JSON.stringify(corps) : undefined
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) { return { status: r.status, data: d || {} }; });
      });
    }).catch(function () {
      return { status: 0, data: { success: false, code: 'reseau', message: 'Pas de connexion internet. Vérifie ton réseau et réessaie.' } };
    });
  }

  /* ---------- image : réduite avant l'envoi (moins de données mobiles) ---------- */
  function preparerImage(fichier) {
    return new Promise(function (ok, ko) {
      if (!fichier || !/^image\//.test(fichier.type || 'image/')) return ko(new Error('type'));
      var url = URL.createObjectURL(fichier);
      var img = new Image();
      img.onload = function () {
        var max = 1600, w = img.naturalWidth, h = img.naturalHeight;
        var k = Math.min(1, max / Math.max(w, h));
        var cv = document.createElement('canvas');
        cv.width = Math.round(w * k); cv.height = Math.round(h * k);
        var cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
        cx.drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        var dataUrl = cv.toDataURL('image/jpeg', 0.82);
        ok({ apercu: dataUrl, type: 'image/jpeg', data: dataUrl.split(',')[1] });
      };
      img.onerror = function () { URL.revokeObjectURL(url); ko(new Error('lecture')); };
      img.src = url;
    });
  }

  /* ---------- rendu de la réponse (texte sûr, mise en forme légère) ---------- */
  function rendre(t) {
    var lignes = String(t || '').replace(/\r/g, '').split('\n');
    var html = '', liste = null;
    function fermerListe() { if (liste) { html += '</' + liste + '>'; liste = null; } }
    function enLigne(s) {
      return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    }
    lignes.forEach(function (l) {
      var s = l.trim();
      if (!s) { fermerListe(); return; }
      var m;
      if ((m = s.match(/^#{1,4}\s+(.*)$/))) { fermerListe(); html += '<h4>' + enLigne(m[1]) + '</h4>'; return; }
      if ((m = s.match(/^(\d+)[.)]\s+(.*)$/))) {
        if (liste !== 'ol') { fermerListe(); html += '<ol>'; liste = 'ol'; }
        html += '<li value="' + m[1] + '">' + enLigne(m[2]) + '</li>'; return;
      }
      if ((m = s.match(/^[-•*]\s+(.*)$/))) {
        if (liste !== 'ul') { fermerListe(); html += '<ul>'; liste = 'ul'; }
        html += '<li>' + enLigne(m[1]) + '</li>'; return;
      }
      fermerListe();
      if (/^\*\*[^*]+\*\*\s*:?$/.test(s)) { html += '<h4>' + enLigne(s.replace(/:$/, '')) + '</h4>'; return; }
      html += '<p>' + enLigne(s) + '</p>';
    });
    fermerListe();
    return html;
  }

  /* ---------- styles ---------- */
  function styles() {
    if (document.getElementById('nxProfStyleV700')) return;
    var st = document.createElement('style');
    st.id = 'nxProfStyleV700';
    st.textContent =
      '.nxp-fond{position:fixed;inset:0;z-index:2147482900;background:rgba(10,20,32,.55);display:flex;align-items:flex-end;justify-content:center;animation:nxpf .18s ease-out}' +
      '@media(min-width:700px){.nxp-fond{align-items:center;padding:16px}}' +
      '.nxp-boite{width:100%;max-width:640px;height:94vh;height:94dvh;display:flex;flex-direction:column;background:#f6f8fb;color:#1d2733;border-radius:18px 18px 0 0;box-shadow:0 24px 60px rgba(0,0,0,.3);font:15px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;overflow:hidden;animation:nxpm .22s ease-out}' +
      '@media(min-width:700px){.nxp-boite{border-radius:18px;height:88vh}}' +
      '.nxp-tete{display:flex;align-items:center;gap:10px;padding:14px 16px;background:var(--nx-ardoise,#16324F);color:#fff}' +
      '.nxp-tete .ic{width:38px;height:38px;border-radius:11px;background:rgba(255,255,255,.14);display:grid;place-items:center;font-size:21px;flex:0 0 auto}' +
      '.nxp-tete b{display:block;font-size:17px}.nxp-tete small{display:block;opacity:.82;font-size:12.5px}' +
      '.nxp-x{margin-left:auto;border:0;background:rgba(255,255,255,.12);color:#fff;width:36px;height:36px;border-radius:10px;font-size:22px;line-height:1;cursor:pointer}' +
      '.nxp-corps{flex:1;overflow:auto;padding:14px 14px 18px;-webkit-overflow-scrolling:touch}' +
      '.nxp-quota{font-size:13px;color:#4a5562;background:#fff;border:1px solid #e1e7ee;border-radius:10px;padding:8px 11px;margin:0 0 12px}' +
      '.nxp-quota b{color:var(--nx-ardoise,#16324F)}' +
      '.nxp-photo{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:0 0 12px}' +
      '.nxp-btn{display:flex;align-items:center;justify-content:center;gap:8px;border:1px solid #cfd8e2;background:#fff;color:var(--nx-ardoise,#16324F);border-radius:12px;padding:13px 10px;font:inherit;font-weight:600;cursor:pointer;text-align:center}' +
      '.nxp-btn.principal{background:var(--nx-ocre,#C46A12);border-color:var(--nx-ocre,#C46A12);color:#fff}' +
      '.nxp-btn.grand{grid-column:1/-1;padding:18px 12px;font-size:16.5px}' +
      '.nxp-btn[disabled]{opacity:.5;cursor:not-allowed}' +
      '.nxp-btn:focus-visible,.nxp-puce:focus-visible,.nxp-x:focus-visible{outline:3px solid #6AA2E3;outline-offset:2px}' +
      '.nxp-apercu{position:relative;margin:0 0 12px;border-radius:12px;overflow:hidden;border:1px solid #dfe5ec;background:#fff}' +
      '.nxp-apercu img{display:block;width:100%;max-height:260px;object-fit:contain;background:#fff}' +
      '.nxp-apercu button{position:absolute;top:8px;right:8px;border:0;background:rgba(10,20,32,.7);color:#fff;border-radius:9px;padding:6px 10px;font:inherit;font-size:13px;cursor:pointer}' +
      '.nxp-lab{font-size:12.5px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#6b7580;margin:4px 0 6px}' +
      '.nxp-puces{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 12px}' +
      '.nxp-puce{border:1px solid #cfd8e2;background:#fff;border-radius:999px;padding:7px 12px;font:inherit;font-size:13.5px;cursor:pointer;color:var(--nx-ardoise,#16324F)}' +
      '.nxp-puce[aria-pressed="true"]{background:var(--nx-ardoise,#16324F);border-color:var(--nx-ardoise,#16324F);color:#fff}' +
      '.nxp-sel,.nxp-txt{width:100%;box-sizing:border-box;border:1px solid #cfd8e2;border-radius:11px;background:#fff;padding:11px 12px;font:inherit;color:inherit;margin:0 0 12px}' +
      '.nxp-txt{min-height:74px;resize:vertical}' +
      '.nxp-attente{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid #e1e7ee;border-radius:12px;padding:14px;margin:12px 0}' +
      '.nxp-rond{width:22px;height:22px;border-radius:50%;border:3px solid #dbe3ec;border-top-color:var(--nx-ocre,#C46A12);animation:nxpr 0.9s linear infinite;flex:0 0 auto}' +
      '.nxp-msg{border-radius:14px;padding:12px 14px;margin:0 0 12px}' +
      '.nxp-msg.eleve{background:#e8eef5;margin-left:18%}' +
      '.nxp-msg.eleve img{display:block;max-width:100%;max-height:160px;border-radius:8px;margin:0 0 6px}' +
      '.nxp-msg.prof{background:#fff;border:1px solid #e1e7ee;box-shadow:0 2px 10px rgba(16,40,70,.05)}' +
      '.nxp-msg.prof .qui{font-size:12px;font-weight:700;color:var(--nx-ocre,#C46A12);text-transform:uppercase;letter-spacing:.04em;margin:0 0 4px}' +
      '.nxp-msg h4{margin:10px 0 4px;font-size:15px;color:var(--nx-ardoise,#16324F)}' +
      '.nxp-msg p{margin:0 0 8px}.nxp-msg ol,.nxp-msg ul{margin:0 0 8px;padding-left:22px}.nxp-msg li{margin:0 0 4px}' +
      '.nxp-suite{display:grid;grid-template-columns:1fr;gap:8px;margin:4px 0 8px}' +
      '.nxp-erreur{background:#fff4ec;border:1px solid #f3c9a6;color:#7a3b0b;border-radius:12px;padding:12px 14px;margin:12px 0}' +
      '.nxp-erreur .nxp-btn{margin-top:10px;width:100%}' +
      '.nxp-note{font-size:12px;color:#6b7580;margin:8px 0 0;text-align:center}' +
      '.nxp-carte{display:flex;align-items:center;gap:12px;margin:0 0 14px;padding:13px;border-radius:14px;background:linear-gradient(135deg,#16324F,#24507c);color:#fff;font:14px/1.4 system-ui,-apple-system,Roboto,Arial,sans-serif;border:0;width:100%;text-align:left;cursor:pointer;box-shadow:0 8px 22px rgba(22,50,79,.22)}' +
      '.nxp-carte .ic{width:46px;height:46px;border-radius:13px;background:rgba(255,255,255,.14);display:grid;place-items:center;font-size:25px;flex:0 0 auto}' +
      '.nxp-carte b{display:block;font-size:15.5px}.nxp-carte small{display:block;opacity:.85;font-size:12.5px}' +
      '.nxp-carte .go{margin-left:auto;flex:0 0 auto;background:var(--nx-ocre,#C46A12);border-radius:10px;padding:9px 12px;font-weight:700}' +
      '@keyframes nxpf{from{opacity:0}to{opacity:1}}@keyframes nxpm{from{transform:translateY(18px);opacity:.4}to{transform:none;opacity:1}}@keyframes nxpr{to{transform:rotate(360deg)}}' +
      '@media(prefers-reduced-motion:reduce){.nxp-fond,.nxp-boite{animation:none}.nxp-rond{animation-duration:3s}}';
    document.head.appendChild(st);
  }

  /* ---------- état de la fenêtre ---------- */
  var F = null; /* { fond, corps, image, matiere, classe, fil: [], id, suitesRestantes, occupe } */

  function classeParDefaut() {
    var pref = lire(CLE_PREF) || {};
    if (pref.classe) return pref.classe;
    var b = lire('nx_bienvenue_choix_v695') || {};
    return CODES_CLASSE[String(b.classe || '').toLowerCase()] || '';
  }

  function fermer() {
    if (!F) return;
    document.removeEventListener('keydown', F.clavier, true);
    F.fond.remove();
    document.documentElement.style.overflow = F.overflow || '';
    F = null;
  }

  function ouvrir() {
    styles();
    fermer();
    var pref = lire(CLE_PREF) || {};
    var fond = document.createElement('div');
    fond.className = 'nxp-fond';
    fond.innerHTML =
      '<div class="nxp-boite" role="dialog" aria-modal="true" aria-labelledby="nxpTitre">' +
        '<div class="nxp-tete"><span class="ic" aria-hidden="true">🎓</span><span><b id="nxpTitre">Professeur Nexora</b><small>Photographie ton exercice, je t’explique.</small></span>' +
        '<button type="button" class="nxp-x" data-nxp="fermer" aria-label="Fermer">×</button></div>' +
        '<div class="nxp-corps" data-nxp-corps></div>' +
      '</div>';
    var overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    function clavier(e) { if (e.key === 'Escape') { e.stopPropagation(); fermer(); } }
    document.addEventListener('keydown', clavier, true);
    fond.addEventListener('click', function (e) { if (e.target === fond) fermer(); });
    document.body.appendChild(fond);
    F = { fond: fond, corps: fond.querySelector('[data-nxp-corps]'), clavier: clavier, overflow: overflow,
      image: null, matiere: pref.matiere || '', classe: classeParDefaut(), fil: [], id: '', suitesRestantes: 0, occupe: false, etat: null };
    fond.addEventListener('click', clic);
    fond.addEventListener('change', changement);
    ecranQuestion();
    chargerEtat();
    setTimeout(function () { var b = fond.querySelector('[data-nxp="camera"]'); if (b) try { b.focus(); } catch (e) {} }, 80);
  }

  function texteQuota(etat) {
    if (!etat) return '';
    if (etat.abonne) return 'Abonné : il te reste <b>' + etat.restant_jour + ' question' + (etat.restant_jour > 1 ? 's' : '') + '</b> aujourd’hui (sur ' + etat.limite_jour + ').';
    if (etat.essais_restants > 0) return 'Essai gratuit : il te reste <b>' + etat.essais_restants + ' question' + (etat.essais_restants > 1 ? 's' : '') + '</b> offerte' + (etat.essais_restants > 1 ? 's' : '') + '.';
    return 'Tes essais gratuits sont terminés. <b>Abonne-toi</b> pour continuer avec le Professeur.';
  }
  function majQuota() {
    if (!F) return;
    var q = F.fond.querySelector('[data-nxp-quota]');
    if (!q) return;
    var t = texteQuota(F.etat);
    q.innerHTML = t; q.hidden = !t;
  }
  function chargerEtat() {
    appel('GET').then(function (r) {
      if (!F) return;
      if (r.data && r.data.etat) { F.etat = r.data.etat; majQuota(); }
      else if (r.status === 401) { var q = F.fond.querySelector('[data-nxp-quota]'); if (q) { q.innerHTML = 'Connecte-toi à ton compte Nexora pour utiliser le Professeur.'; q.hidden = false; } }
    });
  }

  function ecranQuestion() {
    if (!F) return;
    F.fil = []; F.id = ''; F.suitesRestantes = 0;
    var puces = MATIERES.map(function (m) {
      return '<button type="button" class="nxp-puce" data-nxp-matiere="' + m[0] + '" aria-pressed="' + (F.matiere === m[0]) + '">' + esc(m[1]) + '</button>';
    }).join('');
    var options = '<option value="">Ma classe…</option>' + CLASSES.map(function (c) {
      return '<option' + (F.classe === c ? ' selected' : '') + '>' + esc(c) + '</option>';
    }).join('');
    F.corps.innerHTML =
      '<div class="nxp-quota" data-nxp-quota hidden></div>' +
      '<div data-nxp-zone-photo></div>' +
      '<input type="file" accept="image/*" capture="environment" data-nxp-fichier="camera" hidden>' +
      '<input type="file" accept="image/*" data-nxp-fichier="galerie" hidden>' +
      '<div class="nxp-lab">Matière</div><div class="nxp-puces" role="group" aria-label="Matière">' + puces + '</div>' +
      '<div class="nxp-lab"><label for="nxpClasse">Classe</label></div><select id="nxpClasse" class="nxp-sel" data-nxp-classe>' + options + '</select>' +
      '<div class="nxp-lab"><label for="nxpQ">Ta question (facultatif)</label></div>' +
      '<textarea id="nxpQ" class="nxp-txt" data-nxp-question maxlength="1500" placeholder="Ex. : Je ne comprends pas la question 2. Ou écris ton exercice ici si tu n’as pas de photo."></textarea>' +
      '<button type="button" class="nxp-btn principal grand" data-nxp="envoyer" style="width:100%">Expliquer mon exercice</button>' +
      '<p class="nxp-note">Le Professeur t’explique la méthode pour que tu saches refaire seul.</p>' +
      '<div data-nxp-sortie></div>';
    zonePhoto();
    majQuota();
  }

  function zonePhoto() {
    var z = F && F.fond.querySelector('[data-nxp-zone-photo]');
    if (!z) return;
    if (F.image) {
      z.innerHTML = '<div class="nxp-apercu"><img alt="Photo de ton exercice" src="' + F.image.apercu + '"><button type="button" data-nxp="retirer">Changer la photo</button></div>';
    } else {
      z.innerHTML = '<div class="nxp-photo">' +
        '<button type="button" class="nxp-btn principal grand" data-nxp="camera"><span aria-hidden="true">📷</span> Prendre en photo l’exercice</button>' +
        '<button type="button" class="nxp-btn" data-nxp="galerie" style="grid-column:1/-1"><span aria-hidden="true">🖼️</span> Choisir une photo déjà prise</button>' +
        '</div>';
    }
  }

  function sortie(html) { var s = F && F.fond.querySelector('[data-nxp-sortie]'); if (s) { s.innerHTML = html; try { s.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {} } }
  function attente(txt) { return '<div class="nxp-attente" role="status"><span class="nxp-rond" aria-hidden="true"></span><span>' + esc(txt) + '</span></div>'; }

  function erreur(d) {
    var code = (d && d.code) || 'erreur';
    var msg = (d && d.message) || 'Petit souci. Réessaie.';
    var bouton = '';
    if (code === 'essais_finis') bouton = '<button type="button" class="nxp-btn principal" data-nxp="abonner">S’abonner : 1 mois 60 000 GNF · Année 360 000 GNF</button>';
    else if (code === 'connexion') bouton = '<button type="button" class="nxp-btn principal" data-nxp="connexion">Me connecter</button>';
    if (d && d.etat) { F.etat = d.etat; majQuota(); }
    return '<div class="nxp-erreur" role="alert">' + esc(msg) + bouton + '</div>';
  }

  function envoyer() {
    if (!F || F.occupe) return;
    var q = F.fond.querySelector('[data-nxp-question]');
    var question = q ? q.value.trim() : '';
    if (!F.image && !question) { sortie(erreur({ message: 'Prends une photo de l’exercice ou écris ta question.' })); return; }
    F.occupe = true;
    var btn = F.fond.querySelector('[data-nxp="envoyer"]'); if (btn) btn.disabled = true;
    ecrire(CLE_PREF, { matiere: F.matiere, classe: F.classe });
    sortie(attente(F.image ? 'Le Professeur lit ton exercice…' : 'Le Professeur réfléchit…'));
    var corps = { matiere: F.matiere, classe: F.classe, question: question };
    if (F.image) corps.image = { type: F.image.type, data: F.image.data };
    appel('POST', corps).then(function (r) {
      if (!F) return;
      F.occupe = false; if (btn) btn.disabled = false;
      if (!r.data.success) { sortie(erreur(r.data)); return; }
      F.etat = r.data.etat || F.etat;
      F.id = r.data.id; F.suitesRestantes = 3;
      F.question = question;
      F.fil = [{ role: 'assistant', texte: r.data.reponse }];
      ecranReponse();
    });
  }

  function ecranReponse() {
    var html = '<div class="nxp-quota" data-nxp-quota hidden></div>';
    html += '<div class="nxp-msg eleve">' + (F.image ? '<img alt="Ton exercice" src="' + F.image.apercu + '">' : '') + (F.question ? esc(F.question) : (F.image ? '' : '')) + '</div>';
    F.fil.forEach(function (m) {
      if (m.role === 'assistant') html += '<div class="nxp-msg prof"><div class="qui">Professeur Nexora</div>' + rendre(m.texte) + '</div>';
      else html += '<div class="nxp-msg eleve">' + esc(m.texte) + '</div>';
    });
    html += '<div data-nxp-sortie></div>';
    html += '<div class="nxp-suite">';
    if (F.suitesRestantes > 0) {
      html += '<button type="button" class="nxp-btn principal" data-nxp="encore">Je n’ai pas compris : explique plus simplement</button>';
      html += '<textarea class="nxp-txt" data-nxp-relance maxlength="600" placeholder="Pose une autre question sur cet exercice…" style="min-height:56px;margin:0"></textarea>';
      html += '<button type="button" class="nxp-btn" data-nxp="relancer">Envoyer ma question</button>';
    }
    html += '<button type="button" class="nxp-btn" data-nxp="nouveau">📷 Nouvel exercice</button></div>';
    if (F.suitesRestantes > 0) html += '<p class="nxp-note">Encore ' + F.suitesRestantes + ' explication' + (F.suitesRestantes > 1 ? 's' : '') + ' possible' + (F.suitesRestantes > 1 ? 's' : '') + ' sur cet exercice, sans compter de nouvelle question.</p>';
    F.corps.innerHTML = html;
    majQuota();
    var dernier = F.corps.querySelectorAll('.nxp-msg.prof');
    if (dernier.length) try { dernier[dernier.length - 1].scrollIntoView({ block: 'start' }); } catch (e) {}
  }

  function suite(texteEleve) {
    if (!F || F.occupe || !F.id) return;
    F.occupe = true;
    F.fil.push({ role: 'user', texte: texteEleve });
    sortie(attente('Le Professeur prépare une autre explication…'));
    F.corps.querySelectorAll('.nxp-suite .nxp-btn').forEach(function (b) { b.disabled = true; });
    var corps = { matiere: F.matiere, classe: F.classe, question: F.question || '', suite_de: F.id, historique: F.fil.slice(-6) };
    if (F.image) corps.image = { type: F.image.type, data: F.image.data };
    appel('POST', corps).then(function (r) {
      if (!F) return;
      F.occupe = false;
      if (!r.data.success) {
        F.fil.pop();
        if (r.data.code === 'suites_finies') F.suitesRestantes = 0;
        ecranReponse(); sortie(erreur(r.data)); return;
      }
      F.suitesRestantes = Math.max(0, F.suitesRestantes - 1);
      F.fil.push({ role: 'assistant', texte: r.data.reponse });
      ecranReponse();
    });
  }

  function choisirFichier(input) {
    var f = input.files && input.files[0];
    input.value = '';
    if (!f) return;
    preparerImage(f).then(function (img) { if (!F) return; F.image = img; zonePhoto(); sortie(''); })
      .catch(function () { sortie(erreur({ message: 'Je n’arrive pas à lire cette image. Essaie une autre photo (format JPG ou PNG).' })); });
  }

  function abonner() {
    fermer();
    var pret = typeof window.NexoraEnsureSecureV506 === 'function' ? window.NexoraEnsureSecureV506() : null;
    Promise.resolve(pret).catch(function () {}).then(function () {
      var b = document.createElement('button');
      b.type = 'button'; b.hidden = true; b.setAttribute('data-nx-subscribe-space', 'eleves');
      document.body.appendChild(b); b.click(); setTimeout(function () { b.remove(); }, 300);
    });
  }
  function connexion() {
    fermer();
    try { if (window.NexoraApp && typeof window.NexoraApp.openAccountModal === 'function') { window.NexoraApp.openAccountModal(); return; } } catch (e) {}
    var b = document.querySelector('[data-action="go"][data-screen="profile"]');
    if (b) b.click();
  }

  function clic(e) {
    var t = e.target.closest('[data-nxp],[data-nxp-matiere]');
    if (!t || !F) return;
    var m = t.getAttribute('data-nxp-matiere');
    if (m) {
      F.matiere = F.matiere === m ? '' : m;
      F.fond.querySelectorAll('[data-nxp-matiere]').forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-nxp-matiere') === F.matiere)); });
      return;
    }
    var a = t.getAttribute('data-nxp');
    if (a === 'fermer') fermer();
    else if (a === 'camera') F.fond.querySelector('[data-nxp-fichier="camera"]').click();
    else if (a === 'galerie') F.fond.querySelector('[data-nxp-fichier="galerie"]').click();
    else if (a === 'retirer') { F.image = null; zonePhoto(); }
    else if (a === 'envoyer') envoyer();
    else if (a === 'encore') suite('Je n’ai pas compris. Explique-moi encore, plus simplement, avec un exemple.');
    else if (a === 'relancer') { var r = F.fond.querySelector('[data-nxp-relance]'); var v = r ? r.value.trim() : ''; if (v) suite(v); else if (r) r.focus(); }
    else if (a === 'nouveau') { F.image = null; ecranQuestion(); }
    else if (a === 'abonner') abonner();
    else if (a === 'connexion') connexion();
  }
  function changement(e) {
    if (!F) return;
    if (e.target.matches('[data-nxp-fichier]')) choisirFichier(e.target);
    else if (e.target.matches('[data-nxp-classe]')) F.classe = e.target.value;
  }

  /* ---------- points d'entrée dans Nexora ---------- */
  function poser() {
    styles();
    var nav = document.querySelector('nav[data-nav].nx-nav-list-v166') || document.querySelector('nav[data-nav]');
    if (nav && !nav.querySelector('[data-nxp-nav]')) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'nav-btn'; b.setAttribute('data-nxp-nav', '');
      b.setAttribute('aria-label', 'Professeur Nexora : expliquer un exercice en photo');
      b.innerHTML = '<span aria-hidden="true" class="nav-icon"><svg viewBox="0 0 24 24"><path d="M4 7h3l2-3h6l2 3h3v12H4z"></path><circle cx="12" cy="13" r="3.5"></circle></svg></span><span class="nx-nav-copy-v166"><strong>Professeur Nexora</strong><small>Ton exercice expliqué en photo</small></span>';
      b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); ouvrir(); });
      var install = nav.querySelector('[data-nxb697-nav]');
      if (install) nav.insertBefore(b, install); else nav.appendChild(b);
    }
    var esp = document.querySelector('[data-nx-espaces-v510="academie"]');
    if (esp && !document.querySelector('[data-nxp-carte]')) {
      var c = document.createElement('button');
      c.type = 'button'; c.className = 'nxp-carte'; c.setAttribute('data-nxp-carte', '');
      c.innerHTML = '<span class="ic" aria-hidden="true">🎓</span><span><b>Professeur Nexora</b><small>Bloqué sur un exercice ? Prends-le en photo : je t’explique étape par étape.</small></span><span class="go">Essayer</span>';
      c.addEventListener('click', function (e) { e.preventDefault(); ouvrir(); });
      var band = esp.querySelector('[data-nxb697-bandeau]');
      if (band && band.nextSibling) esp.insertBefore(c, band.nextSibling); else if (band) esp.appendChild(c); else esp.insertBefore(c, esp.firstChild);
    }
    return !!(document.querySelector('[data-nxp-nav]') && document.querySelector('[data-nxp-carte]'));
  }

  window.NexoraProfesseur = { ouvrir: ouvrir, fermer: fermer, _rendre: rendre };

  /* Lien direct : https://…/?professeur=1 ouvre le Professeur */
  try { if (/[?&]professeur=1\b/.test(location.search)) setTimeout(ouvrir, 1200); } catch (e) {}

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', poser, { once: true }); else poser();
  setTimeout(poser, 2500);
  if (window.MutationObserver) {
    var attenteObs = null;
    var obs = new MutationObserver(function () {
      if (attenteObs) return;
      attenteObs = setTimeout(function () {
        attenteObs = null;
        if (!document.querySelector('[data-nxp-carte]') || !document.querySelector('[data-nxp-nav]')) poser();
      }, 300);
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
