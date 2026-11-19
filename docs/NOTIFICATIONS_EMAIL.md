# E-mails transactionnels JEC Connect — nouveaux messages

## Fonctionnement
- Après une insertion réussie dans `public.jec_messages`, le client authentifié appelle la fonction Edge `send-message-notification-email`.
- La fonction vérifie le JWT, confirme que l'appelant est bien l'expéditeur du message, récupère les membres actifs de la conversation et envoie un message transactionnel à chacun d'eux.
- Le contenu du message n'est jamais inséré dans l'e-mail.
- `public.jec_notification_email_deliveries` assure l'idempotence avec une contrainte unique (message, destinataire). La table ne contient ni texte du message ni adresse e-mail et n'est accessible qu'à `service_role`.
- Les échecs sont journalisés avec un code générique ; les identifiants SMTP et les détails d'erreur ne sont jamais journalisés.

## Secrets à ajouter dans Supabase → Edge Functions → Secrets
- `SMTP_HOSTNAME=smtp.gmail.com`
- `SMTP_PORT=465`
- `SMTP_USERNAME=<adresse Google autorisée à envoyer>`
- `SMTP_PASSWORD=<mot de passe d'application Google>`
- `SMTP_FROM=JEC Connect <adresse-expediteur>`
- `APP_BASE_URL=https://jec-connect-ten.vercel.app`

Le port 465 est utilisé avec TLS implicite. Les ports 25 et 587 sont bloqués par l'environnement Edge Functions hébergé de Supabase. Le mot de passe Google normal ne doit pas être utilisé : créer un mot de passe d'application sur le compte Google avec validation en deux étapes, selon les règles de l'organisation Google concernée.

## Limites de cette première version
- Un e-mail immédiat est tenté pour chaque membre actif autre que l'expéditeur.
- Une livraison est tentée une seule fois par message et destinataire ; l'idempotence évite les doublons.
- Le réglage individuel (désactivation, mode résumé, plages silencieuses) et le mécanisme de reprise automatique des échecs seront ajoutés avec le centre des préférences de notifications.
- Les SMS via Twilio ne font pas partie de cette implémentation et restent une perspective liée au financement.
