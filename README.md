# JEC-conNEcT

**Connecter. Collaborer. Construire ensemble.**

Plateforme numérique collaborative destinée à la JEC France, pensée pour centraliser la vie communautaire, les communications, les réunions, les projets, les documents et la mémoire du mouvement.

## Démonstration
- [Ouvrir JEC-conNEcT](https://jec-connect-abessangel-8638.vercel.app)
- [Inscription et connexion](https://jec-connect-abessangel-8638.vercel.app/login)

## Histoire et frise chronologique
Une frise interactive est disponible sur la page [Découvrir la JEC](https://jec-connect-abessangel-8638.vercel.app/decouvrir#frise-chronologique). Les premiers jalons sont documentés dans [le registre des sources publiques](docs/REGISTRE_SOURCES_PUBLIQUES.md). Les dates et niveaux de précision respectent les sources ; l'histoire française est distinguée de l'histoire internationale JECI/IYCS.

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


## Bibliothèque musicale
Une première interface est disponible sur https://jec-connect-abessangel-8638.vercel.app/chants. Elle prévoit le chant de ralliement, l'hymne JEC, les paroles en français et en anglais, la gestion des couplets et l'écoute de fichiers audio. Les textes et enregistrements officiels restent à fournir et valider ; aucun couplet n'est inventé.

## Français / English
Un sélecteur FR / EN est intégré au portail, à la connexion, à la page de découverte et à la bibliothèque musicale. Les contenus institutionnels conservent leur source et leur langue d'origine.

## Contenus de démonstration
Le portail public privilégie les informations vérifiables issues de sources existantes et les relie à leur publication d'origine. Les illustrations graphiques sont des créations d'interface, pas des photographies d'événements réels. Les espaces internes restent vides ou en brouillon local tant que la JEC n'a pas fourni et validé les données correspondantes.

## Icône et illustrations
L'icône navigateur dédiée à JEC-conNEcT est définie par app/icon.svg. Les illustrations originales sont dans public/images/.


## Audio : état de la persistance
Le prototype enregistre déjà les fichiers audio dans IndexedDB sur l'appareil. Une intégration facultative au stockage privé Supabase est préparée dans le code et la migration `supabase/migrations/202611120001_create_jec_audio_library.sql`. La migration et la configuration Supabase ne sont pas encore activées ; la synchronisation entre appareils ne doit donc pas être considérée comme disponible.
