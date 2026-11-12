# Guide de démarrage — Collaboration JEC-conNEcT

## 1. Créer le premier espace

1. Connecte-toi à JEC-conNEcT avec un compte administrateur.
2. Dans le menu Collaboration, ouvre **Workspace**.
3. Dans « Créer un espace de travail », renseigne le nom, le type (équipe nationale, fédération, équipe locale, commission, service, projet ou groupe temporaire) et une description.
4. Crée l'espace. Le compte administrateur qui le crée est automatiquement ajouté comme propriétaire.

Les espaces ne sont pas préremplis avec des noms de commissions ou services non validés. Utilise les intitulés décidés par les responsables de la JEC.

## 2. Inviter les membres

1. Ouvre l'espace créé.
2. Va dans l'onglet **Membres**.
3. Saisis l'adresse e-mail du compte JEC-conNEcT existant.
4. Choisis « Membre » ou « Responsable » puis envoie l'invitation.
5. Le membre invité ouvre « Workspace » sur son compte et accepte l'invitation.

Seuls les comptes dont l'appartenance JEC est vérifiée (ou les administrateurs de plateforme) peuvent être invités. La connexion seule ne suffit pas.

## 3. Travailler dans l'espace

- **Fil d'échanges :** publier des nouvelles, questions et informations liées à l'équipe.
- **Tâches :** ajouter des actions, définir une priorité et une échéance, puis suivre leur statut.
- **Projets :** les propriétaires et responsables d'espace créent les projets et précisent l'objectif et la date cible.
- **Réunions :** les propriétaires et responsables programment les réunions, ajoutent un ordre du jour et un lien de visioconférence.
- **Documents :** tous les membres actifs peuvent déposer des fichiers (50 Mo maximum), les classer et les télécharger.

Les téléchargements de documents utilisent des liens signés temporaires. Les fichiers restent dans un bucket privé distinct de la bibliothèque musicale publique.

## 4. Rôles dans un espace

| Rôle | Capacités principales |
|---|---|
| Propriétaire | Gérer l'espace et ses membres, projets et réunions |
| Responsable | Inviter des membres vérifiés, organiser projets et réunions, gérer l'espace |
| Membre | Consulter le contenu, publier dans le fil, créer des tâches et déposer des documents |

Le rôle Administrateur JEC-conNEcT est global et distinct des rôles de chaque espace.

## 5. Modules transversaux

- **Projets :** vue globale des projets des espaces auxquels tu as accès.
- **Réunions :** vue globale des réunions programmées dans tes espaces.
- **Documents :** vue globale des documents accessibles dans tes espaces.
- **Messagerie :** l'écran d'entrée est en place, mais les conversations directes et de groupe restent à développer dans une phase suivante.

## 6. Limites de la première tranche

- Pas de chat instantané, de présence en ligne ni de notifications en temps réel pour le moment.
- Pas encore de visioconférence intégrée, de transcription automatique ou de comptes rendus générés par IA.
- Pas encore de versionnage documentaire, validation de documents ou recherche plein texte.
- Aucun espace institutionnel n'a été créé automatiquement : le premier espace doit être créé avec un intitulé validé par la JEC.

## 7. Vérifications avant ouverture à toute la JEC

- Tester avec au moins un propriétaire, un responsable et un membre simple.
- Vérifier qu'un membre non invité ne peut pas ouvrir un espace.
- Vérifier qu'un invité ne peut consulter le contenu qu'après acceptation.
- Vérifier qu'un membre d'un espace ne peut pas télécharger les documents d'un autre espace.
- Confirmer les règles de conservation, de sauvegarde et de suppression des documents.
- Traiter l'alerte RLS de `private.jec_admins` avant la mise en production institutionnelle complète.

## 8. Utiliser la messagerie

1. Ouvre **Messagerie** dans le menu Collaboration.
2. Clique sur « Nouvelle conversation ».
3. Choisis : conversation directe (un seul autre membre), groupe (plusieurs membres) ou conversation d'espace (membres actifs de l'espace).
4. Pour une conversation directe ou un groupe, saisis les adresses e-mail des comptes JEC-conNEcT vérifiés. Sépare les adresses par des virgules ou des points-virgules.
5. Les personnes invitées acceptent depuis la rubrique Invitations avant de lire et d'envoyer des messages.
6. Les nouveaux messages apparaissent en temps réel dans le fil de discussion.

Les administrateurs de la plateforme ne peuvent pas lire automatiquement une conversation privée s'ils n'en sont pas participants. Seuls les participants actifs ont accès aux messages.

## 9. Limites actuelles de la messagerie

- Pas encore de notifications push/e-mail, indicateurs non lus ou accusés de lecture.
- Pas encore de pièces jointes, recherche dans l'historique, présence ou modification/suppression des messages depuis l'interface.
- La diffusion temps réel concerne les nouveaux messages ; le chargement de l'historique s'effectue à l'ouverture de la conversation.
