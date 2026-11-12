# Ressources et éléments à fournir par la JEC — JEC-conNEcT

**Statut :** liste préparatoire — collecte à organiser après validation du projet définitif et choix des fournisseurs.
**Périmètre :** JEC France. Les accès et documents doivent être fournis par les responsables habilités, via des canaux sécurisés.

## 1. Gouvernance et personnes référentes

- Désigner un sponsor institutionnel du projet et une personne décisionnaire.
- Désigner un référent fonctionnel pour chaque grand domaine (secrétariat, communication, trésorerie, vie des équipes, formation, gouvernance, archives et partenariats).
- Désigner un référent technique et au moins un administrateur de secours.
- Définir les personnes habilitées à créer, valider, suspendre et supprimer des comptes.
- Définir le processus de passation des accès lors des changements de mandat.
- Fournir les coordonnées institutionnelles des référents, et non leurs identifiants personnels.

## 2. Identité numérique, domaines et adresses e-mail

- Nom officiel de l'organisation à afficher et éventuels noms d'usage validés.
- Nom de domaine institutionnel détenu ou contrôlé par la JEC, ainsi que le registrar et les coordonnées de son titulaire.
- Accès administrateur ou procédure de délégation au gestionnaire DNS du domaine, à utiliser uniquement lorsque les responsables autorisent une modification.
- Adresse e-mail institutionnelle générale (par exemple contact@...), déjà existante, avec confirmation de son propriétaire et de son usage.
- Adresse de support des utilisateurs de la plateforme.
- Adresse technique/administrative pour recevoir les alertes des fournisseurs.
- Adresse d'expédition des messages automatiques (confirmation de compte, réinitialisation, notifications).
- Adresses ou groupes institutionnels pour les rôles sensibles (administration, secrétariat, communication, trésorerie), selon le besoin.
- Règles de gestion des boîtes partagées, délégations, MFA, récupération et continuité d'accès.

**À décider après validation des outils :** choix de la solution de messagerie et de l'hébergement des boîtes ; configuration SMTP transactionnel ; vérification du domaine d'envoi ; enregistrements SPF, DKIM et DMARC ; politique de conservation des messages.

Une adresse institutionnelle non-Gmail peut être utilisée comme adresse d'assistance si elle est admissible dans le compte Google concerné (compte Google associé ou groupe Google géré par l'organisation). Vérifier cette condition au moment du paramétrage Google Auth Platform.

## 3. Comptes propriétaires des services et fournisseurs

Prévoir, après sélection définitive de l'architecture, des comptes institutionnels détenus par la JEC et non par une personne seule pour :

- fournisseur cloud et organisation d'administration ;
- hébergement, déploiement, nom de domaine et DNS ;
- dépôt de code source et gestion des accès développeurs ;
- base de données, authentification, stockage de fichiers et sauvegardes ;
- messagerie transactionnelle et notifications ;
- visioconférence, réunions et transcription, si retenues ;
- supervision, journaux, alertes et gestion des incidents ;
- outils d'IA et services tiers éventuellement retenus.

Pour chaque service : indiquer le propriétaire institutionnel, deux administrateurs au minimum lorsque possible, le mode de facturation, les coordonnées de support, les conditions contractuelles, la procédure de récupération et les modalités de sortie/réversibilité.

Ne jamais partager les mots de passe dans un document de cadrage, un dépôt Git ou une conversation. Utiliser un gestionnaire de mots de passe institutionnel, des invitations nominatives, le MFA et une procédure d'accès d'urgence.

## 4. Informations administratives et juridiques

- Dénomination juridique exacte de la structure qui porte le service et coordonnées officielles.
- Adresse du siège ou adresse de contact officielle.
- Identifiants administratifs applicables (RNA, SIREN/SIRET, le cas échéant).
- Nom et coordonnées de la personne habilitée à accepter les contrats et conditions des fournisseurs.
- Mentions légales, politique de confidentialité et conditions d'utilisation à valider.
- Coordonnées du responsable de traitement et, si désigné, du DPO ou référent RGPD.
- Procédure de traitement des demandes d'accès, de rectification, d'effacement et des incidents.
- Durées de conservation, règles d'archivage et politique de suppression.
- Analyse des sous-traitants, lieux d'hébergement, transferts éventuels, contrats et clauses de protection des données.

## 5. Identité visuelle et contenus institutionnels

- Logo officiel en formats vectoriel et raster, avec variantes autorisées et règles d'utilisation.
- Charte graphique, typographies et codes couleurs, si disponibles.
- Nom, description courte et longue de JEC-conNEcT.
- Textes validés de présentation de la JEC, de ses missions, valeurs, structures et contacts.
- URL institutionnelles et liens officiels.
- Mentions de crédits, licences et autorisations de réutilisation des photos, vidéos, chants, musiques et archives.
- Contacts habilités à valider les publications et traductions françaises/anglaises.

## 6. Données, documents et règles de fonctionnement

- Organigramme institutionnel validé et liste des structures concernées.
- Matrice des rôles et permissions (qui peut consulter, créer, modifier, valider, publier, exporter et supprimer).
- Classification documentaire et règles d'accès par service.
- Modèles officiels : comptes rendus, ordres du jour, rapports, conventions, courriers et formulaires.
- Politique d'archivage, de versionnage et de passation entre mandats.
- Règles statutaires validées pour les consultations et élections ; les procédures de vote ne seront configurées qu'après validation spécifique.
- Politique d'enregistrement et de transcription des réunions, information des participants et durées de conservation.
- Données de test fictives ou anonymisées pour les premiers essais ; aucune liste réelle de membres ne doit être importée sans validation juridique et sécurité.

## 7. Partenaires — module futur

- Liste des organisations partenaires validées et coordonnées institutionnelles autorisées.
- Référent JEC pour chaque relation.
- Conventions, lettres d'engagement et documents dont le partage numérique est autorisé.
- Autorisations d'utilisation des noms, logos, photos et communications des partenaires.
- Règles d'accès des partenaires externes, durée des invitations, périmètre des espaces et procédure de révocation.
- Opportunités, projets communs et résultats publiables après validation.

Ce volet est une évolution ultérieure et ne doit pas retarder le socle initial de la plateforme.

## 8. Sécurité et continuité

- Politique MFA et gestion des appareils administrateurs.
- Gestionnaire de mots de passe institutionnel et procédure de secours.
- Liste des comptes et propriétaires techniques, avec revue périodique des habilitations.
- Stratégie de sauvegarde, tests de restauration et objectifs de reprise.
- Journalisation, supervision, alertes et procédure de réponse aux incidents.
- Procédure de départ d'un salarié, bénévole, administrateur ou prestataire.
- Plan de réversibilité : export des données, récupération des fichiers, code source, DNS et suppression contrôlée chez les fournisseurs.

## 9. Décisions à prendre avant la mise en production

- Valider l'architecture et la liste définitive des fournisseurs.
- Valider le budget initial et les coûts récurrents.
- Choisir les comptes institutionnels propriétaires et les administrateurs.
- Valider le domaine, l'adresse de support et les adresses d'expédition.
- Choisir le fournisseur SMTP et approuver les enregistrements DNS à publier.
- Valider les politiques légales, RGPD, conservation, accès et sécurité.
- Valider les rôles, le processus d'inscription et la liste des structures pilotes.
- Valider le volet Partenaires et son périmètre dans une phase ultérieure.

## 10. Règles de collecte

Cette liste est un inventaire de préparation, pas une demande de transmission immédiate des secrets. Les identifiants, secrets OAuth, clés API privées, clés de chiffrement et mots de passe ne doivent jamais être placés dans ce document ou dans Git. Ils seront créés et saisis directement dans les consoles officielles, dans des coffres adaptés, avec des droits restreints.

Les ressources institutionnelles seront demandées seulement après validation du projet final, du budget et des outils retenus par les instances compétentes de la JEC.

---

## Annexe — configuration temporaire Google OAuth du prototype

- Projet Google Cloud de test distinct : « JEC-conNEcT OAuth ».
- Le projet Navigue ne doit être ni sélectionné ni modifié.
- Tant que les outils définitifs ne sont pas validés, utiliser le compte Gmail personnel uniquement pour les essais et notifications temporaires si nécessaire.
- Avant la production, transférer la propriété et l'administration à des comptes institutionnels ou ajouter les administrateurs JEC désignés, puis remplacer l'adresse de support personnelle par l'adresse institutionnelle admissible.
- Le fournisseur Google pour l'application demande seulement l'identité de base (openid, email, profile) ; aucun accès Gmail ou Drive ne doit être demandé pour le simple bouton « Continuer avec Google ».
- Le Client ID et le Client Secret OAuth sont saisis directement dans Supabase Auth. Le secret n'est jamais ajouté à GitHub, à une variable NEXT_PUBLIC_* ni à une conversation.
