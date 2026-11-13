# Suivi du projet JEC-conNEcT

**Phase actuelle :** prototype de présentation et cadrage initial.

| Chantier | État | Commentaire |
|---|---|---|
| Cadrage produit | En cours | Vision et modules définis ; arbitrages du Bureau à obtenir. |
| Dépôt GitHub / Vercel | Démarré | Dépôt connecté et prévisualisation déployée. |
| Authentification et compte | Parcours de base testés ; profils raccordés | Google OAuth, inscription e-mail, confirmation et réinitialisation validés par test. Profils persistants, statut d'adhésion séparé, page Mon compte, déconnexion et affichage du compte connecté intégrés. Désignation du premier administrateur et tests multi-comptes à terminer. |
| Identité visuelle | Première proposition | Palette et déclinaisons dérivées du logo fourni ; validation communication requise. |
| Frise chronologique | Intégrée au prototype | Frise interactive France / international avec six repères datés, détails et liens vers les sources institutionnelles. À enrichir après vérification d'archives complémentaires. |
| Registre des sources | Créé | Sources historiques, niveau de précision et précautions éditoriales documentés dans `REGISTRE_SOURCES_PUBLIQUES.md`. |
| Interface de démonstration | En cours | Tableau de bord et navigation initiale disponibles ; autres modules à compléter. |
| Cahier des charges | Première version | À enrichir par ateliers avec les services. |
| Étude fournisseurs et coûts | À faire | Comparatifs, devis, coûts annuels et projections 3/5/10 ans. |
| Sécurité et RGPD | À faire | Cartographie, rôles, durées de conservation et analyse des risques. |
| Tests utilisateurs | À faire | Constituer un panel de membres et responsables. |

## Décisions attendues
- Désigner un sponsor et un groupe de pilotage.
- Définir les structures pilotes et les règles d'inscription.
- Valider la matrice des rôles et la classification documentaire.
- Définir les règles d'archivage et de passation des mandats.
- Définir les conditions d'enregistrement et de transcription des réunions.
- Valider les règles statutaires applicables aux consultations et élections.
- Définir le budget de cadrage et de pilote.

## Prochaines actions
1. Enrichir et faire valider la frise historique avec les responsables et détenteurs d'archives.
2. Finaliser les scénarios de démonstration.
3. Configurer Google OAuth dans Supabase et Google Cloud.
4. Compléter le cahier des charges fonctionnel.
5. Établir la matrice des permissions et les exigences de sécurité.
6. Comparer les fournisseurs et chiffrer les coûts initiaux et récurrents.
7. Tester avec les structures pilotes et recueillir les retours.
8. Préparer le dossier de décision du Bureau national.

## Règles de suivi
Chaque fonctionnalité doit comporter un statut, une priorité, un responsable, une date cible et des critères d'acceptation. Chaque décision doit être datée, attribuée à l'instance compétente et reliée à son compte rendu. Le prototype utilise des contenus publics vérifiables et sourcés. Les comptes de test et brouillons locaux sont explicitement identifiés comme tels ; aucune donnée interne confidentielle n'est chargée.


## Mise à jour — interface bilingue, chants et visuels

| Chantier | État | Commentaire |
|---|---|---|
| Interface FR / EN | En cours | Sélecteur de langue partagé ajouté ; accueil, connexion, découverte et bibliothèque musicale disposent de traductions. Vérifier l'ensemble des libellés et contenus avant validation. |
| Bibliothèque musicale | Première interface | Chant de ralliement et hymne JEC prévus en FR/EN ; éditeur de couplets et écoute locale de fichiers audio. Paroles et audios officiels non encore chargés faute de fichiers validés. |
| Illustrations | Enrichi | Illustrations originales pour la communauté, la musique et trois catégories d'actualités. Les photos d'archives authentiques restent à fournir avec leurs droits. |
| Icône navigateur | Corrigée | Remplacement du logo source JEC France par une icône propre à JEC-conNEcT. |
| OAuth Google | Blocage de configuration | Le code PKCE serveur et le proxy de session sont en place. La clé publique Supabase manque dans Vercel et le fournisseur Google doit être activé dans Supabase. Voir GOOGLE_AUTH_SETUP.md. |

## Actions complémentaires
1. Récupérer la clé publishable Supabase et la renseigner dans Vercel.
2. Activer Google OAuth dans Supabase avec le Client ID / Secret Google Cloud et tester les redirections.
3. Recevoir les paroles validées de tous les couplets du chant de ralliement et l'hymne en français et en anglais.
4. Recevoir les enregistrements audio officiels, les crédits et les autorisations de diffusion.
5. Vérifier les traductions anglaises avec une personne bilingue de la JEC.
6. Tester le parcours de langue sur mobile et ordinateur.


### Patrimoine musical — sources disponibles

Les quatre textes transmis dans la bibliothèque documentaire ont été intégrés à l'écran Chants & hymnes :
- Chant de ralliement FR : Chant_de_ralliement_JEC_avec_logo.docx.
- Chant de ralliement EN : YCS_Rallying_Chant_EN.docx.
- Hymne principal FR : Hymne_principal_JEC.docx.
- Hymne principal EN : YCS_Main_Hymn_EN.docx.

Les textes restent modifiables par l'utilisateur en brouillon local. Le fichier source peut être restauré. Aucun fichier audio officiel n'a été identifié dans la bibliothèque consultée ; le lecteur accepte une préécoute locale de fichier, mais aucun audio n'est publié ou synchronisé à ce stade.


## Mise à jour — sauvegarde audio, installation et responsive

| Chantier | État | Commentaire |
|---|---|---|
| Sauvegarde des audios | Première version intégrée | Bouton « Enregistrer l'audio » ; fichiers stockés dans IndexedDB et restaurés lors du retour sur la page. Sauvegarde limitée au navigateur et à l'appareil. |
| Bibliothèque audio cloud | Infrastructure privée/publique configurée | Brouillons conservés dans le bucket privé jec-audio ; bucket distinct jec-audio-public pour les versions approuvées. Restauration cloud prioritaire dans le lecteur et file de publication administrateur intégrées. Tests réels multi-comptes et diffusion publique à effectuer après désignation de l'administrateur. |
| Téléchargement / installation | PWA en place | Manifeste, service worker, cache initial et bouton « Installer l'application » ajoutés. Instructions spécifiques iOS et navigateurs sans prompt disponibles. |
| Responsive mobile/tablette | Refonte engagée | Navigation inférieure défilante sur téléphone, grilles empilées, contrôles audio et pages historiques adaptés aux écrans étroits. Tests réels à compléter sur iOS, Android, tablette et desktop. |

### Vérifications à effectuer
- Ajouter un audio, cliquer sur Enregistrer, quitter la page, revenir et recharger le site.
- Vérifier que chaque chant conserve son propre fichier audio.
- Tester le bouton Télécharger sur l'audio enregistré.
- Tester l'installation depuis Chrome/Edge et l'ajout à l'écran d'accueil sur iOS Safari.
- Vérifier le comportement hors ligne des pages mises en cache.
- Mesurer les limites de quota IndexedDB pour les fichiers audio volumineux.
- Ne pas considérer la persistance locale comme une sauvegarde cloud : les fichiers ne sont pas partagés entre appareils et peuvent être effacés lors du nettoyage des données du navigateur.


### Stockage cloud des audios — préparation
Le code synchronise un audio vers le bucket privé Supabase `jec-audio` pour un utilisateur authentifié, avec une métadonnée `jec_song_audio`. Les migrations `202611120001_create_jec_audio_library.sql` et `202611120002_optimize_jec_audio_access_policies.sql` ont été appliquées au nouveau projet Supabase JEC-conNEcT. Les variables publiques Supabase sont désormais configurées dans Vercel. La validation réelle de la connexion, de la confirmation e-mail et du transfert cloud reste à effectuer après réglage des URL Auth et du SMTP.

## Mise à jour — 12 novembre 2026 : séparation et raccordement Supabase

- Création du projet Supabase dédié JEC-conNEcT (réf. fivgqfsfdkkuaybahufb, région Europe — Irlande). Le projet NaVigue est resté intact.
- Configuration dans Vercel des variables publiques NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY sur Development, Preview et Production.
- Mise à jour de .env.example vers le nouveau projet.
- Application et vérification des migrations de stockage audio privé ; RLS activée sur public.jec_song_audio.
- Vérifications Supabase : aucune alerte de sécurité ou de santé ; recommandations de performance initiales traitées par un index et des expressions (select auth.uid()).
- Déploiement Vercel de production : état READY sur le commit de configuration.

Restant avant validation complète de l'authentification : URL Site/Redirect dans Supabase, SMTP transactionnel pour les adresses hors équipe, identifiants Google OAuth, puis tests réels inscription/confirmation/connexion/récupération et upload audio avec deux comptes distincts.
## Évolution future — Espace Partenaires

Un volet Partenaires est ajouté à la feuille de route, hors MVP. Il pourra couvrir un annuaire institutionnel validé, les contacts des organisations, conventions, appels à projets, opportunités, projets communs et bilans. Les partenaires externes disposeront, le cas échéant, de comptes séparés à permissions minimales ; aucun accès automatique aux espaces membres ou aux documents internes. Le besoin, la gouvernance et la politique de partenariat devront être validés avant conception.


### Validation — connexion Google OAuth

Le 12 novembre 2026, la connexion Google a été testée avec succès sur le déploiement JEC-conNEcT. Le fournisseur Google est activé dans Supabase et la redirection vers l'application fonctionne. Restent à valider : inscription e-mail, confirmation d'adresse, réinitialisation de mot de passe, configuration SMTP de production et scénarios de sécurité multi-comptes.


### Validation — parcours d'authentification

Le 12 novembre 2026, la porteuse du projet a confirmé les tests réussis suivants sur JEC-conNEcT : connexion Google, inscription par e-mail, confirmation des adresses e-mail et réinitialisation du mot de passe. Ces résultats valident les parcours fonctionnels de base dans l'environnement de test actuel. La configuration d'un SMTP transactionnel institutionnel reste prévue après validation de l'architecture et des outils définitifs de la JEC. Les tests multi-comptes des espaces audio, la déconnexion, le renouvellement des sessions et la revue des permissions restent à effectuer.

## Mise à jour — compte, annuaire et diffusion musicale

- Création des tables `jec_profiles`, `jec_memberships`, `jec_directory_entries` et de la liste privée d'administrateurs `private.jec_admins`, avec RLS et permissions séparées.
- Les nouveaux comptes commencent avec le statut `pending` : être connecté ne signifie pas être membre JEC vérifié et ne donne aucun droit administratif.
- Ajout de la page `Mon compte` : prénom, nom, nom affiché, avatar, choix d'apparaître dans l'annuaire des membres et déconnexion.
- Ajout d'un annuaire institutionnel (Bureau national, équipe nationale, fédérations, équipes locales, commissions, services) et d'un annuaire de membres sur opt-in, réservé aux membres vérifiés. Aucun nom ou mandat réel n'a été inventé ; la base officielle est vide en attente des informations validées.
- Ajout de `/gestion` pour les administrateurs : validation des adhésions, création/publication de fiches institutionnelles et revue des audios déposés par les membres.
- Procédure d'attribution explicite du premier rôle administrateur documentée dans `docs/BOOTSTRAP_ADMIN.md`. Aucun compte administrateur n'a été attribué automatiquement.
- Le chant de ralliement complet fourni par la porteuse du projet a remplacé le texte abrégé, en français et avec une traduction anglaise clairement identifiée.
- Le lecteur restaure d'abord la version publique officielle, puis le brouillon cloud privé de l'utilisateur, puis la copie locale. Les audios privés restent privés jusqu'à leur publication explicite par un administrateur dans le bucket public distinct.

### Reste à faire avant validation fonctionnelle complète

1. Désigner et initialiser explicitement le premier administrateur via `docs/BOOTSTRAP_ADMIN.md`.
2. Tester le profil et la déconnexion avec un compte Google et un compte e-mail.
3. Tester la validation d'adhésion avec un compte administrateur et un compte membre en attente.
4. Tester le dépôt audio, sa restauration après reconnexion et sa publication par l'administrateur ; vérifier la lecture anonyme du fichier publié et l'inaccessibilité du brouillon privé.
5. Collecter auprès de la JEC la liste officielle du Bureau national, des équipes, des fédérations, commissions/services, fonctions, contacts et autorisations d'affichage.
6. Configurer ultérieurement SMTP institutionnel et expéditeur officiel après validation des fournisseurs définitifs.


## Mise à jour — 12 novembre 2026 : bibliothèque musicale publique

- Le compte `abessangel@gmail.com` a été inscrit dans la liste protégée des administrateurs JEC-conNEcT après désignation explicite de la porteuse du projet.
- Le bucket `jec-audio` est désormais public en lecture : un visiteur sans compte peut écouter et télécharger les fichiers via la bibliothèque Chants & hymnes.
- Les deux fichiers audio déjà présents ont été conservés et leurs métadonnées passées au statut publié ; aucun objet Storage n'a été supprimé.
- Le bouton d'enregistrement de la page Chants & hymnes envoie désormais le fichier vers le bucket commun et publie ses métadonnées dès l'enregistrement. L'action nécessite une session connectée ; la lecture et le téléchargement restent accessibles sans connexion.
- Les droits d'écriture et de remplacement restent limités au dossier Storage du compte ayant déposé le fichier. Le bucket public donne accès à la lecture, pas à l'écriture anonyme.
- La clé de version des paroles est passée à `v3` et le cache PWA à `v2` afin d'empêcher un ancien brouillon local ou cache de réafficher la version courte du chant de ralliement.
- Le texte complet du chant de ralliement transmis le 12 novembre a été vérifié dans les versions française et anglaise du code.

**Rappel de publication :** tout enregistrement envoyé dans la bibliothèque commune est public. Les contributeurs doivent confirmer qu'ils disposent des droits de reproduction et de diffusion avant l'envoi.

## Mise à jour — Administration complète et correction du chant de ralliement

- Ajout des fonctions RPC sécurisées d'administration : liste des comptes, validation/refus/remise en attente de l'appartenance JEC, attribution/révocation du rôle administrateur, protection contre la révocation du dernier administrateur.
- Ajout de la gestion des comptes dans l'espace /gestion, avec statut de membre et rôle administrateur visibles, et boutons d'action.
- Ajout d'une entrée « Espace administrateur » dans le menu latéral, visible uniquement après authentification et confirmation du rôle administrateur.
- Ajout d'une action administrateur de suppression d'un média : suppression via l'API Storage puis suppression de sa métadonnée.
- Le dernier texte du chant de ralliement transmis le 12 novembre 2026 remplace la version précédente, sans le refrain en majuscules non présent dans la dernière copie. Traduction anglaise mise à jour.
- La copie locale obsolète du fichier audio de ralliement n'est plus restaurée automatiquement ; un nouvel enregistrement doit être déposé pour ce chant.

**Action manuelle restante pour la suppression du mauvais audio :** dans Administration > Bibliothèque musicale, repérer la ligne « Chant de ralliement · FR » (Hymne de la JEC.mp3) et utiliser « Supprimer l'audio ». Cette action utilise l'API Storage, supprime le fichier correspondant et sa métadonnée. La ligne « Hymne de la JEC · FR » n'est pas concernée. Un DELETE SQL direct sur storage.objects n'est pas utilisé, car il laisserait le fichier physique orphelin dans Storage.
## Mise à jour — 13 novembre 2026 : volet Collaboration opérationnel (première tranche)

Le schéma de collaboration existait déjà dans Supabase ; cette itération a relié et corrigé les écrans, les RPC et les règles d'accès.

- Espaces privés par équipe, service, fédération, commission, projet ou groupe temporaire ; rôles locaux owner, manager et member distincts du statut JEC et du rôle administrateur global.
- Création d'espace atomique via RPC : l'espace et son propriétaire sont créés dans la même transaction.
- Espace pilote privé « Espace pilote JEC-conNEcT » (slug : pilote-jec-connect) créé. Le compte abessangel@gmail.com est propriétaire et membre actif. Aucun responsable ni structure institutionnelle n'a été inventé.
- Invitation des membres par e-mail ; les comptes doivent être JEC vérifiés ou administrateurs et doivent accepter l'invitation avant d'accéder aux contenus.
- Fil d'échanges d'équipe, projets, tâches et affectation des actions disponibles dans chaque espace.
- Réunions liées à un espace : programmation, ordre du jour, lieu, lien de visioconférence externe, invitations automatiques de tous les membres actifs, confirmation ou refus de présence.
- Documents privés : bucket jec-workspace-documents, limite de 50 Mo, liens de téléchargement signés temporaires et suppression autorisée selon le rôle et l'appartenance à l'espace.
- Messagerie directe, de groupe ou liée à un espace ; invitations de comptes JEC vérifiés, acceptation explicite, historique privé et événements de nouveaux messages via Supabase Realtime.
- Création de conversations directes/groupes à partir d'e-mails résolue côté serveur dans le schéma privé ; aucune consultation directe de auth.users par le navigateur.
- Pages transversales /workspace, /workspace/[slug], /messagerie, /reunions, /projets et /documents reliées à Supabase.
- Les tables de collaboration n'ont pas de privilèges SQL directs pour le rôle anon. Le bucket des documents reste privé et distinct du bucket public des chants.
- Migrations appliquées : 202611130001_collaboration_permissions_and_conversations, 202611130002_collaboration_workspace_workflows, 202611130003_messaging_email_conversations, 202611130004_workspace_document_delete_policy.

### Vérifications techniques

- Vérification des privilèges : anon ne peut ni lire les workspaces/messages ni écrire dans les tables collaboratives ; l'accès passe par authenticated et RLS.
- Vérification du stockage : jec-workspace-documents est un bucket privé.
- Test transactionnel réussi de la création d'un espace avec propriétaire et de la création d'une conversation directe avec un second compte JEC vérifié ; les transactions ont été annulées après validation, sans conserver de données de test.
- Les tests multi-comptes dans l'interface restent à réaliser : invitation réelle, acceptation, publication dans le fil, échange de messages temps réel, réponse à une réunion et téléchargement documentaire avec le second compte.

### Démarrage du pilote

1. Connecte-toi avec le compte administrateur JEC-conNEcT.
2. Ouvre Workspace puis Espace pilote JEC-conNEcT.
3. Depuis Membres, invite le compte de test aeyenga31@gmail.com (déjà vérifié).
4. Connecte-toi avec ce second compte et accepte l'invitation dans Mes espaces.
5. Teste le fil d'équipe, les projets, les tâches, la réunion, les documents et la messagerie depuis les deux comptes.

### Limites actuelles

- Les réunions utilisent un lien de visioconférence externe fourni manuellement ; aucun service de visioconférence n'est intégré.
- Les notifications e-mail/push, messages non lus, accusés de lecture, présence, recherche, pièces jointes de messagerie et modération restent à développer.
- Les enregistrements/transcriptions de réunion, versions documentaires, approbations et recherche plein texte restent à développer.
- Les espaces institutionnels définitifs doivent être créés après validation de l'organisation et des responsables réels par la JEC.
- Le contrôle Supabase signale toujours la protection contre les mots de passe compromis désactivée ; l'alerte de politique RLS sur private.jec_admins reste à examiner avant la production institutionnelle.

## Mise à jour — 13 novembre 2026 : Collaboration phase 2 (gestion de projet et réunions enrichies)

### Projets
- Page dédiée `/projets/[id]` : paramètres, objectif, description, dates, priorité et statut.
- Tableau de tâches par état (à faire, en cours, bloqué, terminé), avec responsable, échéance et priorité.
- Jalons de projet avec responsable, date cible et état (à venir, en cours, à risque, terminé).
- Fil de commentaires privé pour chaque tâche.
- Les tâches et réunions peuvent être rattachées à un projet depuis un espace.
- Les contrôles de modification tiennent compte du créateur, de la personne assignée, du propriétaire de projet et des responsables d'espace ; les règles RLS restent la protection finale.

### Réunions
- Page dédiée `/reunions/[id]` : préparation, déroulé détaillé et liste des participants.
- Ordre du jour structuré : points, description, présentateur et statut (à traiter, traité, reporté).
- Registre de décisions avec état et contexte.
- Actions de suivi liées à la réunion, attribuables à un membre et assorties d'une échéance.
- Comptes rendus en brouillon ou partagés, puis approbation par un responsable d'espace ; un compte rendu approuvé est verrouillé en lecture seule.
- Transcription manuelle et dictée navigateur expérimentale, avec confirmation du consentement. Seul le texte est stocké par JEC-conNEcT ; les données audio brutes ne sont pas enregistrées par l'application.
- Les utilisateurs peuvent utiliser un lien externe de visioconférence fourni manuellement ou le salon d'appel intégré.

### Appels audio / vidéo
- Route `/reunions/[id]/appel` avec salon audio/vidéo navigateur à navigateur via WebRTC.
- Signalisation et présence via canal Supabase Realtime privé, autorisé uniquement aux participants dont la présence est acceptée/confirmée.
- Gestion du cycle de vie des sessions d'appel et des participants ; fermeture de la salle par son hôte ou un responsable.
- L'application ne stocke ni n'enregistre le son ou la vidéo.
- Le service de relais TURN n'est pas encore configuré. La connexion directe fonctionne en fonction des réseaux et peut échouer derrière certains NAT/pare-feu ; un service TURN sera nécessaire pour une fiabilité de production.

### Migrations et sécurité
- Migration `collaboration_phase_two` : jalons, commentaires, points d'ordre du jour, décisions, comptes rendus, transcriptions, règles RLS et autorisation des canaux privés d'appel.
- Migration `meeting_call_sessions` : sessions et participants aux appels, RPC de jointure, sortie et fermeture.
- Les nouvelles tables ont RLS activé ; le rôle `anon` ne peut pas les lire. Les fonctions de gestion d'appel et d'approbation des comptes rendus sont exécutables uniquement par `authenticated`.
- Test transactionnel réussi avec deux comptes : invitation temporaire du second compte au workspace, création d'une réunion de test, entrée des deux comptes dans la même session d'appel, puis fermeture de la session. La transaction a été annulée : aucune donnée de test n'est conservée.
- Le test technique du cycle de salle n'est pas un test de qualité audio/vidéo sur deux appareils. La validation caméra, micro, audio bidirectionnel et traversée réseau reste à effectuer dans deux vrais navigateurs.
- Le contrôle Supabase signale toujours la protection contre les mots de passe compromis désactivée. Elle devra être activée avant une mise en production institutionnelle.

### Reporté explicitement à la phase suivante
- Assistant IA : synthèse des transcriptions, génération assistée de comptes rendus, extraction de décisions et d'actions, suggestions de suivi. Aucun bouton IA n'est présenté comme opérationnel tant qu'un fournisseur/modèle et ses règles de confidentialité ne sont pas choisis.
- Archives : versionnage documentaire, historique institutionnel, journal d'audit, passation des responsabilités, exports et conservation à long terme.
- TURN, enregistrement éventuel et politique de conservation des réunions feront l'objet d'un choix technique et budgétaire séparé. L'enregistrement ne doit jamais être activé implicitement.

### Complément sécurité — intégrité des périmètres de collaboration

- Migration `collaboration_scope_integrity` appliquée : les références projet/réunion/tâche/document sont contrôlées par des triggers serveur afin qu'un enregistrement ne puisse pas relier des objets de plusieurs espaces.
- Les politiques d'insertion de jalons, commentaires, points d'ordre du jour, décisions, comptes rendus et transcriptions utilisent des références explicites à l'espace concerné.
- Contrôle final Supabase : RLS active sur les huit nouvelles tables phase 2 ; aucune lecture par `anon`. L'advisor santé ne signale aucun problème. L'unique alerte sécurité restante concerne la protection contre les mots de passe compromis désactivée.
- Déploiement Vercel du socle phase 2 et de l'intégrité des périmètres validé READY ; les routes de liste et de détail projet/réunion/appel répondent en HTTP 200.
- Le scénario SQL de salle d'appel a été testé avec deux participants dans une transaction annulée. Le test de média (micro, caméra, audio bidirectionnel et réseau) nécessite encore deux vrais navigateurs.
