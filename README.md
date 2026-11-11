# JEC-conNEcT

**Connecter. Collaborer. Construire ensemble.**

Plateforme numérique collaborative destinée à la JEC France, pensée pour centraliser la vie communautaire, les communications, les réunions, les projets, les documents et la mémoire du mouvement.

## Démonstration
- [Ouvrir JEC-conNEcT](https://jec-connect-abessangel-8638.vercel.app)
- [Inscription et connexion](https://jec-connect-abessangel-8638.vercel.app/login)

## Authentification
Le prototype prévoit la création de compte par e-mail/mot de passe et la connexion directe avec Google via Supabase Auth (OAuth). Le bouton et le flux OAuth sont intégrés au code ; l'activation réelle nécessite encore la configuration du fournisseur Google dans Supabase et les identifiants OAuth dans Google Cloud. Voir [docs/GOOGLE_AUTH_SETUP.md](docs/GOOGLE_AUTH_SETUP.md).

## Produit
- Site institutionnel et actualités
- Communauté et publications
- Workspace : équipes, canaux et messagerie
- Réunions, calendrier et comptes rendus
- Projets et événements
- Documents et archives
- Gouvernance et consultations
- Formation et ressources
- Veille et actualités externes
- Assistant IA et reporting
- Administration et droits d'accès

## Sécurité du prototype
Le prototype est un environnement de démonstration avec des données fictives. Ne pas y déposer de données personnelles réelles, documents comptables, procès-verbaux confidentiels, transcriptions réelles ou informations électorales. Il ne constitue pas le service de production de la JEC.

## Technologies de présentation
Next.js, TypeScript, Supabase Auth (après configuration) et Vercel. L'architecture et les fournisseurs du produit définitif seront réévalués après validation et financement.

## Icônes et marque
Le logo fourni sert de base à l'icône Next.js dans `app/icon.png`. Les variantes de marque et formats complémentaires sont réunis dans le dossier de livrables du projet.
