# Archives JEC — fonctionnement et gouvernance

## Objectif

Le module **Archives JEC** (`/archives`) constitue le catalogue patrimonial de JEC-conNEcT. Il est séparé des documents de travail privés de chaque workspace.

Il est conçu pour recevoir progressivement des documents historiques, programmes, publications, photographies, affiches, enregistrements, vidéos, témoignages et comptes rendus anciens.

Le catalogue n'est pas pré-rempli avec des documents fictifs. Les fiches apparaissent après transmission et validation éditoriale.

## Métadonnées conservées

Chaque fiche peut documenter :
- titre et description historique ;
- collection et type de document ;
- événement ou période concernée, date du document ;
- organisation productrice, structure JEC, pays et langue ;
- référence d'origine, cote éventuelle et URL de la source ;
- mots-clés ;
- titulaire des droits et statut de réutilisation ;
- périmètre de diffusion et statut éditorial ;
- un ou plusieurs fichiers numériques.

## Processus de dépôt et de publication

1. Un compte JEC vérifié (ou administrateur) transmet une fiche.
2. Les pièces jointes sont déposées dans le bucket privé `jec-archives`.
3. La fiche passe en attente de validation (`review`) et reste visible uniquement au déposant et aux administrateurs.
4. Un administrateur vérifie la provenance, la datation, la qualité de la numérisation et les droits de réutilisation.
5. L'administrateur approuve la fiche pour les membres vérifiés ou pour le site public.
6. Une fiche publique ne peut être approuvée que si le statut des droits est `permission_granted` ou `public_domain`.
7. Une fiche retirée du catalogue passe au statut `archived`.

Les statuts de droits `not_checked`, `restricted`, `refused` et `unknown` ne permettent pas une publication publique.

## Accès et sécurité

Tables :
- `public.jec_archive_items` : notices patrimoniales et métadonnées ;
- `public.jec_archive_files` : métadonnées des fichiers associés.

Stockage :
- bucket privé `jec-archives` ;
- taille maximale par fichier : 50 Mo ;
- formats admis : PDF, Word, PowerPoint, texte, images, audio et vidéo courants ;
- les fichiers sont servis avec des URL signées temporaires après vérification des politiques Storage.

Périmètres :
- `public` : visiteurs et utilisateurs authentifiés, uniquement après approbation ;
- `members` : membres JEC vérifiés et administrateurs ;
- `workspace` : membres actifs de l'espace concerné ;
- `draft` / `review` : déposant et administrateurs uniquement.

Les politiques RLS des tables et de Storage sont appliquées côté serveur. Un utilisateur ne peut pas approuver sa propre soumission. Le bucket n'est pas public.

## Collections proposées

- Histoire du mouvement
- Événements
- Publications
- Photographies
- Archives sonores
- Vidéos
- Témoignages
- Affiches et visuels
- Comptes rendus
- Autres archives

La frise chronologique et la bibliothèque de chants restent des modules documentaires distincts ; l'écran Archives les relie comme ressources patrimoniales déjà consultables.

## État initial

La structure technique et les politiques d'accès sont créées. Le catalogue commence volontairement vide : aucun document ni visuel historique n'est inventé. Les premières fiches doivent être constituées à partir de documents transmis ou de sources vérifiables, puis validées par les responsables JEC.

## Entretien et précautions

- Conserver l'original numérique quand il est disponible et documenter toute conversion.
- Ne pas publier un visage, une coordonnée personnelle ou un témoignage identifiable sans base légale et autorisation adaptées.
- Ne pas déduire une date exacte d'un document qui ne donne qu'une année ou une période.
- Mentionner la provenance et le niveau de certitude.
- Ne pas confondre les documents de la JEC France avec ceux de la JECI/IYCS ou d'un mouvement national.