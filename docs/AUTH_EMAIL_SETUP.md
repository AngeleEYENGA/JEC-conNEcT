# Rendre l'inscription e-mail opérationnelle — JEC-conNEcT

## Cause constatée

Les comptes e-mail/mot de passe sont bien créés par Supabase Auth. En revanche, le projet utilise encore le serveur SMTP de test intégré à Supabase.

Ce serveur ne délivre les e-mails qu'aux adresses des membres de l'équipe de l'organisation Supabase. Il ne s'agit donc ni d'une restriction de domaine dans JEC-conNEcT, ni d'un problème Vercel. Une personne peut apparaître dans `auth.users` avec `email_confirmed_at = null`, puis rester incapable de se connecter tant qu'elle n'a pas confirmé son adresse.

Les journaux Auth du 14 novembre 2026 montrent :
- `POST /signup` : HTTP 200 pour une nouvelle adresse ;
- `mail.send` depuis `noreply@mail.app.supabase.io` avec le type `confirmation` ;
- une tentative de renvoi 4 secondes après : HTTP 429, `over_email_send_rate_limit` (délai restant de 55 secondes).

Le HTTP 200 signifie que la demande d'inscription a été acceptée, pas que le destinataire externe a reçu le message.

Références officielles :
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/testing-auth-flows

## Configuration à réaliser dans Supabase

Cette configuration se fait dans le tableau de bord Supabase du projet JEC-conNEcT, pas dans Vercel.

1. Choisir un fournisseur d'e-mails transactionnels (par exemple Resend, Brevo, Postmark, Amazon SES, SendGrid ou ZeptoMail).
2. Créer le compte du fournisseur et vérifier un domaine d'envoi contrôlé par la JEC (ou un sous-domaine dédié tel que `auth.<domaine-jec>`). Ne pas utiliser une adresse personnelle comme expéditeur d'un service collectif.
3. Configurer les enregistrements DNS demandés par le fournisseur, en particulier SPF et DKIM. Ajouter DMARC conformément à la politique de la JEC.
4. Dans Supabase : **Authentication → Emails → SMTP Settings** (ou **Project Settings → Authentication → SMTP**, selon la version du tableau de bord), activer le SMTP personnalisé et saisir :
   - Host ;
   - Port (généralement 587 avec STARTTLS, selon le fournisseur) ;
   - Username ;
   - Password / clé SMTP ;
   - Sender name : `JEC-conNEcT` ;
   - Sender email : l'adresse vérifiée sur le domaine JEC.
5. Vérifier que **Confirm email** reste activé dans **Authentication → Sign In / Providers → Email**.
6. Dans **Authentication → URL Configuration**, conserver l'URL de site de production et autoriser les URL de rappel de l'application, notamment `https://jec-connect-ten.vercel.app/auth/callback` et l'alias de production effectivement utilisé.
7. Commencer avec une limite d'envoi prudente. Supabase indique qu'un nouveau SMTP personnalisé démarre avec une limite basse (30 messages/heure), ajustable dans **Authentication → Rate Limits** selon le volume attendu et les limites du fournisseur.
8. Enregistrer puis tester avec une adresse externe qui ne fait pas partie de l'équipe Supabase. Le test n'est valide qu'après réception réelle du message, clic sur le lien et connexion avec le mot de passe choisi.

Ne jamais ajouter tous les membres JEC à l'équipe de l'organisation Supabase pour contourner cette restriction : les membres de cette équipe ont des droits d'administration sur le projet / l'organisation. Ne pas désactiver la confirmation e-mail : cela autoriserait l'inscription avec une adresse appartenant à quelqu'un d'autre.

## Comportement après le réglage

- Les nouveaux comptes peuvent s'inscrire avec leur propre adresse e-mail et leur mot de passe.
- Ils reçoivent un lien de confirmation, puis peuvent se connecter avec `signInWithPassword`.
- L'inscription et l'adhésion JEC restent deux étapes distinctes. Après confirmation, le compte reste `pending` jusqu'à validation administrative ; l'accès à un espace nécessite ensuite une invitation.
- Les comptes déjà créés mais non confirmés doivent recevoir un nouveau lien de confirmation après activation du SMTP. Ne pas leur demander de recréer un compte.

## Sécurité des identifiants

Les identifiants SMTP ne doivent pas être ajoutés au dépôt GitHub ni aux variables publiques `NEXT_PUBLIC_*`. Ils sont enregistrés dans les paramètres SMTP Auth de Supabase. Si un secret est transmis à l'administrateur, utiliser un canal sécurisé et ne jamais l'insérer dans le code source.
