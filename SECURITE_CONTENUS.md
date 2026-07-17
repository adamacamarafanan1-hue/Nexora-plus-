# Sécurité des contenus — Nexora V211

## Protection appliquée

- 45 ressources premium chiffrées en AES-256-GCM.
- 13 767 001 octets de contenus en clair retirés du projet public.
- Suppression des fichiers en clair du BAC, de la 10e année/BEPC, de l’Orientation, des 22 formations, de l’École primaire, de Recherche des lettres et des 18 plateaux Jeu Adams.
- Les anciens chemins publics des contenus premium n’existent plus et renvoient une réponse 404.
- `api/content-key.js` refuse toute demande sans session Supabase valide.
- La clé n’est délivrée qu’après confirmation d’un abonnement actif comportant une date d’expiration future.
- La clé AES est enveloppée en RSA-OAEP avec la clé publique propre au téléphone.
- La clé privée du téléphone et la clé de contenu sont enregistrées comme `CryptoKey` WebCrypto non exportables dans IndexedDB.
- Les contenus hors connexion restent chiffrés dans Cache Storage et ne sont déchiffrés qu’en mémoire au moment de l’ouverture.
- Le service worker ne précharge aucun contenu premium en clair et supprime les anciens caches V210.
- L’autorisation locale utilise l’heure serveur mémorisée et détecte un recul anormal de l’horloge du téléphone.
- À l’expiration, à la révocation, au changement de compte ou à la déconnexion, la clé locale est supprimée et les vues premium sont fermées.
- Tous les Jeux Adams, y compris Jeu Adams Guinée et l’accès par code de partie, exigent l’abonnement.
- Les résultats joués hors connexion ne déclenchent aucun RPC Supabase et ne comptent pas pour KDO.

## Ce que voit une personne recevant seulement le lien

Elle peut charger l’interface publique et les informations générales. Les paquets `.nxe` qu’elle peut éventuellement télécharger sont chiffrés et inutilisables sans la clé délivrée par l’API après vérification de son abonnement.

## Limite honnête

Aucune application Web utilisable hors connexion ne peut être rendue absolument inviolable contre un spécialiste contrôlant totalement un appareil légitimement abonné. Cette architecture empêche toutefois l’accès par simple lien, l’ouverture directe des fichiers, l’exploitation normale du cache et la copie triviale des contenus par une personne non abonnée.
