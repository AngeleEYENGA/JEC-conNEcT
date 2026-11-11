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
