# Rapport de dernier contrôle — Nexora V504

Date : 9 août 2026 (UTC)

## Résultat

| Axe | Note | Conclusion |
|---|---:|---|
| Sécurité avant déploiement | 82/100 | Bonne protection applicative, deux durcissements d’infrastructure restent nécessaires pour une très forte charge. |
| Fluidité | 76/100 | Cache et tâches périodiques améliorés, mais le document autonome demeure volumineux. |
| Erreurs de code | 90/100 | Aucune erreur de syntaxe ou de démarrage détectée ; les tests réels Supabase/paiement/appareils restent à exécuter. |
| Doublons | 92/100 | Aucun identifiant, corps de script ou bloc CSS strictement dupliqué ; clones structurels résiduels faibles. |
| **Moyenne** | **85/100** | **GO préproduction ; GO public après la liste de contrôle réelle.** |

## Vérifications exécutées

- 0 erreur d’analyse JavaScript sur les 4 pages HTML.
- 0 erreur d’analyse CSS.
- 0 identifiant HTML dupliqué.
- 0 corps de script intégralement dupliqué.
- 0 règle CSS exacte dupliquée.
- 0 lien `_blank` sans protection `noopener`.
- Test de démarrage DOM : 4 811 éléments, 46 scripts, aucun élément critique manquant et aucune exception JavaScript.
- API de clé : 9 scénarios réussis (méthode, authentification, JSON, type et taille, JWK, session, abonnement et enveloppement RSA).
- Les 52 fichiers de `protected/` (manifeste et 51 ressources chiffrées), soit 17 762 642 octets, sont identiques bit à bit à l’archive source.
- Recherche de secrets : aucune clé privée, clé Supabase privilégiée, clé Stripe secrète ou jeton GitHub trouvé dans le paquet final.
- Détection de clones sur les scripts et styles extraits : 1,80 % de lignes dupliquées au seuil de 8 lignes/70 jetons. Elles concernent surtout des moteurs autonomes et les variantes de niveaux scolaires ; les mutualiser dans cette version aurait créé un risque de régression supérieur au gain.

## Mesures de fluidité

- `index.html` : environ 3,90 Mo brut et 0,95 Mo avec gzip maximal.
- Architecture autonome : 46 scripts et 4 811 nœuds au démarrage.
- Les rafraîchissements d’aperçu sont moins fréquents et s’arrêtent lorsque la page est masquée.
- Le service worker ne met jamais en cache les réponses API ni les fichiers protégés via sa stratégie publique.

Cette architecture reste utilisable avec compression HTTP et cache PWA, mais n’est pas légère. La prochaine étape de performance est une modularisation avec chargement différé par écran ; elle ne doit pas être faite juste avant le lancement sans une campagne E2E complète.

## Risques résiduels honnêtes

1. La CSP contient encore `unsafe-inline`, imposé par les scripts, styles et gestionnaires historiques intégrés au fichier autonome. La protection est donc moins forte qu’une CSP à nonces/hachages.
2. La limite de fréquence de l’API est efficace sur une instance chaude mais pas distribuée entre toutes les fonctions serverless.
3. Les règles RLS Supabase, le fournisseur de paiement, les DNS, les variables Vercel et les flux mobiles réels ne peuvent pas être certifiés depuis le ZIP seul.
4. Les variantes scolaires partagent encore de petits fragments de logique. Elles sont mesurées, non strictement dupliquées dans leur totalité, et ont été laissées en place pour éviter une régression tardive.

## Décision de lancement

Le paquet est adapté à un déploiement de préproduction immédiat. Pour un lancement public à grande échelle, le feu vert final dépend des tests du domaine réel listés dans `LISEZ-MOI_V504_FINAL.md` et de la mise en place d’une limitation distribuée sur l’API de clé.
