# Validation Nexora V212

- Le défaut de V211 a été identifié : `index.html` ouvert ou téléchargé seul ne disposait pas de ses scripts et styles externes ; les conteneurs Modules et Jeu Adams restaient donc vides.
- Le ZIP V212 contient le projet complet et conserve les ressources premium chiffrées de V211.
- Un garde de rendu relance automatiquement l’affichage des 22 modules et des cartes Jeu Adams si leur premier rendu n’a pas abouti.
- Un fichier autonome `NEXORA_V212_VERIFICATION_INTERFACE.html` permet de contrôler l’interface publique sans exposer les cours ni les plateaux premium en clair.
- La version du cache du service worker a été changée afin de remplacer l’ancienne interface V211 après redéploiement.
- Les 45 ressources protégées et leur manifeste sont conservés sans modification de contenu.
- KDO reste obligatoirement connecté.

## Test de rendu exécuté
- 22 modules affichés dans le centre de formation.
- 18 cartes Jeu Adams affichées.
- 5 entrées visibles dans Académie.
- `window.NexoraApp`, `window.NexoraAdamsGames` et `window.NexoraSecureContent` initialisés.
- Aucun fichier premium `.nxe` modifié par rapport à V211.
