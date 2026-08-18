/* ═══════════════════════════════════════════════════════════════════════════
   V542 · FICHIER D'ESSAI — VOLONTAIREMENT VIDE

   Ce fichier ne fait rien d'autre que signaler qu'il a bien ete charge.
   Objectif de cette premiere etape : verifier que Nexora s'ouvre normalement
   avec la ligne ajoutee par le service worker.

   Si tout va bien, ce fichier recevra ensuite l'ecran de reglages :
   compte, abonnement et sa date de fin, bouton « vider et recharger »,
   lien vers le service client.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  try {
    window.__nxReglagesCharge = true;
    if (window.console && console.log) {
      console.log('Nexora : fichier de reglages charge (essai V542).');
    }
  } catch (_e) {}
})();
