# JEC-conNEcT

**Connecter. Collaborer. Construire ensemble.**

La plateforme numérique collaborative de la Jeunesse Étudiante Chrétienne (JEC).

## Démonstration en ligne

- Application : https://jec-connect-abessangel-8638.vercel.app
- Connexion / inscription : https://jec-connect-abessangel-8638.vercel.app/login

Le prototype utilise des données fictives. Les écrans de connexion e-mail et Google sont intégrés au code, mais l'authentification réelle attend la configuration des variables Supabase et des identifiants OAuth Google. Voir [le guide de configuration](docs/GOOGLE_AUTH_SETUP.md).

## Vision

Centraliser la communication, les actualités, les événements, les espaces de travail, les documents et la mémoire institutionnelle de la JEC France, avec une architecture extensible vers les mouvements JEC internationaux.

## Périmètre du prototype

Le prototype de démonstration sert à tester les parcours et l'ergonomie. Il ne doit contenir aucune donnée personnelle réelle ni document confidentiel.

## Authentification prévue

- Création de compte par adresse e-mail et mot de passe.
- Connexion et déconnexion classiques.
- Vérification de l'adresse e-mail et réinitialisation du mot de passe (à finaliser dans le parcours produit).
- Connexion directe avec Google via OAuth 2.0 / OpenID Connect, intégrée avec Supabase Auth.
- Gestion du profil et des sessions.

La connexion Google doit être activée côté Supabase et configurée avec un client OAuth Google. Les URL de redirection autorisées (locales et domaines Vercel de prévisualisation/production) doivent être déclarées dans Supabase et Google Cloud Console. Aucun secret OAuth ne doit être commité dans ce dépôt.

## Architecture du produit

- JEC Community — actualités et publications
- JEC Workspace — équipes, canaux et messagerie
- JEC Meetings — réunions, visioconférence et comptes rendus
- JEC Projects — projets, activités et événements
- JEC Documents — bibliothèque documentaire et archives
- JEC Governance — consultations et processus électoraux
- JEC Knowledge — histoire, formation et ressources
- JEC News — veille et actualités externes
- JEC AI — assistance rédactionnelle, synthèse et reporting
- JEC Admin — administration, rôles et pilotage

## Stack du prototype

Next.js, TypeScript, CSS responsive et Supabase Auth. Le déploiement de démonstration est relié à Vercel et au dépôt GitHub. Les choix de production feront l'objet d'une analyse de sécurité, de coûts et de conformité avant mise en service.

## Principes de sécurité

- Accès selon les rôles et les organisations.
- Principe du moindre privilège.
- Séparation des données par organisation.
- Documents confidentiels dans un stockage privé.
- Protection des secrets via variables d'environnement.
- Traçabilité des opérations sensibles.
- Validation humaine des productions IA et des documents officiels.

## Avertissement

Le prototype et ses données de démonstration ne constituent pas un système opérationnel de gestion des membres, des finances, des élections ou des archives officielles. Aucun traitement de données réelles de la JEC ne doit y être effectué avant validation de la sécurité et de la conformité.
