# JEC-conNEcT — audit de stabilisation

**Date :** 18 novembre 2026  
**Branche de travail :** `feat/jec-connect-stabilisation-20261117`  
**Branche de référence :** `feat/jec-digital-archives`  
**Périmètre :** audit de sécurité, recette RLS par simulation de rôles, nettoyage de la fiche publique de test et préparation de la validation multi-organisations.

## Résultat de la première stabilisation

- Le projet de référence est la branche `feat/jec-digital-archives` (commit de départ `c56d5e159a5689a4dad893c2cfe358db86119ae3`). La branche `main` est en retard et ne doit pas servir de base à ces évolutions.
- Une garde serveur dans `proxy.ts` protège les routes privées identifiées : compte, espaces de travail, messagerie, réunions, décisions/votes, projets, documents, gestion et partenaires.
- La page de connexion conserve la destination demandée après connexion, avec validation du chemin relatif afin d'éviter les redirections externes.
- La navigation du portail masque les modules collaboratifs aux visiteurs et aux comptes dont l'adhésion n'est pas vérifiée ; elle les affiche aux membres vérifiés et aux administrateurs.
- La garde serveur refuse les routes collaboratives aux comptes sans adhésion JEC vérifiée (hors administrateurs) ; les contrôles RLS de chaque ressource restent indispensables.
- Le déploiement de production du 18 novembre 2026 est `READY`, commit `8eedbb73ecc448ce7380b973da67850c24652261`, sur le projet Vercel `jec-connect`. Les alias stables `jec-connect-abessangel-8638.vercel.app` et `jec-connect-ten.vercel.app` lui sont rattachés.
- Le build de production a compilé Next.js et TypeScript avec succès. La validation navigateur après connexion par de vrais comptes reste à effectuer ; aucun mot de passe ou jeton de membre n'a été utilisé pour cette recette.

## Recette RLS — 18 novembre 2026

Les contrôles ci-dessous sont des lectures exécutées dans des transactions annulées (`ROLLBACK`), avec simulation des rôles PostgreSQL et des claims Supabase. Aucun compte, espace ou rattachement n'a été modifié.

- **Visiteur anonyme :** le rôle `anon` ne possède pas le privilège `SELECT` sur `jec_workspaces` ; la tentative d'accès direct à la table est rejetée par PostgreSQL.
- **Adhésion en attente :** le compte simulé voit son propre statut `pending`, mais aucun espace de travail ni ligne de roster.
- **Membre vérifié non administrateur :** le compte choisi est effectivement membre actif des deux espaces existants ; il voit donc ces deux espaces et les dix lignes de roster correspondantes. Ce compte ne permet pas de tester l'isolement vis-à-vis d'un troisième espace, car aucun troisième espace n'existe actuellement.
- **Administrateur :** le contrôle `is_jec_admin()` renvoie vrai ; les deux espaces et leurs dix lignes de roster sont visibles.
- La base compte actuellement quatre adhésions `pending` et trois adhésions `verified`. Aucun compte de test n'a été créé.
- Les politiques RLS de `jec_workspaces` limitent la lecture aux administrateurs, membres actifs de l'espace et utilisateurs invités ; les lignes de roster sont limitées au membre concerné, aux administrateurs et aux membres de l'espace.
- Les requêtes HTTP automatisées de bout en bout n'ont pas pu être exécutées depuis l'environnement de recette, la protection Vercel SSO empêchant l'accès externe aux URL de déploiement. Le test manuel des trois profils dans le navigateur reste requis.

## Annuaire public — nettoyage effectué

- Une fiche de l'annuaire était publiée avec une description explicitement marquée « fins de test ».
- La migration de nettoyage a été appliquée le 18 novembre 2026. Elle a uniquement positionné `is_published = false` pour la fiche publique de test ; aucun enregistrement n'a été supprimé.
- La migration est enregistrée en base sous la version `20261118022700`. Le fichier du dépôt est donc nommé `20261118022700_unpublish_unverified_directory_test_entry.sql` afin de rester aligné avec l'historique Supabase.
- Vérification après application : zéro fiche publiée avec visibilité publique ; les deux lignes identifiées comme données de test restent conservées mais non publiées.
- L'annuaire public est donc vide jusqu'à validation et publication de véritables informations institutionnelles. Il ne faut pas réintroduire de données fictives pour le remplir.

## Sécurité Supabase observée

- Les tables applicatives du schéma `public` ont RLS activé.
- Trois tables des bulletins secrets (`jec_governance_eligible_voters`, `jec_governance_vote_choices`, `jec_governance_vote_submissions`) ont RLS activé sans politique client. C'est cohérent avec leur accès exclusivement via les fonctions RPC contrôlées ; ne pas ajouter de politique générique.
- Les fonctions privilégiées inspectées utilisent `SECURITY DEFINER` avec `search_path` vide.
- L'analyse Supabase signale que la protection des mots de passe compromis n'est pas activée. Ce réglage reste à traiter dans les paramètres Auth.
- L'analyse de performance signale 66 clés étrangères sans index couvrant. Elles devront être priorisées selon les requêtes réellement utilisées, et non indexées indistinctement.

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

## État de la fondation multi-organisations

- Le modèle et la migration sont préparés sur la branche de travail : international → mouvement national → groupe local, adhésions multi-organisations et rattachement optionnel des espaces.
- La migration `202611170002_organization_hierarchy_multi_tenant.sql` n'a pas été appliquée à Supabase ; les tables `jec_organizations` et `jec_organization_memberships`, ainsi que les colonnes `organization_id`, sont toujours absentes.
- Aucune organisation, aucun mouvement national et aucun groupe local fictif n'a été créé.
- Aucune branche de développement Supabase n'existe actuellement. Le devis retourné pour une branche est de **0,01344 USD par heure**. La création de cette ressource payante attend l'accord explicite de la propriétaire du projet.
- La migration multi-organisations ne doit pas être appliquée à la production avant validation sur une base de test, notamment des politiques RLS et des scénarios d'accès parent/enfant entre plusieurs comptes.

## Prochaines priorités de développement

1. Obtenir l'accord pour créer une branche Supabase de test au coût horaire annoncé, ou utiliser un environnement PostgreSQL/Supabase local équivalent, puis exécuter et tester la migration multi-organisations.
2. Compléter la recette navigateur avec un compte public, un compte en attente, un membre vérifié non administrateur et un administrateur, notamment les URL directes.
3. Créer l'écran d'administration des organisations et les parcours d'adhésion / invitation.
4. Construire l'annuaire public des mouvements et groupes locaux, puis la carte à partir de lieux validés.
5. Rattacher progressivement les espaces existants après validation par les responsables, puis tester les documents, réunions, votes et messages entre comptes et organisations.
6. Concevoir les notifications e-mail après vérification du fournisseur d'envoi, des coûts et des préférences anti-spam.

## Références techniques

- Supabase SSR / Next.js : https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Supabase Storage : https://supabase.com/docs/guides/storage/buckets/fundamentals
- Supabase Auth / mots de passe compromis : https://supabase.com/docs/guides/auth/password-security
