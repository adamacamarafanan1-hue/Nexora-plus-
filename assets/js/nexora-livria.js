/* V704 — Bibliothèque Livria intégrée à Nexora.
   Incluse dans l'abonnement Nexora : la lecture d'un chapitre est vérifiée côté serveur
   (fonction livria_lire_chapitre, même porte d'abonnement que les cours). */
(function () {
  'use strict';
  if (window.__nxLivriaV704) return;
  window.__nxLivriaV704 = true;

  var AUTEUR = 'Adama Camara';
  var LIVRES = [], ACCES = { connecte: false, actif: false, admin: false };
  var prog = lire('prog', {}), prefs = lire('prefs', { fs: 19, r: 'clair' });
  var livre = null, ch = 0, rendu = 0;

  function lire(k, d) { try { var v = localStorage.getItem('nxl:' + k); return v ? JSON.parse(v) : d; } catch (_e) { return d; } }
  function ecrire(k, v) { try { localStorage.setItem('nxl:' + k, JSON.stringify(v)); } catch (_e) {} }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(s, r) { return (r || document).querySelector(s); }

  function client() {
    try {
      if (window.NexoraApp && typeof window.NexoraApp.ensureSupabaseClientReady === 'function') return window.NexoraApp.ensureSupabaseClientReady();
      return Promise.resolve(window.NexoraApp && window.NexoraApp.getSupabaseClient ? window.NexoraApp.getSupabaseClient() : null);
    } catch (_e) { return Promise.resolve(null); }
  }
  function rpc(nom, args) {
    return client().then(function (sb) {
      if (!sb) throw new Error('CLIENT_ABSENT');
      var p = sb.rpc(nom, args || {});
      var delai = new Promise(function (res) { setTimeout(function () { res({ data: null, error: { message: 'TIMEOUT' } }); }, 25000); });
      return Promise.race([p, delai]).then(function (r) { if (r.error) throw r.error; return r.data; });
    });
  }
  function message(err) {
    var m = String((err && (err.message || err.msg)) || '');
    if (/ABONNEMENT_REQUIS/.test(m)) return ['ABONNEMENT', 'Ce livre est inclus dans l’abonnement Nexora.'];
    if (/NON_CONNECTE|JWT|permission denied for function livria_lire/.test(m)) return ['CONNEXION', 'Connectez-vous à votre compte Nexora pour lire ce livre.'];
    if (/TROP_RAPIDE/.test(m)) return ['RAPIDE', 'Lecture trop rapide détectée. Patientez quelques minutes.'];
    if (/INTROUVABLE/.test(m)) return ['INTROUVABLE', 'Chapitre introuvable.'];
    if (/ADMIN_REQUIS/.test(m)) return ['ADMIN', 'Action réservée à l’administrateur.'];
    return ['RESEAU', 'Le réseau est trop lent ou coupé. Vérifiez votre connexion puis réessayez.'];
  }

  /* ---------- Styles ---------- */
  function styles() {
    if (document.getElementById('nxlStyleV704')) return;
    var s = document.createElement('style');
    s.id = 'nxlStyleV704';
    s.textContent = '.nxl-entree{display:flex;align-items:center;gap:12px;width:100%;min-height:62px;margin:0 0 14px;padding:10px 15px;border:0;border-radius:12px;background:#172036;color:#fff;font:inherit;text-align:left;cursor:pointer} .nxl-entree-ic{display:flex;align-items:flex-end;gap:3px;height:28px;flex:none} .nxl-entree-ic i{display:block;width:7px;border-radius:2px} .nxl-entree-ic i:nth-child(1){height:20px;background:#F2B33D}.nxl-entree-ic i:nth-child(2){height:26px;background:#4F6BEA}.nxl-entree-ic i:nth-child(3){height:17px;background:#2FA38C} .nxl-entree-txt b{display:block;font-size:16px;font-weight:800}.nxl-entree-txt small{display:block;font-size:12.5px;opacity:.85;margin-top:2px} html.nxl-ouverte,html.nxl-ouverte body{overflow:hidden} .nxl-fen{position:fixed;inset:0;z-index:2147483000;background:#EDF0F5;color:#172036;display:flex;flex-direction:column;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding-top:env(safe-area-inset-top,0)} .nxl-fen[hidden],.nxl-fen [hidden]{display:none!important} .nxl-barre{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#fff;border-bottom:1px solid #D6DCE7} .nxl-barre>b{flex:1;font-size:16px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .nxl-barre span{display:flex} .nxl-ib{width:42px;height:42px;border:0;border-radius:10px;background:transparent;color:inherit;font-size:20px;font-weight:700;cursor:pointer} .nxl-corps{flex:1;overflow-y:auto;padding:16px 18px 40px;max-width:640px;width:100%;margin:0 auto;box-sizing:border-box} .nxl-sous{color:#5E6880;margin:0 0 14px;font-size:15px} .nxl-cherche{width:100%;box-sizing:border-box;padding:13px 14px;border:1px solid #D6DCE7;border-radius:12px;font:inherit;font-size:16px;margin-bottom:14px;background:#fff;color:#172036} .nxl-info{background:#fff;border:1px solid #D6DCE7;border-radius:12px;padding:12px 14px;font-size:14px;margin-bottom:14px} .nxl-lien{border:0;background:none;color:#3047C9;text-decoration:underline;font:inherit;font-weight:700;padding:0;cursor:pointer} .nxl-grille{display:grid;grid-template-columns:repeat(2,1fr);gap:20px 14px} @media (min-width:480px){.nxl-grille{grid-template-columns:repeat(3,1fr)}} .nxl-item{display:block;width:100%;border:0;background:none;padding:0;text-align:left;color:inherit;font:inherit;cursor:pointer} .nxl-item b{display:block;margin-top:8px;font-size:14.5px;line-height:1.2}.nxl-item small{color:#5E6880;font-size:12.5px} .nxl-cov{aspect-ratio:2/3;border-radius:4px 10px 10px 4px;position:relative;overflow:hidden;color:#fff;padding:14% 11% 10% 16%;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 12px 22px -14px rgba(23,32,54,.6);box-sizing:border-box} .nxl-cov::before{content:"";position:absolute;left:0;top:0;bottom:0;width:7%;background:rgba(0,0,0,.18)} .nxl-cov.nxl-claire{color:#172036}.nxl-cov.nxl-photo{padding:0}.nxl-cov.nxl-photo::before{display:none} .nxl-ct{font-weight:800;letter-spacing:-.02em;line-height:1.05;font-size:clamp(14px,4vw,19px);position:relative} .nxl-ca{font-size:11px;font-weight:600;opacity:.9;position:relative} .nxl-bientot{position:absolute;bottom:8px;right:8px;background:rgba(255,255,255,.92);color:#172036;font-size:11px;font-weight:700;padding:3px 8px;border-radius:999px;z-index:1} .nxl-vide{color:#5E6880} .nxl-fiche{position:absolute;inset:0;background:rgba(10,14,28,.55);display:flex;align-items:flex-end;z-index:3} .nxl-fiche-boite{position:relative;background:#fff;width:100%;max-width:560px;margin:0 auto;border-radius:20px 20px 0 0;padding:18px 20px calc(24px + env(safe-area-inset-bottom,0px));max-height:88%;overflow-y:auto;box-sizing:border-box} .nxl-fx{position:absolute;right:8px;top:8px} .nxl-fh{display:flex;gap:16px;align-items:flex-end;margin-bottom:14px}.nxl-fc{width:110px;flex:none} .nxl-fh h3{margin:0 0 6px;font-size:21px;line-height:1.1}.nxl-fh small{display:block;color:#5E6880;font-size:13.5px} .nxl-fiche-boite p{font-family:Georgia,serif;font-size:16.5px;line-height:1.6} .nxl-faits{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}.nxl-faits span{font-size:13px;background:#EDF0F5;padding:6px 11px;border-radius:999px;color:#5E6880;font-weight:600} .nxl-btn{display:block;width:100%;padding:14px;border:0;border-radius:12px;background:#3047C9;color:#fff;font:inherit;font-weight:700;font-size:16px;cursor:pointer;margin-top:10px} .nxl-btn[disabled]{opacity:.45} .nxl-liseuse{position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;--rbg:#FBFBF8;--rink:#1D2333;--rmuted:#6B7286;--rline:#E3E5EA;--accent:#3047C9;--ui:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--read:Georgia,"Times New Roman",serif;background:var(--rbg);color:var(--rink)} .nxl-liseuse[data-r=sepia]{--rbg:#F2E8D5;--rink:#3B2F22;--rmuted:#7D6B55;--rline:#E0D2B8} .nxl-liseuse[data-r=nuit]{--rbg:#121826;--rink:#D9DDE7;--rmuted:#8A93A8;--rline:#252E42;--accent:#7C90FF} .nxl-liseuse .nxl-barre{background:var(--rbg);border-color:var(--rline)} .nxl-prog{height:3px;background:var(--rline)}.nxl-prog i{display:block;height:100%;width:0;background:var(--accent)} .nxl-texte{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;position:relative} .nxl-wm{position:fixed;inset:0;pointer-events:none;overflow:hidden;opacity:.05;font:600 13px/2.4 var(--ui);color:var(--rink);transform:rotate(-24deg) scale(1.6);word-break:break-all;user-select:none;z-index:5} .nxl-nav{display:flex;gap:10px;max-width:36em;margin:0 auto;padding:0 22px 40px} .nxl-nav button{flex:1;border:1.5px solid var(--rline);border-radius:14px;padding:14px;font-weight:700;font-family:var(--ui);background:transparent;color:inherit;font-size:15px} .nxl-nav button[disabled]{opacity:.35} .nxl-panneau{position:absolute;left:0;right:0;bottom:0;background:var(--rbg);border-top:1px solid var(--rline);border-radius:20px 20px 0 0;padding:16px 20px calc(20px + env(safe-area-inset-bottom,0px));transform:translateY(105%);transition:transform .25s;max-height:70%;overflow-y:auto;visibility:hidden;z-index:6;font-family:var(--ui)} .nxl-panneau.nxl-on{transform:none;visibility:visible;box-shadow:0 -12px 30px rgba(0,0,0,.18)} .nxl-panneau h4{margin:0 0 10px;font-size:15px} .nxl-rang{display:flex;gap:8px;margin-bottom:18px}.nxl-rang button{flex:1;border:1.5px solid var(--rline);border-radius:12px;padding:12px 0;font-weight:700;background:transparent;color:inherit;font-size:15px} .nxl-som button{display:flex;gap:12px;width:100%;text-align:left;padding:12px 4px;border:0;border-bottom:1px solid var(--rline);background:none;color:inherit;font:inherit;font-size:15.5px} .nxl-som button span{color:var(--rmuted);min-width:1.6em}.nxl-som button.nxl-cour{color:var(--accent);font-weight:700} .nxl-page .box .nxl-btn{width:auto;display:inline-block;padding:11px 16px;font-family:var(--ui);font-size:15px} .nxl-page{max-width:36em;margin:0 auto;padding:28px 22px 40px;font-family:var(--read);font-size:var(--fs,19px);line-height:1.7} .nxl-page h1{font-family:var(--ui);font-size:1.6em;letter-spacing:-.03em;line-height:1.1;margin:0 0 .9em} .nxl-page h2{font-family:var(--ui);font-size:1.15em;margin:1.6em 0 .5em} .nxl-page p{margin:0 0 1em} .nxl-page blockquote{margin:1.2em 0;padding:.2em 0 .2em 1em;border-left:3px solid var(--accent);font-style:italic} .nxl-page .clabel{font-family:var(--ui);font-size:.72em;font-weight:600;color:var(--accent);margin:0 0 .4em} .nxl-page h3{font-family:var(--ui);font-size:1em;margin:1.4em 0 .5em} .nxl-page .lead{font-size:1.04em;font-weight:600;padding:.9em 1em;border-left:4px solid var(--accent);background:color-mix(in srgb,var(--accent) 8%,transparent);border-radius:0 12px 12px 0;line-height:1.55} .nxl-page ul{margin:0 0 1em;padding-left:1.2em} .nxl-page li{margin-bottom:.45em} .nxl-page .num{padding-left:1.4em;text-indent:-1.4em} .nxl-page .box{margin:1.2em 0;padding:.9em 1em;border-radius:12px;font-size:.92em;line-height:1.6;background:color-mix(in srgb,var(--rink) 5%,transparent)} .nxl-page .box p{margin:0 0 .6em} .nxl-page .box p:last-child{margin:0} .nxl-page .box.tip{background:#FFF4D6;color:#3B2F12} .nxl-page .box.tip::before{content:"💡";float:left;margin-right:.5em} .nxl-page .box.apres{background:#E6F4EC;color:#163A26} .nxl-page .box.avant{background:#FCE9EB;color:#4A1F25} .nxl-page .box.quote{border-left:4px solid var(--accent);border-radius:0 12px 12px 0;font-style:italic} .nxl-page .box .lab{display:block;font-family:var(--ui);font-style:normal;font-size:.75em;font-weight:600;margin-bottom:.6em} .nxl-page .box .lab b{font-weight:600} .nxl-page .box .small{font-size:.85em;opacity:.8;font-style:normal} .nxl-page pre{position:relative;background:#1E2E33;color:#EAF4F2;font-family:ui-monospace,"DejaVu Sans Mono",Menlo,monospace;font-size:.72em;line-height:1.6;padding:2.6em 1em 1em;border-radius:12px;white-space:pre-wrap;word-break:break-word;margin:1em 0 1.3em} .nxl-page pre[data-lab]::after{content:attr(data-lab);position:absolute;left:1em;right:6em;top:.9em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:var(--ui);font-size:.85em;color:#9FD3C8} .nxl-page pre .copy{position:absolute;right:.6em;top:.5em;font-family:var(--ui);font-size:.9em;font-weight:600;background:rgba(255,255,255,.14);color:#fff;padding:.35em .8em;border-radius:999px} .nxl-page .tbl{overflow-x:auto;margin:1em 0 1.3em;border:1px solid var(--rline);border-radius:12px} .nxl-page table{border-collapse:collapse;width:100%;min-width:420px;font-family:var(--ui);font-size:.72em;line-height:1.45} .nxl-page th{background:var(--accent);color:#fff;text-align:left;padding:.7em .8em;font-weight:600} .nxl-page td{padding:.65em .8em;vertical-align:top;border-top:1px solid var(--rline)} .nxl-page tbody tr:nth-child(even) td{background:color-mix(in srgb,var(--rink) 4%,transparent)} .nxl-page ol.steps{list-style:none;padding:0;margin:1em 0 1.4em;display:grid;gap:.5em;counter-reset:none} .nxl-page ol.steps li{font-family:var(--ui);font-size:.8em;border:1.5px solid var(--rline);border-radius:12px;padding:.7em .9em;margin:0} .nxl-page ol.steps b{display:block;color:var(--accent)} .nxl-page .check{font-size:.95em;padding-left:1.8em;position:relative;margin-bottom:.6em} .nxl-page .check::before{content:"";position:absolute;left:0;top:.25em;width:1.05em;height:1.05em;border:2px solid var(--accent);border-radius:4px} .nxl-page .fq{font-family:var(--ui);font-size:1.4em;font-weight:800;text-align:center;line-height:1.2;margin:2.2em 0 .6em;color:var(--accent)} .nxl-page .fq::before{content:"“";display:block;font-size:2.4em;line-height:.8} .nxl-page .fq2{text-align:center;color:var(--rmuted);font-style:italic} .nxl-page .chapo{font-style:italic;color:var(--rmuted);font-size:1.02em} .nxl-page .box.def{background:#F3EEE6;color:#3A2E1F;border-left:4px solid #B5661C;border-radius:0 12px 12px 0} .nxl-page .box.exo{background:#E6EBEF;color:#22303B;border-left:4px solid #4A5966;border-radius:0 12px 12px 0} .nxl-page .box.exp{background:#FAF6EA;color:#3B3216;border-left:4px solid #8A6E0A;border-radius:0 12px 12px 0} .nxl-page .box.apres,.nxl-page .box.avant{border-radius:0 12px 12px 0;border-left:4px solid currentColor} .nxl-page .box ul{margin:.2em 0 .4em;padding-left:1.2em} .nxl-page .part{margin:-.4em 0 2.2em;padding:1.3em 1.1em;border-radius:16px;background:var(--accent);color:#fff} .nxl-page .part .plab{font-family:var(--ui);font-size:.75em;font-weight:600;opacity:.85;margin:0} .nxl-page .part .ptitle{font-family:var(--ui);font-size:1.45em;font-weight:800;line-height:1.1;letter-spacing:-.02em;margin:.2em 0 .5em} .nxl-page .part .chapo{color:#fff;opacity:.92} .nxl-page .part .plh{font-family:var(--ui);font-size:.75em;font-weight:600;margin:1em 0 .3em;opacity:.85} .nxl-page .part ul{font-size:.88em;margin:0} .nxl-page .pr{position:relative;display:flex;gap:.7em;align-items:flex-start;padding:.8em 4.6em .8em .9em;margin:0 0 .6em;border:1.5px solid var(--rline);border-radius:12px;font-size:.92em;line-height:1.55} .nxl-page .pr>b{font-family:var(--ui);color:var(--accent);min-width:1.4em} .nxl-page .pr .copy,.nxl-page .box .copy{position:absolute;right:.6em;top:.6em;font-family:var(--ui);font-size:.72em;font-weight:600;font-style:normal;background:var(--accent);color:#fff;padding:.35em .8em;border-radius:999px} .nxl-page .box.apres{position:relative} .nxl-page .tcopy{margin-top:.5em;font-weight:600;font-size:.95em;background:var(--accent);color:#fff;padding:.3em .8em;border-radius:999px} .nxl-page .pr .pu{display:block;font-family:var(--ui);font-style:normal;font-size:.8em;font-weight:600;color:var(--rmuted);margin-bottom:.2em} .nxl-page .fig{margin:1.4em 0;text-align:center;overflow-x:auto;cursor:zoom-in} .nxl-page .fig.zoom{cursor:zoom-out} .nxl-page .fig.zoom img{width:220%;max-width:none} .nxl-page .fig img{width:100%;height:auto;border-radius:12px;border:1px solid var(--rline);background:#fff} .nxl-page .fig figcaption{font-family:var(--ui);font-size:.72em;color:var(--rmuted);margin-top:.5em} .nxl-page li.ck{list-style:none;position:relative;padding-left:1.7em;margin-left:-1.2em} .nxl-page li.ck::before{content:"";position:absolute;left:0;top:.3em;width:1em;height:1em;border:2px solid var(--accent);border-radius:4px} .nxl-page .goto{color:var(--accent);text-decoration:underline;font:inherit} .nxl-page .btn.primary{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)} .nxl-page .btn{display:inline-block;margin-top:10px;padding:12px 16px;border-radius:12px;font-weight:600;font-family:var(--ui)}';
    (document.head || document.documentElement).appendChild(s);
  }

  /* ---------- Bouton d'entrée sur l'accueil ---------- */
  function poserBouton() {
    var accueil = document.getElementById('screen-student-work-feed');
    if (!accueil || accueil.querySelector('.nxl-entree')) return;
    styles();
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'nxl-entree';
    b.innerHTML = '<span class="nxl-entree-ic" aria-hidden="true"><i></i><i></i><i></i></span>' +
      '<span class="nxl-entree-txt"><b>Bibliothèque Livria</b><small>Les livres sur l’IA, inclus dans votre abonnement</small></span>';
    b.addEventListener('click', ouvrir);
    var reglages = accueil.querySelector('.nx-reg-ouvrir-v543');
    if (reglages && reglages.parentNode) reglages.parentNode.insertBefore(b, reglages.nextSibling);
    else accueil.insertBefore(b, accueil.firstChild);
  }
  document.addEventListener('nx-screen-change', function () { setTimeout(poserBouton, 300); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', poserBouton); else poserBouton();
  setInterval(poserBouton, 4000);

  /* ---------- Fenêtre de la bibliothèque ---------- */
  function fenetre() {
    var f = document.getElementById('nxlFenetre');
    if (f) return f;
    styles();
    f = document.createElement('div');
    f.id = 'nxlFenetre';
    f.className = 'nxl-fen';
    f.innerHTML =
      '<div class="nxl-barre"><button type="button" class="nxl-ib" data-nxl="fermer" aria-label="Fermer">✕</button>' +
      '<b>Bibliothèque Livria</b><span></span></div>' +
      '<div class="nxl-corps">' +
        '<p class="nxl-sous">Des livres écrits en Guinée pour comprendre et utiliser l’intelligence artificielle.</p>' +
        '<input class="nxl-cherche" type="search" placeholder="Chercher un livre" autocomplete="off">' +
        '<div class="nxl-etat"></div><div class="nxl-admin"></div>' +
        '<div class="nxl-grille"></div>' +
      '</div>' +
      '<div class="nxl-fiche" hidden></div>' +
      '<div class="nxl-liseuse" hidden data-r="clair">' +
        '<div class="nxl-barre"><button type="button" class="nxl-ib" data-nxl="retour" aria-label="Retour">‹</button>' +
        '<b class="nxl-titre-livre"></b>' +
        '<span><button type="button" class="nxl-ib" data-nxl="sommaire" aria-label="Sommaire">☰</button>' +
        '<button type="button" class="nxl-ib" data-nxl="reglages" aria-label="Affichage">Aa</button></span></div>' +
        '<div class="nxl-prog"><i></i></div>' +
        '<div class="nxl-texte"><article class="nxl-page"></article><div class="nxl-wm" aria-hidden="true"></div>' +
        '<div class="nxl-nav"><button type="button" data-nxl="prec">Chapitre précédent</button><button type="button" data-nxl="suiv">Chapitre suivant</button></div></div>' +
        '<div class="nxl-panneau nxl-p-som"><h4>Sommaire</h4><div class="nxl-som"></div></div>' +
        '<div class="nxl-panneau nxl-p-reg"><h4>Taille du texte</h4><div class="nxl-rang"><button type="button" data-fs="-1">A−</button><button type="button" data-fs="1">A+</button></div>' +
        '<h4>Fond de page</h4><div class="nxl-rang"><button type="button" data-th="clair">Clair</button><button type="button" data-th="sepia">Sépia</button><button type="button" data-th="nuit">Nuit</button></div></div>' +
      '</div>';
    document.body.appendChild(f);
    f.addEventListener('click', clic);
    f.querySelector('.nxl-cherche').addEventListener('input', grille);
    f.querySelector('.nxl-texte').addEventListener('scroll', function () { clearTimeout(f._t); f._t = setTimeout(sauver, 200); });
    return f;
  }

  function ouvrir() {
    var f = fenetre();
    f.hidden = false;
    document.documentElement.classList.add('nxl-ouverte');
    try { history.pushState({ nxl: 1 }, ''); } catch (_e) {}
    charger();
  }
  function fermer() {
    var f = document.getElementById('nxlFenetre');
    if (f) f.hidden = true;
    document.documentElement.classList.remove('nxl-ouverte');
  }
  window.addEventListener('popstate', function () {
    var f = document.getElementById('nxlFenetre');
    if (!f || f.hidden) return;
    var l = $('.nxl-liseuse', f), fi = $('.nxl-fiche', f);
    if (!l.hidden) { l.hidden = true; return; }
    if (!fi.hidden) { fi.hidden = true; return; }
    fermer();
  });

  function charger() {
    var f = fenetre();
    $('.nxl-etat', f).textContent = 'Chargement…';
    Promise.all([
      rpc('livria_catalogue').catch(function () { return lire('catalogue', []); }),
      rpc('livria_mon_acces').catch(function () { return ACCES; })
    ]).then(function (r) {
      LIVRES = (r[0] || []).map(function (l) { l.chapitres = []; return l; });
      ecrire('catalogue', LIVRES);
      ACCES = r[1] || ACCES;
      $('.nxl-etat', f).innerHTML = ACCES.actif ? '' :
        '<div class="nxl-info">Les livres sont inclus dans l’abonnement Nexora. ' +
        (ACCES.connecte ? '<button type="button" class="nxl-lien" data-nxl="abonner">Voir l’abonnement</button>' : 'Connectez-vous à votre compte Nexora pour lire.') + '</div>';
      $('.nxl-admin', f).innerHTML = ACCES.admin ?
        '<div class="nxl-info">Administration : <button type="button" class="nxl-lien" data-nxl="importer">Importer des livres</button> <input type="file" accept=".json,application/json" hidden class="nxl-fichier"><span class="nxl-imp"></span></div>' : '';
      var fi = $('.nxl-fichier', f); if (fi) fi.addEventListener('change', importer);
      grille();
    });
  }

  function couverture(l) {
    var pret = l.nb > 0;
    if (l.img) return '<div class="nxl-cov nxl-photo" style="background:' + esc(l.couleur) + ' url(\'' + l.img + '\') center/cover no-repeat">' + (pret ? '' : '<span class="nxl-bientot">Bientôt</span>') + '</div>';
    return '<div class="nxl-cov' + (l.clair ? ' nxl-claire' : '') + '" style="background:' + esc(l.couleur) + '">' +
      (pret ? '' : '<span class="nxl-bientot">Bientôt</span>') +
      '<div class="nxl-ct">' + esc(l.titre) + '</div><div class="nxl-ca">' + AUTEUR + '</div></div>';
  }
  function norm(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  function grille() {
    var f = fenetre(), q = norm($('.nxl-cherche', f).value.trim());
    var liste = LIVRES.filter(function (l) { return !q || norm(l.titre + ' ' + l.resume + ' ' + l.rayon).indexOf(q) >= 0; });
    $('.nxl-grille', f).innerHTML = liste.length ? liste.map(function (l) {
      var p = prog[l.id], pc = p && l.nb ? Math.min(100, Math.round((p.ch + (p.pos || 0)) / l.nb * 100)) : 0;
      return '<button type="button" class="nxl-item" data-livre="' + esc(l.id) + '">' + couverture(l) +
        '<b>' + esc(l.titre) + '</b><small>' + esc(l.rayon || '') + (pc ? ' · ' + pc + ' % lu' : '') + '</small></button>';
    }).join('') : '<p class="nxl-vide">' + (LIVRES.length ? 'Aucun livre trouvé.' : 'La bibliothèque est en préparation.') + '</p>';
  }

  function fiche(id) {
    var l = LIVRES.filter(function (x) { return x.id === id; })[0]; if (!l) return;
    var f = fenetre(), fi = $('.nxl-fiche', f), pret = l.nb > 0;
    fi.innerHTML = '<div class="nxl-fiche-boite"><button type="button" class="nxl-ib nxl-fx" data-nxl="ficheX" aria-label="Fermer">✕</button>' +
      '<div class="nxl-fh"><div class="nxl-fc">' + couverture(l) + '</div><div><h3>' + esc(l.titre) + '</h3><small>' + AUTEUR + '</small><small>Rayon ' + esc(l.rayon || '') + '</small></div></div>' +
      '<p>' + esc(l.resume || '') + '</p>' +
      '<div class="nxl-faits">' + (pret ? (l.pages ? '<span>' + l.pages + ' pages</span>' : '') + '<span>' + l.nb + ' parties</span>' : '<span>Bientôt disponible</span>') + '</div>' +
      '<button type="button" class="nxl-btn" data-nxl="lire" data-id="' + esc(l.id) + '"' + (pret ? '' : ' disabled') + '>' + (pret ? (prog[l.id] ? 'Reprendre' : 'Lire') : 'Bientôt') + '</button></div>';
    fi.hidden = false;
  }

  function ouvrirLivre(id) {
    var l = LIVRES.filter(function (x) { return x.id === id; })[0]; if (!l) return;
    livre = l;
    var f = fenetre();
    (l.chapitres.length ? Promise.resolve(l.chapitres) : rpc('livria_sommaire', { p_livre: id }).then(function (d) { l.chapitres = d || []; ecrire('som:' + id, l.chapitres); return l.chapitres; }).catch(function () { l.chapitres = lire('som:' + id, []); return l.chapitres; }))
      .then(function (chs) {
        if (!chs.length) { alert('Sommaire indisponible pour le moment.'); return; }
        $('.nxl-fiche', f).hidden = true;
        var p = prog[id]; ch = p ? Math.min(p.ch, chs.length - 1) : 0;
        $('.nxl-titre-livre', f).textContent = l.titre;
        var li = $('.nxl-liseuse', f); li.hidden = false; appliquer();
        try { history.pushState({ nxl: 2 }, ''); } catch (_e) {}
        afficher(p ? p.pos : 0);
      });
  }

  function appliquer() {
    var f = fenetre(), li = $('.nxl-liseuse', f);
    li.setAttribute('data-r', prefs.r);
    $('.nxl-page', f).style.setProperty('--fs', prefs.fs + 'px');
  }
  function nav() {
    var f = fenetre();
    $('[data-nxl="prec"]', f).disabled = ch === 0;
    $('[data-nxl="suiv"]', f).textContent = ch === livre.chapitres.length - 1 ? 'Terminer le livre' : 'Chapitre suivant';
    $('.nxl-som', f).innerHTML = livre.chapitres.map(function (x, i) {
      return '<button type="button" data-ch="' + i + '"' + (i === ch ? ' class="nxl-cour"' : '') + '><span>' + esc(x.num || i + 1) + '</span>' + esc(x.titre) + (ACCES.actif ? '' : ' 🔒') + '</button>';
    }).join('');
  }
  function afficher(pos) {
    var f = fenetre(), s = livre.chapitres[ch], jeton = ++rendu, page = $('.nxl-page', f), corps = $('.nxl-texte', f);
    page.innerHTML = '<p class="clabel">' + esc(s.label || '') + '</p><h1>' + esc(s.titre) + '</h1><p>Chargement…</p>';
    nav(); corps.scrollTop = 0;
    rpc('livria_lire_chapitre', { p_livre: livre.id, p_ordre: s.ordre }).then(function (c) {
      if (jeton !== rendu) return;
      $('.nxl-wm', f).textContent = c.filigrane ? new Array(60).join(c.filigrane + '   ') : '';
      page.innerHTML = (c.avant || '') + (c.label ? '<p class="clabel">' + esc(c.label) + '</p>' : '') + '<h1>' + esc(c.titre) + '</h1>' + c.texte;
      copier(page);
      requestAnimationFrame(function () { corps.scrollTop = pos ? pos * (corps.scrollHeight - corps.clientHeight) : 0; sauver(); });
    }).catch(function (err) {
      if (jeton !== rendu) return;
      var m = message(err), bloque = m[0] === 'ABONNEMENT' || m[0] === 'CONNEXION';
      page.innerHTML = '<p class="clabel">' + esc(s.label || '') + '</p><h1>' + esc(s.titre) + '</h1><div class="box def"><span class="lab">' + (bloque ? '🔒 Réservé aux abonnés Nexora' : 'Lecture impossible') + '</span><p>' + esc(m[1]) + '</p>' +
        (bloque ? '<button type="button" class="nxl-btn" data-nxl="abonner">' + (m[0] === 'CONNEXION' ? 'Me connecter' : 'Voir l’abonnement Nexora') + '</button>' : '') + '</div>';
    });
  }
  function copier(page) {
    var blocs = page.querySelectorAll('pre, .box.apres');
    Array.prototype.forEach.call(blocs, function (e) {
      if (e.matches('.box.apres') && !/prompt|instructions/i.test((e.querySelector('.lab') || {}).textContent || '')) return;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'copy'; b.textContent = 'Copier';
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var c = e.cloneNode(true); Array.prototype.forEach.call(c.querySelectorAll('.lab,.copy'), function (x) { x.remove(); });
        var t = c.innerText.trim();
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { b.textContent = 'Copié'; setTimeout(function () { b.textContent = 'Copier'; }, 1500); }, function () {});
      });
      e.appendChild(b);
    });
  }
  function sauver() {
    if (!livre) return;
    var c = $('.nxl-texte', fenetre()), h = c.scrollHeight - c.clientHeight, pos = h > 0 ? c.scrollTop / h : 1;
    prog[livre.id] = { ch: ch, pos: Math.min(0.999, pos), t: Date.now() }; ecrire('prog', prog);
    $('.nxl-prog i', fenetre()).style.width = Math.round((ch + pos) / livre.chapitres.length * 100) + '%';
  }

  function abonner() {
    fermer();
    try { if (typeof window.nxRequireSubscriptionAccess === 'function') window.nxRequireSubscriptionAccess('academy', function () {}); } catch (_e) {}
  }

  function importer(e) {
    var fichier = e.target.files[0], f = fenetre(), sortie = $('.nxl-imp', f); if (!fichier) return;
    sortie.textContent = ' Lecture du fichier…';
    fichier.text().then(function (t) {
      var cat = JSON.parse(t), liste = cat.livres || [cat], n = 0;
      return liste.reduce(function (p, l) {
        return p.then(function () { sortie.textContent = ' Import de « ' + l.titre + ' » (' + (n + 1) + '/' + liste.length + ')…'; return rpc('livria_admin_importer_livre', { p_livre: l }).then(function () { n++; }); });
      }, Promise.resolve()).then(function () { sortie.textContent = ' ' + n + ' livre(s) importé(s).'; charger(); });
    }).catch(function (err) { sortie.textContent = ' Échec de l’import : ' + message(err)[1]; });
    e.target.value = '';
  }

  function clic(ev) {
    var f = fenetre(), t = ev.target, a = t.closest('[data-nxl]'), act = a && a.getAttribute('data-nxl');
    var item = t.closest('[data-livre]'); if (item) { fiche(item.getAttribute('data-livre')); return; }
    var chb = t.closest('[data-ch]'); if (chb) { ch = +chb.getAttribute('data-ch'); $('.nxl-p-som', f).classList.remove('nxl-on'); afficher(0); return; }
    var fs = t.closest('[data-fs]'); if (fs) { prefs.fs = Math.max(15, Math.min(26, prefs.fs + (+fs.getAttribute('data-fs')))); ecrire('prefs', prefs); appliquer(); return; }
    var th = t.closest('[data-th]'); if (th) { prefs.r = th.getAttribute('data-th'); ecrire('prefs', prefs); appliquer(); return; }
    if (t.closest('.nxl-fig') || t.closest('.fig')) { (t.closest('.fig')).classList.toggle('zoom'); return; }
    if (!act) { if (t.closest('.nxl-page')) { $('.nxl-p-som', f).classList.remove('nxl-on'); $('.nxl-p-reg', f).classList.remove('nxl-on'); } return; }
    if (act === 'fermer') { fermer(); try { history.back(); } catch (_e) {} }
    else if (act === 'ficheX') { $('.nxl-fiche', f).hidden = true; }
    else if (act === 'lire') { ouvrirLivre(a.getAttribute('data-id')); }
    else if (act === 'retour') { $('.nxl-liseuse', f).hidden = true; grille(); try { history.back(); } catch (_e) {} }
    else if (act === 'sommaire') { $('.nxl-p-reg', f).classList.remove('nxl-on'); $('.nxl-p-som', f).classList.toggle('nxl-on'); }
    else if (act === 'reglages') { $('.nxl-p-som', f).classList.remove('nxl-on'); $('.nxl-p-reg', f).classList.toggle('nxl-on'); }
    else if (act === 'prec') { if (ch > 0) { ch--; afficher(0); } }
    else if (act === 'suiv') { if (ch < livre.chapitres.length - 1) { ch++; afficher(0); } else { prog[livre.id] = { ch: ch, pos: 1, t: Date.now() }; ecrire('prog', prog); $('.nxl-liseuse', f).hidden = true; grille(); } }
    else if (act === 'abonner') { abonner(); }
    else if (act === 'importer') { var fi = $('.nxl-fichier', f); if (fi) fi.click(); }
  }
})();
