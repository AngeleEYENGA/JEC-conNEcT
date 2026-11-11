# Configuration de la connexion Google

JEC-conNEcT prévoit deux modes d'authentification complémentaires :
- adresse e-mail et mot de passe (inscription, connexion et confirmation d'adresse) ;
- connexion directe « Continuer avec Google » via OAuth 2.0 / OpenID Connect, avec Supabase Auth.

## 1. Google Cloud

1. Ouvrir ou créer un projet dans Google Cloud Console.
2. Configurer l'écran de consentement OAuth (branding, audience et coordonnées).
3. Créer un identifiant client OAuth de type **Application Web**.
4. Ajouter les origines JavaScript autorisées :
   - `http://localhost:3000`
   - l'URL Vercel de prévisualisation retenue
   - le domaine de production définitif
5. Ajouter comme URI de redirection autorisée l'URL de callback fournie par le fournisseur Google dans le tableau de bord Supabase. Elle a la forme :
   `https://acznzodljeaxzkhrivmm.supabase.co/auth/v1/callback`
6. Copier le Client ID et le Client Secret. Ne jamais les commiter dans Git.

## 2. Supabase Auth

Dans Authentication > Sign In / Providers > Google :
- activer Google ;
- renseigner le Client ID et le Client Secret obtenus auprès de Google ;
- enregistrer la configuration.

Dans Authentication > URL Configuration, renseigner le Site URL et ajouter les Redirect URLs utilisées par le projet :
- `http://localhost:3000/auth/callback`
- l'URL de prévisualisation Vercel exacte suivie de `/auth/callback`
- le domaine de production exact suivi de `/auth/callback`.

Éviter les jokers trop larges en production. Limiter les redirections aux domaines contrôlés par la JEC.

## 3. Variables d'environnement de l'application

Configurer dans Vercel (Development / Preview / Production selon le besoin) :
- `NEXT_PUBLIC_SUPABASE_URL` : URL du projet Supabase ;
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` : clé publishable du projet.

La clé publishable est destinée à être utilisée côté client avec des politiques Row Level Security correctement configurées. Ne jamais exposer une clé `service_role` dans le navigateur ou dans une variable `NEXT_PUBLIC_*`.

Le Client Secret Google est configuré dans Supabase, pas dans le code source ni dans le dépôt Git.

## 4. Parcours applicatif

Le bouton « Continuer avec Google » appelle `signInWithOAuth({ provider: "google" })`. Google renvoie l'utilisateur vers Supabase, puis Supabase redirige vers `/auth/callback`. L'application échange le code OAuth contre une session.

L'inscription e-mail utilise `signUp` avec confirmation par e-mail. La connexion classique utilise `signInWithPassword`.

## 5. Vérifications avant mise en service

- Tester inscription, confirmation e-mail, connexion et déconnexion.
- Tester OAuth Google sur localhost, preview et domaine final.
- Vérifier les URL de redirection et les erreurs de callback.
- Activer les protections anti-abus et configurer SMTP transactionnel si nécessaire.
- Configurer RLS sur toutes les tables avant de stocker des données de membres.
- Ne pas utiliser le prototype pour des données personnelles ou confidentielles réelles.

Référence : documentation officielle Supabase « Sign in with Google » et « Redirect URLs ».


## 6. État de configuration de la démonstration

Le dépôt contient désormais :
- le bouton de connexion Google ;
- l'appel Supabase Auth avec provider Google ;
- la route serveur /auth/callback pour échanger le code PKCE ;
- un proxy Next.js pour actualiser les sessions par cookies ;
- la page de réinitialisation du mot de passe.

Le projet Vercel possède actuellement NEXT_PUBLIC_SUPABASE_URL, mais la variable NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY n'est pas encore renseignée. C'est pourquoi la connexion réelle ne peut pas fonctionner sur le déploiement à ce stade.

À faire :
1. Copier la clé publishable du projet Supabase depuis Project Settings > API Keys (ou l'onglet Connect selon l'interface).
2. Dans Vercel > Project > Settings > Environment Variables, ajouter NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY avec cette valeur pour Production, Preview et Development.
3. Dans Supabase > Authentication > Sign In / Providers > Google, activer Google et configurer le Client ID et le Client Secret créés dans Google Cloud Console.
4. Dans Supabase > Authentication > URL Configuration, ajouter exactement :
   - https://jec-connect-abessangel-8638.vercel.app/auth/callback
   - http://localhost:3000/auth/callback
   - les URLs Preview Vercel exactes nécessaires aux tests.
5. Redéployer Vercel et tester avec un compte Google de test.

L'URI à placer dans Google Cloud Authorized redirect URIs reste celle du projet Supabase :
https://acznzodljeaxzkhrivmm.supabase.co/auth/v1/callback

La clé publishable est conçue pour être utilisée côté client, mais ne remplace pas les politiques RLS. Le secret OAuth Google ne doit jamais être ajouté à GitHub, GitLab, au navigateur ou dans une variable NEXT_PUBLIC_*.
