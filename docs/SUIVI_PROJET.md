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
