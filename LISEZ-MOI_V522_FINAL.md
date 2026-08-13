# NEXORA V522 — VERSION FINALE PRÊTE POUR VERCEL

## Déploiement

1. Décompressez le ZIP.
2. Déposez **tout le contenu du dossier à la racine du projet Vercel**.
3. Conservez la variable Vercel `NEXORA_CONTENT_KEY_B64` déjà configurée.
4. Lancez le déploiement, puis ouvrez `/version.json` : la version affichée doit être `V522`.

Si vous réutilisez le même projet Vercel et le même projet Supabase, les variables déjà configurées restent en place. Ne publiez jamais la valeur de `NEXORA_CONTENT_KEY_B64` dans un fichier ou une capture.

## Dernières corrections intégrées

- ouverture locale rapide, sans attendre Supabase pour afficher l’interface ;
- écran de création de compte ramené directement au nom, à l’email et au mot de passe ;
- photo, téléphone, métier et ville regroupés dans une rubrique facultative fermée ;
- bouton **Activer mon compte** visible sous chaque tarif ;
- confirmation **Durée sélectionnée** après le choix d’une formule ;
- cache Vercel/PWA passé en V522 pour empêcher le maintien de l’ancien fichier d’abonnement ;
- métadonnées `index.html`, `version.json`, `package.json` et service worker rendues cohérentes ;
- sélecteur CSS KDO du mode sombre corrigé ;
- aucun doublon binaire dans le paquet d’exécution ;
- 51 contenus protégés présents avec les tailles attendues.

## Contrôles finaux passés

- syntaxe de tous les fichiers JavaScript : valide ;
- syntaxe des scripts intégrés : valide ;
- syntaxe CSS : valide ;
- JSON Vercel, manifestes et version : valides ;
- références locales et fichiers protégés : complets ;
- ouverture, fermeture du splash et affichage de l’accueil : validés ;
- chargement à la demande Académie, Jeu Adams, Abonnement/KDO et Réseau : validé ;
- création de compte : champs essentiels en premier et rubrique facultative repliée ;
- API protégées : refus correct des demandes non connectées ;
- Supabase Auth : service joignable et inscription autorisée ;
- catalogue d’abonnement : 8 formules reçues et numéro marchand disponible.

## Important

Le code et le paquet ont passé tous les contrôles automatisés disponibles. L’activation réelle d’un abonnement reste déterminée par les données, fonctions RPC, règles RLS et variables déjà présentes dans votre projet Supabase/Vercel.
