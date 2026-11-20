# Espace Communauté — JEC Connect

## Objectif
Créer un fil communautaire global, distinct des fils privés des Workspaces. Il permet aux membres JEC vérifiés de partager des nouvelles, des idées et leur humeur, puis d'interagir avec les publications des autres membres.

## Périmètre fonctionnel
- Fil d'actualité global réservé aux membres JEC vérifiés et aux administrateurs.
- Publication de textes (jusqu'à 5 000 caractères) avec humeur facultative.
- Pièces jointes : images JPEG/PNG/WebP/GIF, vidéos MP4/WebM et audios MP3/M4A/AAC/WAV/OGG/WebM.
- Limites d'envoi : 5 fichiers au maximum par publication, 20 Mo par fichier et 50 Mo cumulés par publication.
- Prévisualisation des médias avant publication, galerie d'images, lecteur vidéo et lecteur audio.
- Une réaction par membre et par publication : j'aime, amour, soutien, célébration ou prière.
- Le bouton « J'aime » est mis en avant ; les autres réactions restent disponibles.
- Repartage d'une publication originale avec commentaire facultatif ; la publication d'origine est affichée dans la carte de repartage.
- Notification interne à l'auteur lorsqu'un autre membre repartage sa publication.
- Commentaires (1 à 2 000 caractères).
- Modification et suppression de ses propres publications ; suppression de ses propres commentaires.
- Signalement de publications ou commentaires.
- File de modération réservée aux administrateurs : masquer un contenu ou classer un signalement sans suite.
- Notifications internes pour l'auteur lorsqu'un autre membre commente ou réagit à sa publication.
- Rafraîchissement temps réel via Supabase Realtime.

## Accès et confidentialité
- Les visiteurs anonymes et les comptes dont l'adhésion est en attente ou rejetée ne peuvent pas ouvrir la route `/communaute`.
- Le proxy Next.js protège la route ; les politiques RLS Supabase restent la protection effective des données.
- Les publications et commentaires sont accessibles aux membres vérifiés ; les publications masquées ne sont visibles que par leur auteur et les administrateurs.
- Un membre ne peut modifier que le corps et l'humeur de sa propre publication. Il ne peut pas modifier le statut de modération.
- Les réactions sont limitées à une par membre et par publication.
- Les signalements ne sont visibles que par leur auteur et les administrateurs.
- Les notifications ne recopient ni le texte du commentaire ni le contenu de la publication.

## Modération et règles communautaires
La page rappelle les règles de bienveillance, de respect, de confidentialité et de signalement. Les responsables JEC devront valider une charte de modération avant l'ouverture à grande échelle : critères de retrait, délais de traitement, recours, conservation des signalements et personnes habilitées.

## Stockage et sécurité des médias
- Les médias sont conservés dans le bucket privé Supabase Storage `jec-community-media`.
- Les objets sont isolés par chemin `user_id/post_id/` ; les politiques Storage contrôlent les uploads, lectures et suppressions.
- Les métadonnées sont conservées dans `jec_community_media`, protégée par RLS.
- L'interface crée des URL signées temporaires (1 heure) ; aucun lien public permanent n'est généré.
- Les membres vérifiés et administrateurs peuvent lire les médias des publications publiées ; la politique Storage vérifie aussi l'existence de la pièce jointe et la visibilité de la publication. Les fichiers privés ne sont pas exposés aux visiteurs anonymes.
- La suppression d'une publication tente également de supprimer ses objets Storage.
- Les GIF animés sont acceptés. Les animations d'interface respectent la préférence système « réduire les animations ».

## Limites connues / prochaines évolutions
- Les GIF, photos, vidéos et audios sont acceptés ; les formats vidéo sont limités à MP4/WebM, et aucun transcodage ou compression automatique n'est effectué.
- Les fils par fédération, commission ou groupe local, les mentions, hashtags, réponses imbriquées et classement avancé ne sont pas inclus dans ce lot.
- Les commentaires restent textuels dans cette version ; les pièces jointes aux commentaires ne sont pas incluses.
- Les notifications push système (mobile, tablette, ordinateur) et les e-mails transactionnels/de confirmation sont reportés aux perspectives de la présentation, après tests de délivrabilité et choix de financement.
- Les SMS via Twilio sont également reportés aux perspectives, sous réserve de financement.

## Critères d'acceptation
1. Un membre vérifié peut publier un texte et une humeur.
2. Un second membre vérifié voit la publication, peut réagir et commenter.
3. L'auteur reçoit une notification interne lors d'une réaction ou d'un commentaire d'un autre membre.
4. Un membre ne peut pas modifier ou supprimer le contenu d'un autre membre.
5. Un membre peut signaler un contenu sans rendre son signalement public.
6. Un administrateur peut consulter la file de signalements et masquer un contenu.
7. Un compte en attente et un visiteur ne peuvent pas accéder au fil.
8. Les espaces de travail et conversations privées restent isolés du fil communautaire global.


## Évolution médias et repartage — 20 novembre 2026
- Migrations Supabase appliquées : `20261119215121_jec_community_media_and_shares_20261120`, `20261119220552_jec_community_media_read_scope_20261120` et `20261119221704_jec_community_reaction_update_scope`, `20261119223455_jec_community_reshare_rls_recursion_fix`, `20261119223951_jec_community_media_20mb_per_file_limit` et `20261119224024_jec_community_media_50mb_post_limit`.
- Bucket privé : `jec-community-media`, taille maximale Storage 50 Mo par objet.
- Table de métadonnées : `jec_community_media`, RLS activée et accès anonyme absent.
- Upload de 5 fichiers maximum par post, 20 Mo chacun, 50 Mo cumulés côté interface.
- Formats : JPEG, PNG, WebP, GIF, MP4, WebM, MP3, M4A, AAC, WAV et OGG.
- URLs signées temporaires d'une heure pour afficher les fichiers sans rendre le bucket public.
- Repartage via `shared_post_id`, commentaire facultatif et notification interne à l'auteur de l'original.
- Réactions existantes conservées et bouton J'aime visuellement priorisé.
- Animations de cartes, réactions et fenêtres ; prise en compte de `prefers-reduced-motion`.
- Vérifications SQL : bucket privé, RLS sur la table médias, politiques SELECT/INSERT/DELETE sur les métadonnées et SELECT/INSERT/DELETE Storage. Le parcours authentifié d'envoi et de repartage reste à tester avec un compte membre vérifié.


## Correctif des réactions — 19 novembre 2026
- Cause : le client utilisait `upsert` pour changer une réaction, alors que le rôle `authenticated` ne possède qu'un droit de mise à jour limité à la colonne `reaction_type`.
- Correctif frontend : insertion si aucune réaction n'existe ; mise à jour de `reaction_type` si le membre a déjà réagi ; suppression si le même choix est recliqué. Aucun `upsert` n'est utilisé.
- Politique RLS UPDATE renforcée : uniquement la réaction du membre connecté, et uniquement sur une publication encore publiée.
- Les privilèges restent limités : pas de droit UPDATE global sur la table, ni sur les colonnes `post_id` et `user_id`.


## Validation complémentaire — 19 novembre 2026
- Correctif RLS du repartage : la vérification de la publication source passe par `private.jec_can_reshare_community_post(uuid)`, fonction non exposée qui vérifie `auth.uid()`, le statut publié et l'absence de repartage imbriqué. L'exécution est accordée uniquement à `authenticated`.
- Test transactionnel sous le rôle `authenticated` d'un membre vérifié : insertion d'un repartage réussie ; la transaction est ensuite annulée.
- Test transactionnel avec deux membres vérifiés : le repartage déclenche une notification `community_share` pour l'auteur original ; la transaction est ensuite annulée.
- Test transactionnel des politiques média : lecture des métadonnées et de l'objet Storage réussie pour un média rattaché à une publication publiée ; la transaction est ensuite annulée.
- Limites serveur : Storage bloque les fichiers au-delà de 20 MiB ; un trigger refuse plus de 50 MiB de médias cumulés pour une publication. Les positions 0 à 4 et l'unicité `(post_id, position)` limitent à cinq pièces jointes.
- Le transfert réel d'un fichier depuis le navigateur via l'API Storage et l'affichage de son URL signée restent à valider avec une session de membre dans la prévisualisation. Les tests SQL valident les droits et contraintes, pas le transfert binaire HTTP de bout en bout.
