# Premier administrateur JEC-conNEcT — procédure de mise en place

**Projet :** Supabase JEC-conNEcT (`fivgqfsfdkkuaybahufb`).
**But :** attribuer le rôle d'administrateur à une personne expressément désignée par la JEC, sans permettre l'auto-attribution à partir d'un compte membre.

## 1. Préparer le compte

1. La personne désignée crée son compte JEC-conNEcT avec son adresse personnelle ou professionnelle autorisée.
2. Elle confirme son adresse e-mail et se connecte une première fois.
3. Elle complète son prénom, nom et nom d'affichage dans « Mon compte ».
4. Le propriétaire du projet vérifie l'adresse e-mail dans Supabase > Authentication > Users.

Le rôle administrateur est distinct du statut d'adhésion vérifiée. Une personne connectée ou membre ne devient pas automatiquement administratrice.

## 2. Attribuer le premier rôle administrateur

Ouvrir le SQL Editor du projet Supabase JEC-conNEcT :
https://supabase.com/dashboard/project/fivgqfsfdkkuaybahufb/sql/new

Après avoir vérifié l'adresse e-mail du compte, remplacer `ADMIN_EMAIL_A_VERIFIER` dans la requête ci-dessous, puis exécuter :

```sql
insert into private.jec_admins (user_id, reason)
select id, 'Premier administrateur JEC-conNEcT désigné et vérifié par le propriétaire du projet'
from auth.users
where lower(email) = lower('ADMIN_EMAIL_A_VERIFIER')
on conflict (user_id) do nothing;
```

Vérifier qu'une ligne a bien été créée :

```sql
select u.email, a.granted_at, a.reason
from private.jec_admins a
join auth.users u on u.id = a.user_id;
```

Ne pas ajouter de compte sur la seule base d'un nom d'affichage. Vérifier l'e-mail et obtenir la désignation explicite de la personne par les responsables compétents.

## 3. Vérifier l'accès

1. Déconnecter puis reconnecter le compte désigné (ou recharger l'application).
2. Ouvrir `https://jec-connect-abessangel-8638.vercel.app/gestion`.
3. Vérifier que l'espace d'administration s'ouvre.
4. Vérifier que le compte peut valider/refuser les demandes d'adhésion, publier les fiches d'annuaire et examiner/publier les audios soumis.
5. Avec un compte ordinaire distinct, vérifier que `/gestion` affiche un refus d'accès et que les actions administratives ne sont pas disponibles.

## 4. Règles de gouvernance

- Conserver au moins deux administrateurs de confiance lorsque la JEC aura désigné un binôme de continuité.
- Limiter ce rôle aux fonctions explicitement autorisées par la JEC.
- Réexaminer les administrateurs à chaque changement de mandat et retirer les accès qui ne sont plus nécessaires.
- Ne jamais ajouter le rôle via `user_metadata`, un champ de profil modifiable par l'utilisateur ou une simple adresse e-mail non vérifiée.
- Garder une trace de la décision institutionnelle qui justifie chaque attribution.

## 5. Retirer un administrateur

Après validation par le propriétaire du projet et en conservant au moins un administrateur actif, supprimer la ligne ciblée :

```sql
delete from private.jec_admins
where user_id = (
  select id from auth.users
  where lower(email) = lower('ADMIN_EMAIL_A_VERIFIER')
);
```

Ne pas exécuter cette requête si elle retire le dernier administrateur. Le maintien d'un propriétaire opérationnel est indispensable.

## 6. Limites actuelles

- Aucun compte n'est promu administrateur automatiquement par cette procédure documentaire.
- Les nouveaux comptes commencent avec une adhésion `pending` ; un administrateur valide explicitement l'adhésion.
- L'annuaire institutionnel reste vide tant que les fonctions, noms et coordonnées officiels n'ont pas été saisis et validés.
- Les enregistrements de la bibliothèque musicale sont publics dès leur enregistrement par un utilisateur connecté. L'administrateur peut supprimer un fichier depuis Administration > Bibliothèque musicale ; la suppression se fait via l'API Storage et non par DELETE SQL sur storage.objects.
- Les privilèges SQL et politiques RLS restent l'autorité finale : masquer un bouton dans l'interface ne suffit pas à protéger une action.

## 7. Tableau de bord administrateur — fonctionnalités

Depuis le menu principal, après connexion avec un compte administrateur, ouvrir « Espace administrateur » ou /gestion.

- Gestion des comptes : consulter les comptes inscrits, leur e-mail, date de création, statut d'adhésion et rôle administrateur.
- Adhésion : valider, refuser ou remettre en attente l'appartenance à la JEC.
- Rôles : attribuer ou retirer le rôle administrateur. La base empêche de retirer le dernier administrateur.
- Bibliothèque musicale : consulter les enregistrements publiés et supprimer un audio. La suppression utilise supabase.storage.from(bucket).remove([path]), puis supprime sa métadonnée.
- Annuaire : créer des fiches institutionnelles en brouillon et publier les fiches après validation des informations officielles.

La ligne incorrecte rally/fr qui correspondait à Hymne_de_la_JEC.mp3 peut être supprimée sans toucher à la ligne anthem/fr. Dans le tableau de bord, vérifier impérativement le chant et la langue avant de confirmer la suppression.