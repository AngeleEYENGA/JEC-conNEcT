# Authentification JEC-conNEcT — état et configuration

Projet Supabase dédié : JEC-conNEcT
- Project ref : fivgqfsfdkkuaybahufb
- API URL : https://fivgqfsfdkkuaybahufb.supabase.co
- Région : Europe — Irlande (eu-west-1)

Le projet Supabase précédent NaVigue n'est pas utilisé par JEC-conNEcT et reste inchangé.

## 1. État déjà réalisé

- Projet Supabase séparé créé.
- Variables Vercel NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY renseignées pour Development, Preview et Production.
- Le dépôt .env.example pointe vers le nouveau projet.
- Auth e-mail/mot de passe implémentée dans l'application : inscription, connexion, demande de réinitialisation et mise à jour du mot de passe.
- OAuth Google préparé dans le code avec échange PKCE serveur via /auth/callback.
- Bucket privé jec-audio, table public.jec_song_audio et politiques RLS appliqués.
- Les brouillons audio sont limités à leur propriétaire. La publication d'un audio officiel reste une opération administrative.
- Les contrôles Supabase ne signalent aucune alerte de sécurité ou de santé sur le schéma actuel.

## 2. URL Configuration Supabase — à terminer dans le Dashboard

Ouvrir Authentication > URL Configuration.

Site URL :
https://jec-connect-abessangel-8638.vercel.app

Redirect URLs autorisées :
- https://jec-connect-abessangel-8638.vercel.app/auth/callback
- http://localhost:3000/auth/callback

Ajouter uniquement les URL Preview Vercel exactes réellement utilisées. Éviter un joker large en production.

## 3. Connexion Google — prérequis externe

Dans Google Cloud Console :
1. Créer ou choisir un projet Google Cloud.
2. Configurer l'écran de consentement OAuth.
3. Créer un identifiant OAuth de type Application Web.
4. Ajouter les origines JavaScript autorisées :
   - https://jec-connect-abessangel-8638.vercel.app
   - http://localhost:3000
5. Ajouter cette URI de redirection autorisée dans Google :
https://fivgqfsfdkkuaybahufb.supabase.co/auth/v1/callback
6. Conserver le Client ID et le Client Secret.

Dans Supabase > Authentication > Sign In / Providers > Google :
- activer Google ;
- saisir le Client ID et le Client Secret ;
- enregistrer.

Ne jamais placer le secret Google dans Git, dans le navigateur ou dans une variable NEXT_PUBLIC_*. Ne pas transmettre ce secret dans la conversation.

## 4. E-mail : confirmation et SMTP

L'authentification e-mail est activée par défaut sur les projets Supabase hébergés. La confirmation d'adresse est également activée par défaut. Pour la mise en service publique, configurer un fournisseur SMTP transactionnel dans Authentication > SMTP Settings (ou la section SMTP de l'interface actuelle).

Le service e-mail intégré de Supabase est réservé aux essais : il est limité aux adresses e-mail autorisées de l'équipe du projet et à un faible quota (2 e-mails par heure). Il ne convient pas à l'inscription de toute la communauté.

Prévoir un SMTP transactionnel géré par JEC France, avec domaine d'envoi vérifié, SPF, DKIM et DMARC. Ne pas utiliser l'adresse personnelle d'un membre comme expéditeur institutionnel.

## 5. Tests de validation à effectuer

Après ajout des URL autorisées et configuration de SMTP :
1. Inscrire un compte de test autorisé.
2. Vérifier la réception et le lien de confirmation.
3. Se connecter par e-mail et mot de passe.
4. Demander une réinitialisation et vérifier le parcours complet.
5. Tester Google OAuth une fois le fournisseur activé.
6. Vérifier qu'un utilisateur authentifié peut déposer un brouillon audio dans son dossier privé.
7. Vérifier qu'un autre utilisateur ne peut pas lire ce brouillon.
8. Vérifier que les médias ne sont pas publiquement accessibles.

L'authentification ne sera considérée comme validée de bout en bout qu'après ces tests réels. Les rôles JEC (administrateur, responsable, membre, etc.) et les profils institutionnels devront faire l'objet d'une conception et de règles RLS dédiées, sans se baser sur les métadonnées modifiables par l'utilisateur.

## 6. Références

- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/social-sign-in/auth-google
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/auth/auth-smtp
