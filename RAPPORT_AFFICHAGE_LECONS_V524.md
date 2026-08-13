# Nexora — analyse générale de l’affichage des leçons

Base analysée : `NEXORA_V523_FINAL_VERCEL_PRET_A_REDEPLOYER.zip` (78 fichiers, `index.html` 1,85 Mo).
Livraison : **V524**.

---

## 0. Portée de l’analyse

Les textes des leçons sont chiffrés dans `protected/files/*.nxe` : sans la clé
`NEXORA_CONTENT_KEY_B64`, ils ne sont pas lisibles. L’analyse porte donc sur la
**couche d’affichage** — le code qui met les leçons en page. C’est précisément là
que se trouvaient les défauts que tu voyais.

Cinq familles de leçons cohabitent dans Nexora, chacune avec son propre moteur :

| Famille | Moteur | Feuille |
|---|---|---|
| Collège 7ème, 8ème, 9ème | `renderCourse()` × 3 | règles `.nx7-*` dans `index.html` |
| Lycée 11ème, 12ème, Terminale | `renderContent()` + `nxLyceeCorps_v472()` | `assets/css/nexora-academy-*.css` |
| Primaire CP1 → CM2 | `nx-v157-primary-school-script.js` (chiffré) | règles `.nx-primary-*` |
| Sujets BAC & Brevet | `correctionMarkup()` | *aucune* |
| Modules professionnels | lecteur de `cours.json` | règles `.nx-academy-*` |

---

## 1. Les défauts trouvés

### 1.1 La Terminale n’avait aucun style — le plus grave

Les trois classes du lycée appellent la même fonction avec un préfixe différent :

```
11ème     → nxLyceeCorps_v472(l, 'nx-eleventh-v472')   → 52 règles CSS
12ème     → nxLyceeCorps_v472(l, 'nx-twelfth-v472')    → 52 règles CSS
Terminale → nxLyceeCorps_v472(l, 'nx-terminal-v472')   →  0 règle CSS
```

Le préfixe de la Terminale n’existait **nulle part** dans la feuille. Conséquence :
définition du thème, objectif, plan du cours, formulaire, notions essentielles,
pièges, exemple, méthode, exercices et corrections s’affichaient en texte brut
empilé — pas de cadre, pas de couleur, le titre du bloc collé à son contenu sur la
même ligne, les `<h5>` des parties au corps par défaut du navigateur.

C’est un défaut de conception : le lien entre le moteur et la feuille reposait sur
une chaîne de caractères recopiée à la main. Il pouvait se reproduire à chaque
nouvelle classe.

### 1.2 La correction des sujets BAC/Brevet n’était pas habillée

`correctionMarkup()` produit cinq classes : `nx-exam-correction-v436`,
`nx-exam-appreciation-v436`, `nx-exam-correction-grid-v436`,
`nx-exam-expectations-v436`, `nx-exam-correct-v436`. **Aucune** n’a de règle.
Résultat pour l’élève qui vient de rendre une dissertation : la note sur 20 tombe
seule sur une ligne, « Points réussis » et « À améliorer » s’empilent au lieu de
former deux colonnes, les quatre titres `h4` ont tous la même taille que le texte.

### 1.3 Leçons visuellement restreintes

| Endroit | Ce qui se passait |
|---|---|
| `.nx-primary-lesson-row-v145 p` | résumé de la séance en **11,8 px** et coupé net à **2 lignes** |
| `.nx-primary-head-copy-v145 h2` | titre de la fenêtre en `white-space:nowrap` → coupé à **1 ligne** |
| `.nx7-top-copy-v349 strong` | titre de la leçon du collège coupé à **1 ligne** |
| `.nx-twelfth-body-v369` et `.nx-terminal-body-v475` | `padding-left:64px` **sans media query** → sur un téléphone de 360 px, il ne restait que ~280 px de largeur au texte |

### 1.4 Trous d’affichage

- **Paragraphes vides.** Quand une leçon du lycée n’a ni `plan` ni `p1/p2/p3`, le
  moteur écrivait quand même `<p></p><p></p><p></p>` : trois blancs au milieu du cours.
- **Numérotation qui saute.** Au collège, les neuf parties portaient des numéros
  figés de 2 à 10. Une leçon sans « Origine ou historique » affichait donc
  2, 4, 5, 6… L’en-tête annonçait « 1. Thème » alors que le corps repartait à 2.
- **Corrections fantômes.** Un exercice sans correction affichait quand même le
  bouton « Voir la correction détaillée », qui ouvrait sur du vide.

### 1.5 Lisibilité

Tout le texte des cours du collège était en **demi-gras** (`font-weight:600`, et
jusqu’à 750 dans le primaire) en 15 px. Le gras appliqué à un texte entier annule
sa fonction : plus rien ne ressort, et la lecture longue fatigue. Aucune largeur de
lecture maximale n’était posée : sur une tablette, les lignes de cours faisaient
plus de 110 caractères, bien au-delà des 60 à 75 lisibles.

### 1.6 Deux défauts hérités, corrigés au passage

- **106 Ko de CSS en double.** La feuille `nexora-academy-v518.0.css` (105 898 o)
  était recopiée **entière** dans le `<style>` du document *et* chargée en fichier
  séparé à la demande. Le document la faisait donc analyser au démarrage pour rien.
- **Marquages de version contradictoires.** `<meta nexora-release>` valait V522,
  `version.json` annonçait V523, `package.json` 523.0.0. Le comparateur de
  `nexora-pwa.js` lit le `<meta>` : le bandeau « Nouvelle version disponible »
  restait donc affiché en permanence.

---

## 2. Ce qui a été fait — V524

### 2.1 Un seul habillage pour les trois classes du lycée

`nxLyceeCorps_v472()` n’utilise plus le préfixe reçu en argument : elle écrit
toujours `nx-lecon-v524` et enveloppe le tout dans un conteneur portant cette
classe. Les deux familles `.nx-eleventh-v472-*` et `.nx-twelfth-v472-*` ont été
remplacées par une famille unique. **La Terminale est traitée exactement comme la
11ème et la 12ème, et une quatrième classe le sera automatiquement.**

Habillage : texte 16 px, graisse 400, interligne 1,75, largeur de lecture 66
caractères. Blocs encadrés avec filet de couleur à gauche — ardoise pour la
définition, bleu pour le formulaire et le « À retenir », rouge brique pour les
pièges. Formulaire en police à chasse fixe avec défilement horizontal si la formule
dépasse. Parties du cours numérotées dans une pastille. Exercices numérotés, chacun
avec sa correction repliée dans un `<details>` de 44 px de haut, tactile.
Mode sombre complet.

### 2.2 La correction des sujets devient une carte

Bandeau d’ardoise portant le titre du sujet et la note dans un cadre à droite,
appréciation sur fond cendre, puis « Points réussis » et « À améliorer » sur deux
colonnes (une seule sous 560 px), avec des puces vertes d’un côté et rouges de
l’autre. Attentes, plan conseillé et conseils en dessous.

### 2.3 Les restrictions levées

- Résumé de séance du primaire : **13,5 px sur 3 lignes** au lieu de 11,8 px sur 2.
- Titre de la fenêtre primaire et titre de la leçon du collège : **2 lignes**.
- 11ème, 12ème et Terminale : sous 560 px, le retrait de 64 px tombe à 16 px —
  le texte récupère 48 px de largeur sur chaque leçon.

### 2.4 Les trous bouchés

Les paragraphes vides, les blocs vides et les corrections fantômes ne sont plus
produits : chaque champ est filtré avant d’être écrit. La numérotation des parties
du collège est **calculée au moment du rendu** : 1, 2, 3… sans trou, quelles que
soient les parties présentes. L’en-tête dit « Thème » et non plus « 1. Thème ».

### 2.5 La lecture

Cours du collège : 16 px, graisse 400, interligne 1,78, largeur limitée à 68
caractères et bloc centré. Titres de partie à l’ardoise, un cran plus grands.
« À retenir » et « Exercices » redessinés en cartes à filet. La barre
« ← Toutes les leçons / Précédente / Marquer comme lue / Suivante → » devient
**collante en bas de l’écran** : elle reste sous le pouce pendant toute la lecture.

Une **feuille d’impression** a été ajoutée : commandes retirées, corrections
dépliées, noir sur blanc, coupures de page évitées au milieu d’une partie. Les
écoles sans écran peuvent imprimer une leçon telle quelle.

### 2.6 Nettoyage

Copie du CSS retirée du document : `index.html` passe de **1 840 067 o à
1 734 830 o** (−105 237 o). Les fichiers modifiés sont renommés
`nexora-academy-v524.css` et `nexora-academy-v524.js` — **obligatoire** : ton
service worker garde `/assets/` en cache définitivement par URL, un fichier de même
nom ne serait jamais rechargé. Marquages alignés sur V524 partout, cache PWA
`nexora-v524-coque-1`.

---

## 3. Contrôles passés

| Contrôle | Résultat |
|---|---|
| Syntaxe des 8 fichiers JavaScript | valide |
| Syntaxe des 5 blocs script intégrés | valide |
| Accolades des 3 blocs `<style>` | 20/20, 25/25, 4750/4750 |
| Accolades des 3 feuilles `assets/css` | 941, 162, 79 — équilibrées |
| `manifest.json`, `version.json`, `package.json`, `vercel.json`, `protected/manifest.json` | valides |
| Chemins `./assets/` et `./modules/` référencés | tous présents sur le disque |
| Fichiers protégés | 51 entrées, 51 fichiers présents |
| Rendu comparé avant/après (banc automatique) | paragraphes vides 3 → **0** ; numéros collège `2,4,5,6,7,8,9,10` → **`1,2,3,4,5,6,7,8`** ; classes sans style 27 → **0** |

---

## 4. Ce qui reste ouvert

1. **Le contenu lui-même.** Je n’ai pas pu le relire : il est chiffré. Si tu me
   donnes `NEXORA_CONTENT_KEY_B64`, je peux vérifier que chaque leçon remplit bien
   les champs que le moteur attend — la V524 masque proprement les champs vides,
   mais elle ne les remplit pas.
2. **Le primaire.** Son moteur est chiffré : seules ses règles de style ont été
   corrigées. Le corps de la leçon garde des textes en 11,5 à 13,5 px, à revoir.
3. **La dette de la feuille.** 2 018 `!important` et 217 media-queries subsistent.
   Trois couches de style s’y superposent depuis la V32. C’est un chantier à part.
4. **L’atelier créatif de la Maternelle** garde sa présentation sombre.
5. **Le panneau d’administration** est resté à l’ancienne palette.
