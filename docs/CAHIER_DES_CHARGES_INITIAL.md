# Cahier des charges fonctionnel — JEC-conNEcT
**Version :** initiale — prototype de présentation et cadrage du futur produit  
**Périmètre de décision :** JEC France, avec possibilité d'extension internationale ultérieure.

## 1. Objectif
Concevoir une plateforme numérique intégrée permettant à la JEC France de centraliser son information publique, ses communications, sa collaboration, ses réunions, ses activités, ses documents et sa mémoire institutionnelle.

Le premier livrable est un prototype de présentation consultable à distance. Il ne constitue pas une infrastructure de production et ne doit recevoir aucune donnée interne ou sensible réelle.

## 2. Principes directeurs
- Contenus publics vérifiables et sourcés.
- Aucune donnée interne, identité, statistique, réunion, décision ou archive inventée.
- Séparation des espaces publics, membres, services et documents sensibles.
- Droits d'accès attribués selon l'organisation et les responsabilités.
- Continuité institutionnelle et transmission entre mandats.
- Accessibilité, ergonomie mobile, sécurité dès la conception.
- Architecture extensible, sans déployer l'international avant validation du pilote français.

## 3. Périmètre des modules
1. **Site institutionnel :** présentation, histoire, mission, valeurs, structures et contacts.
2. **Community :** fil public et interne, publications, médias, réactions, commentaires et annonces.
3. **Workspace :** équipes, canaux, messagerie, conversations privées, fichiers et notifications.
4. **Meetings :** invitations, agendas, visioconférence, transcription, décisions et comptes rendus.
5. **Projects & Events :** activités, projets, tâches, échéances, inscriptions et calendriers.
6. **Documents & Archives :** bibliothèque, classement, versions, droits, archivage et passation.
7. **Governance :** consultations, campagnes et processus électoraux adaptés aux statuts.
8. **Knowledge & Onboarding :** histoire, formation, démarche Voir-Juger-Agir et accueil des nouveaux.
9. **News & veille :** actualités de la JEC et sources externes jeunesse, éducation, solidarité, Europe et international.
10. **JEC AI & Reporting :** assistance rédactionnelle, synthèse, rapports et recherche documentaire.
11. **Administration :** structures, rôles, permissions, paramètres et suivi.

## 4. Exigence spécifique — frise chronologique de la JEC

### 4.1 Objectif
Faire de la frise un élément central de la découverte et de la mémoire du mouvement. Elle doit raconter l'histoire de la JEC dans le temps, aider les nouveaux à comprendre ses origines et permettre aux générations suivantes de retrouver les repères qui ont façonné le mouvement.

### 4.2 Présentation
- Frise interactive responsive sur ordinateur et mobile.
- Filtres : « Tous », « JEC France », « International ».
- Sélection d'un jalon pour ouvrir une fiche détaillée.
- Navigation chronologique et indication de la période.
- Possibilité d'associer des photographies, affiches, numéros de revue, anciens logos, vidéos, témoignages et documents d'archives lorsque les droits sont établis.
- Affichage de la source et de sa date de consultation.
- Mention explicite du niveau de précision : jour exact, mois, année ou période.

### 4.3 Premiers jalons vérifiés
Les jalons initiaux sont documentés dans [le registre des sources publiques](REGISTRE_SOURCES_PUBLIQUES.md) :
- Mai 1929 : premiers jécistes et lancement du mouvement en France.
- Juillet 1929 : première édition de « La JEC, esquisse d’un programme général ».
- 1930 : lancement de *L’Appel*, organe mensuel de la JEC.
- 1946 : fondation de la coordination internationale JECI/IYCS.
- Mai 1968 : la JEC accompagne les jeunes dans les turbulences de Mai 68 (repère de période, pas événement ponctuel inventé).
- 25 mars 2009 : reconnaissance de l'IYCS comme association internationale de fidèles.

**Distinction obligatoire :** 1946 concerne la coordination internationale JECI/IYCS et ne doit pas être présenté comme la fondation de la JEC France.

### 4.4 Gouvernance éditoriale des archives
Toute contribution historique doit être accompagnée de sa provenance, sa date ou période, son détenteur, ses droits de réutilisation et d'un statut de validation. Les contenus incertains sont marqués « à confirmer » et ne sont pas présentés comme des faits établis. Les modifications de jalons doivent laisser une trace.

## 5. Contenus et sources
Les contenus publics affichés sont reliés aux sources originales. Le registre recense les sources JEC France, les pages institutionnelles de JECI/IYCS et les autres sites retenus. Pour un événement externe, l'interface précise l'organisateur et ne laisse pas entendre que la JEC en est partenaire sans preuve.

## 6. Authentification et utilisateurs
- Création de compte e-mail / mot de passe.
- Vérification d'adresse, réinitialisation et sessions.
- Connexion directe Google OAuth.
- Validation de l'appartenance à une structure.
- Rôles et permissions administrés.
- Un compte Google ne confère aucun privilège institutionnel par défaut.

## 7. Réunions, transcriptions et IA
Toute transcription ou enregistrement réel suppose information préalable des participants, définition de la finalité et de la base légale, contrôle d'accès et durée de conservation. L'IA propose des brouillons de synthèse et de comptes rendus. Le secrétaire ou responsable habilité vérifie et valide le document officiel. Toute réponse IA doit citer les pièces accessibles et signaler les informations absentes.

## 8. Documents, confidentialité et passation
Les documents sont classés par service, catégorie, année, propriétaire, confidentialité et statut. Les pièces comptables, données personnelles, procès-verbaux non publics et dossiers électoraux font l'objet d'accès restreints. À chaque changement de mandat, les espaces professionnels doivent être transférés selon une procédure documentée, sans transfert de comptes personnels.

## 9. Gouvernance et élections
Distinguer sondages, consultations informelles et scrutins statutaires. Un scrutin officiel nécessite un cadrage avec les statuts, l'éligibilité, le secret, l'intégrité, la vérifiabilité, l'auditabilité et le traitement des incidents. Une maquette de vote est explicitement étiquetée « simulation sans valeur statutaire ».

## 10. Architecture de présentation et architecture cible
**Prototype :** Next.js, TypeScript, Vercel, données publiques sourcées, Supabase Auth si configuré. Les espaces privés restent vides ou démontrent des formulaires sans données officielles.

**Produit définitif :** choix des fournisseurs après étude comparative et validation du Bureau. Les exigences devront couvrir localisation des données, contrats, SLA, chiffrement, MFA, sauvegardes, restauration, supervision, journalisation, réversibilité, conformité, capacité, support et coûts.

Un service payant n'est pas automatiquement sûr : chaque fournisseur est évalué à partir de garanties vérifiables et de sa configuration réelle.

## 11. Critères d'acceptation du prototype
- Toutes les informations historiques possèdent une source consultable.
- Les dates précises ne dépassent pas le degré de précision de la source.
- France et international sont distingués dans la frise.
- L'utilisateur peut filtrer, sélectionner un jalon et ouvrir sa référence.
- La frise fonctionne sur écran mobile.
- Aucun faux nom de membre, faux KPI, faux PV ou faux événement interne n'est visible.
- Les écrans non opérationnels sont signalés comme réservés ou à venir.
- L'application conserve son identité visuelle et son favicon JEC-conNEcT.

## 12. Évolutions
Enrichir la frise avec les archives des différentes générations, après collecte et validation. Ajouter des outils éditoriaux permettant aux responsables habilités de proposer, documenter, faire relire et publier de nouveaux jalons.


## 13. Bilinguisme français / anglais
La plateforme doit proposer une interface disponible en français et en anglais, au minimum pour les parcours publics, l'accueil, la connexion, la découverte du mouvement, l'agenda et les ressources. Le choix de langue est mémorisé par utilisateur ou dans le navigateur. Les contenus sources conservent leur langue d'origine ; les traductions sont identifiées et ne remplacent pas la source primaire.

## 14. Patrimoine musical : chants et hymnes de la JEC
Créer une bibliothèque musicale accessible depuis le portail et les espaces membres.
- Chant de ralliement avec tous les couplets et le refrain dans leur ordre validé.
- Hymne de la JEC en français et en anglais.
- Versions et variantes validées, auteur(s), compositeur(s), date et provenance lorsqu'ils sont documentés.
- Paroles structurées en refrain, couplets, ponts et variantes, sans réécriture non autorisée.
- Fichiers audio associés, préécoute et lecteur intégré.
- Filtres par chant, langue, version, type et disponibilité audio.
- Téléchargement éventuel soumis aux droits de diffusion et de reproduction.
- Historique des versions, statut de validation et personne/service ayant validé.
- Possibilité pour les responsables habilités de proposer une nouvelle version, sans publication automatique.

Aucune parole complète ni aucun enregistrement ne doit être inventé. Les textes, traductions et enregistrements doivent être fournis ou validés par la JEC, et les droits de reproduction, de traduction, de diffusion et de stockage doivent être vérifiés. Les brouillons de démonstration restent locaux et sont clairement signalés comme non publiés ; ils ne sont pas synchronisés entre utilisateurs tant qu'un backend sécurisé n'est pas disponible.

## 15. Images, illustrations et médias
Le produit doit être visuellement vivant, avec une iconographie cohérente et des visuels utiles :
- illustrations de la vie étudiante, des rencontres et de la musique ;
- photos d'événements uniquement lorsqu'elles sont autorisées et sourcées ;
- vignettes de catégories d'actualités ;
- visuels pour l'histoire, la chronologie, les chants, les formations et les événements ;
- galerie d'archives et médiathèque avec provenance, date, droits et crédits.

Les images générées ou d'illustration ne doivent jamais être présentées comme des photographies historiques ou des preuves d'un événement réel. Les photographies d'archives doivent être datées et documentées.

## 16. Authentification et OAuth — état du prototype
Le code prévoit l'inscription/connexion par e-mail et mot de passe, la réinitialisation du mot de passe et Google OAuth via Supabase Auth en flux PKCE. Le callback échange le code côté serveur et le proxy Next.js actualise les sessions par cookies.

Pour activer réellement les connexions, les prérequis sont :
- NEXT_PUBLIC_SUPABASE_URL ;
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou clé anon publique héritée si le projet l'utilise encore) ;
- fournisseur Google activé dans Supabase Auth ;
- identifiant client et secret OAuth Google renseignés dans Supabase depuis Google Cloud Console ;
- URI de callback Supabase ajoutée dans Google Cloud ;
- URL de callback de l'application ajoutée dans la liste des redirections autorisées Supabase, pour localhost, Preview et production.

L'authentification ne doit être déclarée opérationnelle qu'après tests de création de compte, confirmation e-mail, connexion par mot de passe, Google OAuth, réinitialisation, déconnexion et renouvellement de session. La présence d'un bouton Google ne prouve pas que le fournisseur est activé.


## 17. Bibliothèque audio — conservation et téléchargement
Le lecteur audio doit permettre de sélectionner, préécouter, enregistrer, télécharger et supprimer un fichier associé à un chant.
- Une action explicite « Enregistrer l'audio » doit confirmer la conservation du fichier.
- Le stockage doit survivre à la navigation, au rechargement et au redémarrage du navigateur.
- Chaque chant possède sa propre version audio et ses métadonnées : titre, nom de fichier, format, durée, taille, langue, auteur/provenance, droits et statut de validation.
- L'utilisateur peut télécharger le fichier ou remplacer/supprimer une version selon ses permissions.
- La version de démonstration peut utiliser IndexedDB sur l'appareil, mais doit clairement signaler que ce stockage est local.
- Le produit final doit utiliser un stockage objet privé (ex. Supabase Storage ou solution équivalente) avec authentification, politiques d'accès, limites de taille, sauvegardes et synchronisation entre appareils.
- Les audios officiels publiés dans la bibliothèque doivent être gérés par des responsables habilités et leurs droits de reproduction et de diffusion validés.

## 18. Application installable (PWA)
- Manifeste web avec nom, description, couleurs, icône, start URL et affichage standalone.
- Service worker pour le cache contrôlé des ressources publiques et des pages de base.
- Bouton d'installation explicite dans l'interface.
- Instructions alternatives pour iOS Safari et les navigateurs ne déclenchant pas le prompt d'installation.
- Indication des fonctionnalités disponibles hors ligne.
- Mises à jour du service worker gérées proprement et sans conserver indéfiniment de vieux contenus.
- L'installation PWA ne remplace pas une application native publiée dans les stores.

## 19. Exigences responsive
L'interface doit être testée sur :
- petits téléphones (320–375 px) ;
- téléphones standards et grands formats ;
- tablettes portrait et paysage ;
- ordinateurs portables et écrans larges.

Exigences :
- aucune barre de défilement horizontale involontaire ;
- navigation mobile dédiée (barre inférieure ou menu adapté) ;
- contenus en une colonne lorsque nécessaire ;
- lecteurs audio, boutons et champs accessibles au tactile ;
- textes et images qui se redimensionnent sans débordement ;
- respect des zones de sécurité iOS (safe areas) ;
- tests clavier, contraste et lecteur d'écran.


### Implémentation de référence pour le prototype
Le dépôt contient une migration préparatoire `supabase/migrations/202611120001_create_jec_audio_library.sql` qui crée le bucket privé `jec-audio`, la table de métadonnées `jec_song_audio` et des politiques RLS pour les brouillons privés. Avant mise en service, la migration doit être revue et exécutée par un administrateur Supabase, puis les rôles et la publication des audios officiels doivent être validés. Le stockage IndexedDB demeure un cache local et ne remplace pas le stockage centralisé.
## 20. Espace Partenaires — évolution ultérieure

Prévoir, dans une phase ultérieure et après validation par les responsables nationaux, un volet dédié aux partenaires institutionnels, associatifs, éducatifs, financiers et techniques de la JEC.

Objectifs possibles :
- Présenter les partenaires autorisés et leurs domaines d'intervention, avec une fiche institutionnelle validée par la JEC.
- Gérer les organisations partenaires, leurs contacts institutionnels et l'historique des collaborations.
- Centraliser les conventions, lettres d'engagement, dossiers de partenariat et documents associés dans un espace à accès restreint.
- Publier, selon validation, des appels à projets, opportunités de financement, événements, offres de formation et actions communes.
- Suivre les projets co-portés, les contributions, les échéances, les livrables et les bilans.
- Permettre à certains partenaires invités d'accéder à un espace externe limité, sans leur donner accès à la communauté interne, aux documents des services, aux données des membres ni aux instances de gouvernance.

Principes de conception :
- Distinguer clairement les comptes membres JEC des comptes partenaires externes.
- Accorder des permissions minimales, limitées à une organisation, un projet et une durée définis.
- Prévoir un responsable JEC référent pour chaque relation partenaire.
- Soumettre les fiches publiques, logos, communications et conventions à validation avant publication.
- Encadrer les données des contacts professionnels (information, finalité, accès, durée de conservation et droits RGPD).
- Prévoir la révocation immédiate d'un accès externe à la fin d'un partenariat.

Ce module n'appartient pas au premier périmètre du prototype. Il sera spécifié séparément après recueil des besoins de la JEC, cartographie des partenaires existants et définition d'une politique de partenariat. Aucun partenaire, accord ou financement ne doit être inventé ou affiché sans validation.

## 21. Comptes, profils et statut d'appartenance

- Tout compte Auth dispose d'un profil applicatif séparé (prénom, nom, nom affiché, avatar et préférences de visibilité).
- La connexion ne vaut pas confirmation d'appartenance à la JEC.
- Chaque compte commence avec un statut d'adhésion `pending`; un responsable habilité peut le passer à `verified` ou `rejected` après vérification.
- Le compte présente clairement l'état de connexion, le statut d'adhésion et les actions disponibles.
- L'utilisateur peut consulter/modifier les champs personnels autorisés et se déconnecter depuis l'interface.
- Les rôles administratifs sont attribués dans une liste protégée, jamais via les métadonnées modifiables du profil ou un auto-déclaratif.
- Prévoir une gestion institutionnelle des rôles, une passation des administrateurs et des journaux d'audit.

## 22. Annuaire et organigramme

- Annuaire institutionnel classé par Bureau national, équipe nationale, fédérations, équipes locales, commissions et services.
- Chaque fiche officielle comprend la fonction, le nom du titulaire, la structure, une description et, si validé, un contact fonctionnel.
- L'annuaire aide à identifier l'interlocuteur compétent pour une demande, sans exposer par défaut les coordonnées personnelles.
- Les membres disposent d'un annuaire séparé et choisissent explicitement d'y figurer (`opt-in`); seuls les membres vérifiés peuvent consulter ces profils.
- Les responsables et mandats sont saisis, validés et publiés par des administrateurs désignés. Aucun nom, mandat ou contact ne doit être inventé.
- Les fiches peuvent être publiques ou réservées aux membres vérifiés, selon la politique de communication de la JEC.

## 23. Publication et conservation des audios

- Les membres authentifiés peuvent déposer des brouillons audio dans leur espace privé. Le fichier cloud et ses métadonnées persistent après fermeture de page, déconnexion et reconnexion.
- Le lecteur restaure dans cet ordre : version officielle publique, brouillon privé du propriétaire, copie locale de secours.
- Les brouillons ne sont jamais publics par défaut et ne sont pas accessibles aux autres membres.
- Un administrateur examine l'enregistrement et vérifie les droits avant publication.
- Une publication crée une version dans un bucket public distinct ; seule la version marquée publiée est lisible anonymement.
- L'interface doit identifier clairement « brouillon privé » et « version officielle publiée ».
- La dépublication/revocation et l'historique des versions doivent être prévus pour la version de production.

## 24. Gouvernance des rôles

- Le rôle administrateur est stocké dans une liste dédiée, non modifiable par le membre lui-même.
- La première personne administratrice est ajoutée par le propriétaire du projet après vérification de son adresse Auth et décision explicite de la JEC.
- La validation d'adhésion et l'administration de la plateforme sont deux décisions distinctes.
- Les actions sensibles (valider l'appartenance, publier une fiche officielle, rendre un audio public, attribuer un administrateur) doivent être réservées aux rôles expressément autorisés et journalisées.


## 25. Bibliothèque musicale publique

- La rubrique Chants & hymnes est consultable sans connexion ; toute personne peut lire les paroles, écouter et télécharger un enregistrement publié.
- Le dépôt et le remplacement d'un enregistrement nécessitent un compte connecté. Le bouton « Enregistrer et publier pour tous » dépose le fichier dans le bucket Storage public de la bibliothèque.
- La lecture publique est distincte des permissions d'écriture : les utilisateurs non connectés ne peuvent ni déposer, ni remplacer, ni supprimer un fichier.
- Chaque enregistrement possède des métadonnées de chant, langue, format, taille, chemin, contributeur et date de publication.
- La page affiche les versions publiques françaises et anglaises correspondant au chant sélectionné.
- Toute personne qui dépose un fichier doit disposer des droits nécessaires pour le partager publiquement ; l'interface doit rendre cette conséquence explicite avant l'enregistrement.
- Les archives institutionnelles, comptes rendus et documents internes ne doivent pas être placés dans ce bucket public. Ils relèveront d'un stockage distinct, privé, avec des permissions par structure et service.

## 26. Collaboration — espaces de travail et coordination

### Espaces de travail
- Créer des espaces privés par équipe nationale, fédération, équipe locale, commission, service ou groupe temporaire.
- Chaque espace possède un nom, une description, une liste de membres, un fil d'échanges, des projets, des tâches, des réunions et des documents.
- Les invitations sont envoyées à des comptes JEC-conNEcT existants et vérifiés ; le membre doit accepter avant d'accéder au contenu.
- Les rôles `owner`, `manager` et `member` sont limités à l'espace concerné et distincts du rôle administrateur global.
- Les responsables d'espace peuvent inviter des membres vérifiés, planifier des réunions et piloter les projets selon leurs droits.

### Projets et tâches
- Créer des projets dans un espace avec objectif, statut, priorité, responsable et échéance.
- Décomposer le travail en tâches, préciser l'échéance, l'assignation et le statut (à faire, en cours, bloqué, terminé, annulé).
- Permettre au créateur, au destinataire de la tâche et aux responsables de l'espace de mettre à jour les tâches selon les permissions.

### Réunions
- Programmer des réunions rattachées à un espace ou à un projet, avec date, heure, ordre du jour, statut et lien de visioconférence.
- Prévoir les invitations, réponses de présence, comptes rendus, pièces jointes et historique des réunions.
- La visioconférence, la transcription et la génération automatique de comptes rendus nécessitent une intégration ultérieure à des outils choisis par la JEC.

### Documents collaboratifs
- Déposer des fichiers dans un espace privé (limite prototype : 50 Mo par fichier), les classer par catégorie et les rattacher éventuellement à un projet ou une réunion.
- Les fichiers sont stockés dans le bucket privé `jec-workspace-documents`, distinct du bucket public des chants.
- L'accès se fait via des liens de téléchargement temporaires et des règles d'accès par appartenance à l'espace.
- Prévoir ultérieurement versions, approbation, verrouillage, recherche plein texte, prévisualisation et journal d'audit.

### Messagerie
- Prévoir des conversations directes entre membres, des groupes et des discussions rattachées à un espace.
- Chaque conversation possède ses participants et ses permissions ; un non-participant ne peut ni lire les messages, ni récupérer les pièces jointes.
- Prévoir accusés de lecture, notifications, recherche, pièces jointes, modération et archivage.
- Une première messagerie directe, de groupe et liée à un espace est intégrée ; elle reste distincte du fil d'échanges d'un espace. Les notifications, accusés de lecture, présence, recherche et pièces jointes feront l'objet d'itérations complémentaires.

### Sécurité et gouvernance
- Toutes les tables de collaboration sont protégées par RLS ; chaque ligne est rattachée à un espace.
- Les documents internes ne sont jamais publics et ne sont jamais stockés dans le bucket des chants.
- L'accès aux espaces est révoqué à la désactivation ou au retrait d'un membre.
- Les données et fichiers doivent rester exportables et sauvegardables.

## 27. Messagerie interne

- Conversations directes, groupes et discussions associées à un espace.
- Participants invités par adresse e-mail correspondant à un compte JEC-conNEcT vérifié ; acceptation explicite avant accès.
- Les messages ne sont accessibles qu'aux participants actifs, sans accès automatique de l'administrateur global.
- Réception des nouveaux messages en temps réel, avec chargement sécurisé de l'historique.
- Prévoir ultérieurement notifications, accusés de lecture, présence, recherche, pièces jointes, modération et archivage.

## 28. Collaboration — règles opérationnelles détaillées

- La création d'un espace est atomique : la création de l'espace et l'ajout du propriétaire se font dans la même opération serveur.
- Les invitations par e-mail ne donnent jamais accès à un compte non existant ou non vérifié ; le membre invité doit accepter explicitement.
- Les conversations directes, de groupe et d'espace sont privées. Les participants sont validés côté serveur ; un utilisateur non participant ne peut pas consulter l'historique.
- Les messages sont diffusés via Supabase Realtime, mais les données restent protégées par les règles RLS.
- Les réunions d'un espace créent une ligne de participation pour chaque membre actif : le créateur est marqué comme présent, les autres comme invités. Chaque participant peut accepter ou décliner.
- Le stockage documentaire reste privé. Les chemins Storage sont organisés par identifiant d'espace et identifiant de déposant ; les liens de consultation sont signés et temporaires.
- La suppression d'un fichier passe par l'API Storage, puis par la suppression de sa métadonnée. Le rôle anonyme ne possède aucun privilège direct sur les tables collaboratives.
- L'administration globale, la responsabilité d'un espace et l'appartenance JEC sont trois niveaux distincts. Un administrateur global n'est pas automatiquement participant à une conversation privée ni membre de chaque espace.
