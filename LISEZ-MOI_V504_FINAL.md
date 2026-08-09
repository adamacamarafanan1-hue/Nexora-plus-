# Nexora V504 — paquet final audité

Cette version consolide directement la V503 sans empiler de correctifs au chargement. Elle conserve les 51 ressources payantes chiffrées et la version de contenu sécurisé `v502-20260808-1` afin de rester compatible avec la clé de production existante.

Le fichier principal à servir sur Vercel est `index.html`. Une copie autonome nommée `NEXORA_AUTONOME_V504.html` est également incluse à la racine pour vérifier l’interface, sans remplacer `index.html` lors du déploiement.

## Correctifs intégrés

- API `content-key` renforcée : méthode POST obligatoire, taille et type du corps contrôlés, JSON invalide refusé, validation stricte de la clé RSA publique, délai maximal sur Supabase, limitation de fréquence par session/IP et réponses non mises en cache.
- Clé de contenu livrée uniquement sous forme enveloppée RSA-OAEP après validation de la session et d’un abonnement actif.
- En-têtes Vercel complétés : CSP, HSTS, anti-cadrage, isolation d’origine, politique de permissions, refus du sniffing et caches explicites.
- Cache PWA V504 fiabilisé : navigation réseau en priorité, repli hors ligne, mise à jour contrôlée et exclusion totale de `/api/` et `/protected/`.
- Icônes PWA 192 et 512 px ajoutées avec manifeste installable complet.
- Cibles `postMessage` limitées à l’origine courante sur HTTP(S).
- Boucles d’aperçu ralenties et suspendues quand l’onglet est masqué.
- Structure HTML réparée : fermetures parasites, éléments `main` imbriqués, contrôle masqué focusable, contenu invalide dans les boutons et types de champs manquants.
- Doublon CSS exact supprimé.

## Déploiement Vercel

1. Déployer le contenu de ce dossier à la racine du projet.
2. Conserver ou créer la variable secrète `NEXORA_CONTENT_KEY_B64` avec la clé de contenu déjà utilisée par Nexora. Elle doit décoder exactement 32 octets.
3. Ne jamais placer cette clé dans le HTML, Supabase, un message ou une capture.
4. `SUPABASE_URL` et `SUPABASE_PUBLISHABLE_KEY` peuvent être définies côté serveur ; les valeurs publiques actuelles restent prévues comme repli.
5. Relancer un déploiement après toute modification de variable d’environnement.

## Contrôle obligatoire en préproduction

- Sans connexion : appel `/api/content-key` refusé.
- Session expirée : refus 401.
- Compte sans abonnement : refus 403.
- Abonnement actif : cours déchiffré et date de fin correcte.
- URL `/protected/files/*.nxe` : données binaires chiffrées uniquement.
- Installation PWA, mise à jour V503 vers V504 et démarrage hors ligne testés sur Android et iPhone.
- Paiement, KDO, Jeu Adams, Académie et parcours de connexion testés sur le domaine réel.

## Verdict d’audit

Note globale : **85/100 — prêt pour la préproduction, lancement public conditionnel**.

Avant une forte montée en charge, ajouter une limitation distribuée devant `/api/content-key` (pare-feu Vercel, Redis ou équivalent) et programmer la suppression progressive des scripts/attributs inline afin de retirer `unsafe-inline` de la CSP. Les politiques RLS Supabase, les paiements et le comportement sur le domaine réel doivent être validés dans l’environnement de production : ils ne sont pas entièrement vérifiables depuis une archive statique.

Voir `RAPPORT_AUDIT_V504.md` pour les mesures et les réserves détaillées.
