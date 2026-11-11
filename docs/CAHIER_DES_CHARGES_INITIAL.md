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
