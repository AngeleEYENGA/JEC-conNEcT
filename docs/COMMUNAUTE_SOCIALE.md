# Espace Communauté — JEC Connect

## Objectif
Créer un fil communautaire global, distinct des fils privés des Workspaces. Il permet aux membres JEC vérifiés de partager des nouvelles, des idées et leur humeur, puis d'interagir avec les publications des autres membres.

## Périmètre de la première version
- Fil d'actualité global réservé aux membres JEC vérifiés et aux administrateurs.
- Publication de textes (1 à 5 000 caractères) avec humeur facultative.
- Humeurs proposées : joie, gratitude, espoir, réflexion, fatigue, préoccupation, motivation et célébration.
- Une réaction par membre et par publication : j'aime, amour, soutien, célébration ou prière.
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

## Limites connues / prochaines évolutions
- La première version est textuelle : la publication de photos et de vidéos nécessitera un chantier séparé de stockage, validation des types/tailles, génération d'URL signées ou publiques selon la décision de confidentialité, et politique de suppression.
- Les fils par fédération, commission ou groupe local, les mentions, hashtags, réponses imbriquées et classement avancé ne sont pas inclus dans ce premier lot.
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
