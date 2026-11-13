# JEC-conNEcT — Phase 2 de la collaboration

Cette phase renforce les espaces de travail, la gestion de projet, les réunions et les appels. Elle ne met pas encore en service l'assistant IA ni les archives avancées.

## Notifications personnelles

Le centre de notifications est présent dans l'interface globale et reçoit les nouveaux événements en temps réel via Supabase Realtime.

Événements actuellement couverts :
- invitation à une réunion ;
- attribution ou réattribution d'une tâche ;
- nouveau message dans une conversation active ;
- commentaire sur une tâche suivie par son créateur ou son responsable.

Les notifications ne recopient ni le contenu des messages ni le texte des transcriptions. Chaque compte ne peut consulter que ses propres notifications et ne peut modifier que leur date de lecture. La création des notifications est réservée aux déclencheurs de la base.

## Historique des projets

Un fil d'activité est désormais affiché dans chaque fiche projet. Il enregistre la création et les changements significatifs de projets, tâches, jalons et réunions associées. Les événements sont limités aux membres autorisés de l'espace de travail.

Les tâches créées depuis une réunion sont rattachées au projet de cette réunion lorsqu'un projet est associé.

## Réunions collaboratives

Les données suivantes se synchronisent entre les participants autorisés :
- statut de la réunion et réponses de présence ;
- points de l'ordre du jour ;
- décisions consignées ;
- comptes rendus ;
- transcriptions ;
- actions et tâches liées à la réunion.

Le bouton « Préremplir le compte rendu » construit un brouillon déterministe à partir des données déjà enregistrées (présences, ordre du jour, décisions et actions). Ce n'est pas une génération par IA : le secrétariat doit relire, compléter et valider le document.

Les comptes rendus peuvent être enregistrés comme brouillon, partagés, puis approuvés et verrouillés par les responsables. Les comptes rendus et les transcriptions peuvent être téléchargés séparément en Markdown ou en texte brut.

## Appels audio / vidéo

La salle d'appel utilise WebRTC pair-à-pair avec signalisation Supabase. Elle prend en charge le microphone, la caméra, la présence des participants, la sortie de l'appel et le partage d'écran via l'autorisation native du navigateur.

JEC-conNEcT ne stocke pas l'audio ni la vidéo des appels et n'enregistre pas automatiquement les écrans partagés. Les participants doivent être informés et donner leur accord avant l'activation de leur microphone, caméra ou partage d'écran.

**Limite réseau :** la configuration actuelle repose sur STUN. Cela suffit pour certains réseaux, mais ne garantit pas la connectivité derrière tous les NAT et pare-feu. Un service TURN doit être configuré côté serveur, avec des identifiants temporaires et protégés, avant de présenter les appels comme fiables en production.

## Transcription

La transcription peut être saisie manuellement ou provenir de l'API SpeechRecognition du navigateur lorsqu'elle est disponible. Le navigateur peut faire appel à son propre service de reconnaissance vocale ; cette dépendance est signalée dans l'interface.

Le consentement explicite est demandé avant la capture. Seul le texte résultant est enregistré dans Supabase ; aucun fichier audio brut n'est conservé par l'application. La responsable de réunion doit vérifier l'exactitude du texte et les conditions de conservation avant diffusion.

## Sécurité et accès

Les tables jec_user_notifications et jec_activity_events ont RLS activé. Les notifications sont privées à leur destinataire. Le fil d'activité est visible par les membres de l'espace de travail (et les administrateurs JEC autorisés). Les écritures sont effectuées par des fonctions internes déclenchées par la base.

Les tables de collaboration concernées sont publiées dans supabase_realtime, mais leurs politiques RLS existantes restent applicables aux événements reçus.

## Hors périmètre de cette phase

- assistant IA et génération automatique de comptes rendus ;
- archivage institutionnel avancé, classement, versions et recherche plein texte ;
- enregistrement audio/vidéo ou stockage des captures ;
- TURN/SFU de production et supervision qualité des appels ;
- système d'approbation des transcriptions et politique de conservation formalisée.

Ces sujets sont à traiter dans une phase distincte, après validation des règles de gouvernance, des droits d'accès et des durées de conservation.
