/* V747 — Illustrations de Nexora (portes d'entrée, cycles élèves, domaines pro).
   Ajoute des images légères (WebP, chargées seulement quand on ouvre la rubrique)
   sans toucher au contenu existant. Si une image manque, elle disparaît sans bruit. */
(function () {
  'use strict';
  if (window.__nxImagesV747) return;
  window.__nxImagesV747 = true;
  var D = '/assets/img/';
  var CYCLES = { maternelle: ['nx-maternelle', 'Enfants de maternelle qui dessinent et chantent'], primaire: ['nx-primaire', 'Classe de primaire'], college: ['nx-college', 'Collégiens qui travaillent en groupe'], lycee: ['nx-lycee', 'Lycéens qui préparent le BAC'] };
  var PRO = { direction: ['nx-pro-direction', 'Réunion de direction et planification'], entreprise: ['nx-pro-entreprise', 'Jeune entrepreneur dans son commerce'], numerique: ['nx-pro-numerique', 'Outils numériques et sécurité en ligne'], emploi: ['nx-pro-emploi', 'Entretien d’embauche'], sante: ['nx-pro-sante', 'Formation aux premiers secours'], societe: ['nx-pro-societe', 'Échange sur les droits et la société'] };
  var PORTES = { eleves: ['nx-porte-eleves', 'Élèves qui entrent dans l’espace Élèves'], pro: ['nx-porte-pro', 'Professionnels qui entrent dans l’espace Professionnel'] };

  var css = document.createElement('style');
  css.textContent = [
    '.nxi-img{display:block;width:100%;height:auto;aspect-ratio:960/508;object-fit:cover;border-radius:10px;background:#DDE3EA}',
    '.nxi-ban{margin:0 0 12px;padding:0;border:0}',
    '.nxi-duo{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 12px}',
    '.nxi-duo .nxi-img{aspect-ratio:3/2}',
    '.nxi-porte{display:block;width:100%;height:150px;aspect-ratio:auto;object-fit:cover;object-position:50% 60%;border-radius:8px;margin:0 0 12px;position:relative;z-index:1}',
    '.nx-porte-v510 .nxi-porte+.nx-porte-rang-v510{margin-top:2px}'
  ].join('');
  (document.head || document.documentElement).appendChild(css);

  function img(nom, alt, cls) {
    var i = new Image();
    i.className = cls || 'nxi-img';
    i.alt = alt || '';
    i.loading = 'lazy';
    i.decoding = 'async';
    i.width = 960; i.height = 508;
    i.onerror = function () { var p = i.parentNode; if (p && p.classList.contains('nxi-ban')) p.remove(); else i.remove(); };
    i.src = D + nom + '.webp';
    return i;
  }
  function banniere(nom, alt) {
    var f = document.createElement('div');
    f.className = 'nxi-ban'; f.setAttribute('data-nxi', '1');
    f.appendChild(img(nom, alt));
    return f;
  }
  function deja(parent) { return parent.querySelector(':scope > [data-nxi]'); }

  function poser() {
    var k, s, c, b, p;
    document.querySelectorAll('[data-nx-porte-v510]').forEach(function (btn) {
      var d = PORTES[btn.getAttribute('data-nx-porte-v510')];
      if (!d || btn.querySelector('[data-nxi]')) return;
      p = img(d[0], d[1], 'nxi-porte'); p.removeAttribute('width'); p.removeAttribute('height'); p.setAttribute('data-nxi', '1');
      p.setAttribute('aria-hidden', 'true'); p.alt = '';
      btn.insertBefore(p, btn.firstChild);
    });
    document.querySelectorAll('[data-nx-cycle-v406]').forEach(function (sec) {
      k = sec.getAttribute('data-nx-cycle-v406');
      c = sec.querySelector(':scope > .nx-volet-corps-v510');
      if (!c || deja(c)) return;
      if (CYCLES[k]) { c.insertBefore(banniere(CYCLES[k][0], CYCLES[k][1]), c.firstChild); }
      else if (k === 'ressources') {
        b = document.createElement('div'); b.className = 'nxi-duo'; b.setAttribute('data-nxi', '1');
        b.appendChild(img('nx-sujets', 'Réviser avec des sujets d’examen'));
        b.appendChild(img('nx-romans', 'Lire un roman sous un manguier'));
        c.insertBefore(b, c.firstChild);
      }
    });
    document.querySelectorAll('[data-nx-pro-family-v343]').forEach(function (sec) {
      k = sec.getAttribute('data-nx-pro-family-v343');
      if (!PRO[k]) return;
      c = sec.querySelector('.nx-volet-corps-v510');
      if (!c || deja(c)) return;
      c.insertBefore(banniere(PRO[k][0], PRO[k][1]), c.firstChild);
    });
  }

  var t = null;
  function planifier() { if (t) return; t = setTimeout(function () { t = null; try { poser(); } catch (_e) {} }, 250); }
  function demarrer() {
    poser();
    try { new MutationObserver(planifier).observe(document.body, { childList: true, subtree: true }); } catch (_e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer); else demarrer();
})();
