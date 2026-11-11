# Suivi du projet JEC-conNEcT

**Phase actuelle :** prototype de présentation et cadrage initial.

| Chantier | État | Commentaire |
|---|---|---|
| Cadrage produit | En cours | Vision et modules définis ; arbitrages du Bureau à obtenir. |
| Dépôt GitHub / Vercel | Démarré | Dépôt connecté et prévisualisation déployée. |
| Authentification | Partiellement intégrée | E-mail/mot de passe et Google OAuth préparés ; configuration Supabase/Google à finaliser. |
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
Chaque fonctionnalité doit comporter un statut, une priorité, un responsable, une date cible et des critères d'acceptation. Chaque décision doit être datée, attribuée à l'instance compétente et reliée à son compte rendu. Le prototype utilise exclusivement des données fictives.


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
