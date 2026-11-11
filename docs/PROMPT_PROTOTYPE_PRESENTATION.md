# Prompt maître — JEC-conNEcT (prototype de présentation)

À utiliser pour créer et faire évoluer **la version de présentation uniquement**. Le produit définitif, son infrastructure de production et ses fournisseurs seront décidés après validation et financement.

## Mission
Agis comme une équipe senior (product design, architecture logicielle, développement full-stack, accessibilité, cybersécurité et documentation). Construis **JEC-conNEcT**, une plateforme numérique responsive pour la JEC France, premium, moderne, professionnelle et communautaire.

**Slogan :** Connecter. Collaborer. Construire ensemble.

## Règle de contenu non négociable : aucune donnée factuelle inventée
Le prototype doit présenter des faits publics vérifiables à partir de sources existantes. Ne remplis jamais l'interface avec des données fictives présentées comme des faits de la JEC.

Chaque actualité, événement, date historique, structure ou document public doit afficher :
- source (organisation ou média) ;
- date de publication ou date de l'événement, selon le cas ;
- lien vers la publication originale ;
- date de dernière vérification lorsque pertinent.

Sources de départ :
- JEC France : https://jecfrance.org/
- Histoire JEC France : https://jecfrance.org/notre-histoire/
- Démarche Voir-Juger-Agir : https://jecfrance.org/notre-demarche/
- Piliers de la JEC : https://jecfrance.org/les-piliers-de-la-jec/
- Équipes et fédérations : https://jecfrance.org/nos-equipes/
- Orientations : https://jecfrance.org/nos-orientations/
- JECI/IYCS — Dicastère pour les Laïcs, la Famille et la Vie : https://www.laityfamilylife.va/content/laityfamilylife/fr/associazioni-e-movimenti/repertorio/gioventu-studentesca-cattolica-internazionale-.html
- JMJ 2027 France : https://www.jmj2027.fr/

Consulte le registre `docs/REGISTRE_SOURCES_PUBLIQUES.md`. Si une information ne peut pas être confirmée, affiche « À vérifier auprès de la JEC » ou ne l'affiche pas.

### Interdictions
Ne jamais inventer :
- membres, responsables, fonctions ou participants ;
- effectifs, statistiques, connexions ou indicateurs ;
- réunions, ordres du jour, décisions, procès-verbaux ou votes internes ;
- annonces de Summer Camp, propositions acceptées, budgets, partenaires ou lieux non publiés ;
- documents comptables, archives, rapports ou fichiers prétendus officiels.

Les espaces privés sans données vérifiées doivent être des états vides : « Aucun contenu disponible » / « Espace réservé aux membres habilités ». Un compte de démonstration peut servir à tester l'interface, mais il doit être clairement anonyme et ne pas représenter une personne réelle. Les actions créées localement doivent être étiquetées « brouillon de test » et ne doivent pas apparaître comme des annonces officielles.

Pour les contenus externes (JMJ, actualités jeunesse, humanitaire, Europe, etc.), préciser qu'ils sont externes et ne pas laisser entendre que la JEC les organise ou les soutient sans source.

## 1. Identité visuelle
Nom exact : **JEC-conNEcT**. Utilise le logo fourni par l'organisation et les variantes présentes dans `public/brand/`. Préserve proportions, couleurs et lisibilité ; ne redessine pas le symbole. Palette inspirée du logo :
- jaune `#F0CB1B`, rose `#C695AA`, magenta `#E00079`, prune `#A72176` ;
- orange `#E98233`, rouge `#D72C25`, bleu ciel `#A2D2E9`, cyan `#00A6D5` ;
- bleu `#0C67AE`, vert `#007D43`, vert anis `#A6C639`, brun `#A17E5B` ;
- bleu nuit d'interface `#202A46`.

Direction premium, moderne, professionnelle et communautaire. Les couleurs vives servent d'accents. Assure contraste, lisibilité, états focus/hover et navigation mobile. Utilise le logo pour favicon, icône web et icône d'installation.

## 2. Stack du prototype
- Next.js App Router, TypeScript, CSS/Tailwind et composants accessibles.
- Déploiement de présentation sur Vercel (preview et partage par lien).
- Supabase Auth pour tester la connexion si les secrets sont configurés.
- Contenus publics sourcés ; les modules privés peuvent rester vides.
- Ne jamais committer de secrets, mot de passe, client secret Google ou clé `service_role`.

Les outils de cette maquette ne constituent pas le choix d'infrastructure du produit définitif. Ne prétends pas que l'environnement gratuit est prêt pour des données sensibles ou un usage de production.

## 3. Authentification
Prévoir :
- inscription e-mail / mot de passe ;
- connexion et déconnexion ;
- vérification d'adresse et réinitialisation ;
- connexion directe Google via OAuth 2.0 / OpenID Connect avec Supabase Auth ;
- callback, états d'erreur et de succès.

Si OAuth n'est pas configuré, expliquer que le bouton attend l'activation du fournisseur. Un compte Google ne donne pas automatiquement un rôle ni l'accès à un espace privé. Les droits sont attribués par l'administration selon les règles validées par la JEC.

## 4. Architecture fonctionnelle

### Espace public
- site institutionnel ;
- découvrir la JEC ;
- histoire, mission, démarche et piliers ;
- **frise chronologique interactive de la JEC** ;
- structures publiquement référencées ;
- actualités vérifiées ;
- agenda des événements publiquement annoncés ;
- annuaire de sources et ressources.

### Espace membre
- Community ;
- Workspace (équipes, canaux et messagerie) ;
- Réunions ;
- Projets et événements ;
- Documents et archives ;
- Gouvernance ;
- Formation et ressources ;
- JEC AI et reporting ;
- Administration.

Employer uniquement les appellations officielles confirmées dans les sources ou validées par la JEC France.

## 5. Module phare — Frise chronologique de la JEC
Créer une frise interactive, responsive et éditorialement soignée. Elle doit distinguer clairement :
- l'histoire de la JEC en France ;
- l'histoire de la coordination internationale JECI/IYCS ;
- les événements historiques de contexte ;
- les archives et témoignages ajoutés ultérieurement.

Chaque jalon contient : date affichée, niveau de précision, titre, résumé, contexte, périmètre (France/international), source principale cliquable et date de vérification.

Premiers jalons autorisés, documentés dans le registre :
- **Mai 1929 — France :** premiers jécistes et lancement du mouvement, selon la page historique JEC France.
- **Juillet 1929 — France :** première édition de « La JEC, esquisse d’un programme général ».
- **1930 — France :** lancement de `L’Appel`, organe mensuel de la JEC.
- **1946 — International :** fondation de la coordination internationale JECI/IYCS.
- **Mai 1968 — France :** la JEC accompagne les jeunes dans les turbulences de Mai 68 ; afficher comme repère de période, sans fabriquer un événement précis.
- **25 mars 2009 — International :** reconnaissance de l’IYCS comme association internationale de fidèles.

Ne pas présenter 1946 comme la date de fondation de la JEC France. Ne pas inventer de nouveaux jalons. Les archives, anciens logos, publications, témoignages et photos pourront être ajoutés quand leur provenance, date et droits auront été validés. La frise doit permettre de filtrer France / International, sélectionner une date, lire le contexte et ouvrir la source.

## 6. Actualités et veille
Afficher des articles publics réellement publiés. Résumé fidèle et court, source, date, lien d'origine. Distinguer actualités de la JEC et actualités externes. Préparer une architecture pour une future agrégation RSS/API, mais ne scrape pas et ne fabrique pas de flux. Pas de contenu sans source vérifiable.

## 7. Workspace et réunions
Préparer les écrans Teams-like : équipes, canaux, conversations, recherche, pièces jointes, invitations, agenda de réunion, ordre du jour, visioconférence, notes, transcription, synthèse et suivi des actions. Tant qu'aucune donnée interne autorisée n'est disponible, afficher des espaces vides et des scénarios de démonstration génériques clairement signalés comme tels. Toute captation ou transcription réelle exige information, base légale, accès contrôlé et politique de conservation.

## 8. Projets, événements et gouvernance
Prévoir les écrans de planification, tâches, calendrier, inscriptions et suivi. Ne pas annoncer de Summer Camp ou de décision interne non publiée. Pour les élections, distinguer sondage de démonstration et scrutin statutaire ; toute simulation doit porter la mention « sans valeur statutaire ».

## 9. Documents et archives
Prévoir classement, recherche, provenance, année, service propriétaire, confidentialité, version, conservation et passation de mandat. N'afficher que des documents publics authentiques dans le prototype. Pour les dossiers comptables, PV internes et données personnelles, afficher un espace privé non alimenté.

## 10. JEC AI et reporting
Prévoir des outils de synthèse, de rédaction de brouillons, d'aide au reporting et de recherche documentaire. L'IA doit citer les sources disponibles, signaler les lacunes et ne jamais inventer de chiffres. Validation humaine obligatoire des documents officiels. Aucun accès à des documents non autorisés.

## 11. Sécurité et transparence
- Séparer public, interne et confidentiel.
- Ne pas afficher de KPI inventé.
- Aucun secret dans le navigateur ou le dépôt.
- Les contrôles d'accès doivent être réellement appliqués côté serveur pour toute donnée privée.
- Afficher « prototype de présentation » et la date de vérification des contenus publics.
- Signaler les écrans non connectés et les fonctions simulées.

## 12. Livrables
- Application de démonstration locale et URL Vercel.
- Authentification e-mail et Google préparée.
- Frise interactive avec sources.
- Registre des sources publiques.
- Guide de configuration OAuth.
- README, journal de progression et liste des fonctions disponibles / à venir.
- Cahier des charges distinct pour l'infrastructure de production.

Avant d'ajouter tout fait, vérifie la source, la date, le périmètre (France/international), la précision et le lien. La fiabilité éditoriale prime sur la quantité de contenus.


## 13. Bilinguisme français / anglais
Prévoir un sélecteur FR / EN cohérent et persistant dans l'interface. Traduire les navigations, boutons, états vides, pages publiques, formulaires, connexion et pages de découverte. Conserver les titres d'articles, citations et publications dans leur langue d'origine lorsqu'il s'agit de la source officielle ; proposer un résumé traduit clairement identifié si nécessaire.

## 14. Bibliothèque musicale JEC
Créer un espace « Chants & hymnes » comprenant :
- le chant de ralliement et tous ses couplets, son refrain et ses éventuelles variantes ;
- l'hymne JEC en français et en anglais ;
- une fiche par chant avec auteur, compositeur, source, version, langue et statut de validation lorsque l'information est connue ;
- paroles structurées couplet par couplet ;
- lecteur audio intégré, avec enregistrements associés ;
- filtres par chant et langue.

Ne jamais inventer, compléter de mémoire ou paraphraser les paroles officielles. Si les textes ne sont pas encore fournis, afficher un état vide et une zone de brouillon explicitement non publiée. Les versions définitives doivent être fournies ou validées par la JEC et les droits de reproduction, de traduction, de stockage et de diffusion doivent être confirmés. Les brouillons locaux ne sont pas présentés comme officiels et ne sont pas synchronisés entre utilisateurs.

## 15. Direction artistique et médias
L'interface ne doit pas être uniquement composée de blocs de texte. Prévoir des visuels et illustrations pertinents : vie étudiante, rassemblements, musique, formation, patrimoine, actualités et événements. Employer les illustrations originales du dossier public/images. Utiliser des photographies d'archives uniquement lorsqu'elles sont réelles, sourcées, datées et autorisées. Les images générées doivent être présentées comme des illustrations, jamais comme une preuve historique ou une photographie d'un événement JEC.

## 16. OAuth et configuration vérifiable
L'authentification Google doit suivre le flux PKCE avec Supabase Auth :
- appel signInWithOAuth provider google ;
- redirectTo exact vers /auth/callback ;
- échange du code côté serveur avec cookies sécurisés ;
- rafraîchissement de session dans proxy.ts pour Next.js 16 ;
- affichage d'une erreur explicite lorsque la clé publique Supabase manque, que Google n'est pas activé ou que l'URL de retour n'est pas autorisée.

Ne jamais présenter OAuth comme opérationnel tant que la clé publique Supabase, le fournisseur Google, les identifiants OAuth Google et les URL de redirection ne sont pas configurés et testés sur local, Preview et Production.
