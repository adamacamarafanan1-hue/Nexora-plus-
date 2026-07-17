# Nexora V212 — Déploiement Vercel

## Fichier à déployer
Décompressez le ZIP puis importez **tout le dossier** dans Vercel. Ne déployez jamais `index.html` seul : il dépend de `assets/`, `protected/`, `modules/`, `api/`, `service-worker.js` et des autres fichiers racine.

## Vérification avant déploiement
Le fichier `NEXORA_V212_VERIFICATION_INTERFACE.html` est autonome uniquement pour vérifier visuellement l’interface publique, la liste des 22 modules et la liste des Jeux Adams. Les contenus premium chiffrés ne s’ouvrent qu’après déploiement sur Vercel, connexion au compte et validation de l’abonnement.

## Clé obligatoire dans Vercel
Dans **Settings → Environment Variables**, ajoutez :

- Nom : `NEXORA_CONTENT_KEY_B64`
- Valeur : la valeur privée fournie séparément, située après le signe `=`
- Environnements : Production, Preview et Development

Puis effectuez un nouveau déploiement.

## Fonctionnement
- L’interface et les listes publiques s’affichent même sans abonnement.
- Les cours et Jeux Adams restent chiffrés.
- Après validation de l’abonnement en ligne, les contenus autorisés sont téléchargés et restent utilisables hors connexion jusqu’à l’expiration.
- KDO exige toujours une connexion Internet.
