# NEXORA V524 — AFFICHAGE PREMIUM DES LEÇONS

## Déploiement

1. Décompresse le ZIP.
2. Les fichiers Vercel sont déjà placés directement à la racine du ZIP.
3. Remplace **tout le contenu** du dépôt GitHub par tous les fichiers et dossiers
   extraits, sans ajouter de dossier intermédiaire.
4. Garde la variable Vercel `NEXORA_CONTENT_KEY_B64` déjà configurée. Elle ne change pas.
5. Vercel redéploie la branche principale. Ouvre ensuite `/version.json` : la version
   affichée doit être **V524**.
6. Sur le téléphone, ferme puis rouvre Nexora. Si l’ancienne version reste visible,
   actualise une fois la page.

**Aucun SQL à exécuter cette fois.** Le SQL de la V523
(`SUPABASE_CORRECTION_ACCES_V523.sql`) est la version corrigée compatible avec la
base actuelle : comme elle a déjà été exécutée avec succès, ne la rejoue pas.

## Deux fichiers ont changé de nom — c’est voulu

`assets/css/nexora-academy-v518.0.css` → `assets/css/nexora-academy-v524.css`
`assets/js/nexora-academy-v521.js` → `assets/js/nexora-academy-v524.js`

Le service worker garde les fichiers d’`/assets/` **définitivement** en cache, par
URL. Un fichier corrigé qui garderait son nom ne serait jamais rechargé sur les
téléphones qui ont déjà ouvert Nexora. Le changement de nom est ce qui fait arriver
la correction chez les élèves.

## Ce que la V524 corrige

- **Terminale** : le corps des leçons n’avait aucune règle de style et s’affichait en
  texte brut. Les trois classes du lycée partagent désormais un habillage unique.
- **Sujets BAC et Brevet** : la correction rendue à l’élève (note, appréciation,
  points réussis, à améliorer, plan conseillé) n’était pas habillée non plus.
- **Textes coupés** : résumé de séance du primaire (2 lignes → 3), titre de la fenêtre
  primaire et titre de la leçon du collège (1 ligne → 2).
- **Texte à l’étroit** : sur téléphone, les leçons de 12ème et de Terminale gardaient
  un retrait de 64 px à gauche. Il tombe à 16 px sous 560 px de large.
- **Blocs vides** : plus de paragraphes vides, de blocs vides ni de boutons de
  correction qui ouvrent sur du vide.
- **Numérotation** : les parties du cours au collège sont numérotées 1, 2, 3… sans
  trou, quelles que soient les parties présentes dans la leçon.
- **Lisibilité** : cours en 16 px graisse normale (au lieu de 15 px en demi-gras),
  interligne 1,78, largeur de lecture limitée, titres de partie à l’ardoise.
- **Navigation** : la barre « Précédente / Marquer comme lue / Suivante » reste
  collée en bas pendant la lecture.
- **Impression** : une leçon s’imprime maintenant proprement, corrections dépliées.
- **Poids** : la feuille de l’Académie était recopiée entière dans le document
  *et* chargée en fichier séparé. `index.html` perd 105 Ko.
- **Bandeau de mise à jour** : les marquages de version se contredisaient
  (`<meta>` V522, `version.json` V523). Tout est aligné sur V524.

## Ce qui n’a pas été touché

Les textes des leçons eux-mêmes : ils sont chiffrés dans `protected/`. La V524
change la mise en page, pas le contenu. Le moteur du primaire est chiffré lui aussi ;
seules ses règles de style ont été corrigées.

## Pour vérifier avant de déployer

Ouvre `APERCU_LECONS_V524.html` dans Chrome, sur le téléphone. C’est un fichier
autonome, sans connexion : il montre les quatre familles de leçons avec une bascule
**Avant / Après**.
