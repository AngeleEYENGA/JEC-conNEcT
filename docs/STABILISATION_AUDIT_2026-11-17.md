# JEC-conNEcT — audit de stabilisation

**Date :** 17 novembre 2026  
**Branche de travail :** `feat/jec-connect-stabilisation-20261117`  
**Branche de référence :** `feat/jec-digital-archives`  
**Périmètre :** audit en lecture seule de Supabase et du dépôt, correctifs d'authentification sur une branche de prévisualisation.

## Résultat de la première stabilisation

- Le projet de référence est la branche `feat/jec-digital-archives` (commit de départ `c56d5e159a5689a4dad893c2cfe358db86119ae3`). La branche `main` est en retard et ne doit pas servir de base à ces évolutions.
- Une garde serveur dans `proxy.ts` protège désormais les routes privées identifiées : compte, espaces de travail, messagerie, réunions, décisions/votes, projets, documents, gestion et partenaires.
- La page de connexion conserve la destination demandée après connexion, avec validation du chemin relatif afin d'éviter les redirections externes.
- La compilation Vercel, la vérification TypeScript et la génération des 23 pages ont réussi sur le déploiement de prévisualisation.
- Les routes privées testées sans session sont réécrites vers `/login`. Les routes publiques testées (`/`, `/decouvrir`, `/annuaire`, `/archives`, `/chants`) restent accessibles sans compte.
- Aucun changement n'a été déployé sur l'environnement de production.

## Sécurité Supabase observée

- Les 43 tables applicatives du schéma `public` ont RLS activé.
- Trois tables des bulletins secrets (`jec_governance_eligible_voters`, `jec_governance_vote_choices`, `jec_governance_vote_submissions`) ont RLS activé sans politique client. C'est cohérent avec leur accès exclusivement via les fonctions RPC contrôlées ; ne pas ajouter de politique générique.
- Les fonctions privilégiées inspectées utilisent `SECURITY DEFINER` avec `search_path` vide.
- L'analyse Supabase signale que la protection des mots de passe compromis n'est pas activée. Ce réglage doit être vérifié dans les paramètres Auth du projet.
- L'analyse de performance signale plusieurs clés étrangères sans index dédié. Il faudra les prioriser selon les requêtes réellement utilisées, et non créer des index indistinctement.

## Stockage et médias

- `jec-archives`, `jec-partner-documents` et `jec-workspace-documents` sont des buckets privés.
- Les buckets `jec-audio` et `jec-audio-public` sont publics par conception : la migration musicale précise qu'un enregistrement sauvegardé dans la bibliothèque est destiné à être écouté et téléchargé publiquement.
- Le bucket `jec-audio` contient actuellement un seul objet, référencé par une fiche marquée comme publiée ; aucun objet sans métadonnée n'a été relevé. Le comportement public est conservé pour ne pas casser la bibliothèque musicale.

## IA locale

- `jec-ai-local` exige un JWT valide et vérifie l'utilisateur avant de créer ou lire ses tâches.
- `jec-ai-worker` n'exige pas le JWT Supabase standard, mais vérifie un jeton dédié dont seul le hash est stocké côté fonction. Il est limité à l'agent déclaré.
- Les anciens points d'entrée `jec-ai` et `jec-ai-agent` restent techniquement actifs, mais leur code répond `410 Gone`. Ils ne doivent pas être utilisés par le client.
- L'inférence reste locale sur la machine Ollama ; la file d'attente et les sources de connaissance résident néanmoins dans Supabase.

## Réunions et appels

- L'API `/api/meeting/ice-config` vérifie la session, puis l'inscription acceptée/présente à la réunion avant de délivrer la configuration ICE. La réponse porte `Cache-Control: private, no-store`.
- Les appels réels à plusieurs comptes et depuis des réseaux différents restent à tester. La présence du code ne suffit pas à certifier la stabilité WebRTC en conditions réelles.

## Données et architecture à reprendre

- L'annuaire institutionnel contient une entrée publiée explicitement décrite comme une donnée de test. Une migration dédiée la dépublie sans effacer l'enregistrement : `202611170001_unpublish_unverified_directory_test_entry.sql`. Cette migration est ajoutée au dépôt mais n'a pas été appliquée à la base de production.
- L'annuaire actuel est un organigramme de personnes/fonctions, pas encore un référentiel d'organisations et de groupes locaux géolocalisés.
- Les espaces de travail présents dans la base sont encore des espaces de test temporaires. Les rattachements pays / mouvement national / groupe local ne sont pas encore implémentés.
- La table de membres actuelle comporte des adhésions en attente et vérifiées, mais les lignes observées n'ont pas de structure renseignée. Il ne faut pas en déduire une cartographie réelle des groupes.
- Les votes sont déployés côté interface et base, mais aucun scrutin réel n'a encore été validé avec plusieurs comptes.

## Prochaines priorités de développement

1. Définir le modèle multi-organisations (international → mouvement national → groupe local), ses adhésions multiples et ses rôles, avec isolation stricte des données.
2. Créer un référentiel public d'organisations/groupes distinct de l'annuaire nominatif, avec contacts institutionnels et consentement de publication.
3. Relier progressivement les espaces et modules à une organisation sans modifier les droits historiques des espaces existants.
4. Valider les parcours de connexion, adhésion, votes, réunions et fichiers avec plusieurs comptes réels.
5. Concevoir les notifications e-mail après vérification du fournisseur d'envoi, des coûts et des préférences anti-spam.

## Références techniques

- Supabase SSR / Next.js : https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Supabase Storage : https://supabase.com/docs/guides/storage/buckets/fundamentals
- Supabase Auth / mots de passe compromis : https://supabase.com/docs/guides/auth/password-security
