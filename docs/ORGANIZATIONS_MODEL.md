# Architecture multi-organisations JEC-conNEcT

## Modèle

JEC-conNEcT adopte un référentiel commun, organisé en trois niveaux :

1. **International** : mouvement ou coordination internationale.
2. **Mouvement national** : mouvement d'un pays.
3. **Groupe local** : équipe de ville, établissement ou territoire, rattachée à un mouvement national.

Pour permettre une adoption progressive, un mouvement national peut temporairement être créé comme organisation racine avant d'être rattaché à une organisation internationale. Un groupe local, en revanche, doit toujours avoir un mouvement national parent.

## Adhésions

Un même compte peut appartenir à plusieurs organisations. Chaque adhésion possède son propre rôle et son propre état : propriétaire, administrateur, responsable, secrétaire, trésorier, communication, audiovisuel, spiritualité, membre ou invité.

Les adhésions actives à une organisation parente donnent accès aux organisations descendantes. L'adhésion à un groupe local ne donne pas automatiquement accès aux données de son mouvement national ou de ses groupes frères.

Les rôles propriétaire / administrateur restent attribués par un administrateur JEC global dans cette première version. Les responsables d'une organisation peuvent gérer les membres et les organisations de leur périmètre descendant.

## Isolation des données

- Les organisations publiques ne révèlent que les informations institutionnelles prévues pour l'annuaire.
- Les adresses e-mail de contact ne deviennent publiques qu'avec le booléen de consentement `public_contact_enabled`.
- Les coordonnées géographiques représentent un lieu institutionnel public, jamais l'adresse personnelle d'un membre.
- Les espaces de travail peuvent être rattachés à une organisation via `jec_workspaces.organization_id`.
- Un espace sans organisation conserve son comportement historique. Un espace rattaché exige que les membres aient une adhésion active à son organisation ou à une organisation parente.
- Les documents, réunions, tâches, projets et conversations d'espace continuent d'être protégés par les politiques d'accès de l'espace ; les contrôles de membre d'espace vérifient aussi le rattachement organisationnel.

## Migration progressive

La migration `202611170002_organization_hierarchy_multi_tenant.sql` ajoute les tables et les règles, sans créer de faux groupes, sans réassigner les espaces de test et sans modifier les adhésions existantes. Les nouveaux champs `organization_id` restent nuls tant qu'un administrateur n'a pas validé le rattachement.

Aucune migration n'a été appliquée à la base de production pendant cette étape. Le SQL doit être exécuté et vérifié sur une base de prévisualisation avant toute application en production. Les noms des mouvements, les groupes locaux, les contacts publics et leurs coordonnées doivent être validés par les responsables concernés.

## Non-objectifs de cette première étape

Cette fondation ne crée pas encore la carte publique, le workflow complet d'invitation des organisations, les formulaires de gestion multi-organisations ni les notifications internationales. Elle prépare les données et les barrières d'accès nécessaires à ces écrans.
