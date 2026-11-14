# JEC IA — configuration et gouvernance

## Fonctionnement

JEC IA est un assistant documentaire bilingue français / anglais. Il recherche d'abord dans `public.jec_ai_sources`, puis transmet uniquement les sources retournées par la recherche autorisée au moteur IA.

La génération utilise l'API OpenAI Responses côté serveur :
- endpoint : `POST https://api.openai.com/v1/responses`
- clé exclusivement côté serveur ;
- modèle choisi explicitement par l'administrateur ;
- `store: false` dans la requête ;
- citations au format `[S1]`, `[S2]` rattachées aux sources réellement récupérées.

Documentation API : https://developers.openai.com/api/reference/resources/responses/methods/create

## Variables Vercel nécessaires

Dans le projet Vercel `jec-connect`, ajouter les deux variables suivantes pour les environnements voulus (Production, Preview et/ou Development) :

| Variable | Valeur |
|---|---|
| `OPENAI_API_KEY` | Clé secrète d'un projet OpenAI API autorisé |
| `JEC_AI_MODEL` | Identifiant exact d'un modèle disponible dans ce projet API |

Ne jamais préfixer la clé par `NEXT_PUBLIC_`. Ne jamais coller la clé dans le code, dans GitHub ou dans un message de conversation. L'abonnement ChatGPT et les crédits OpenAI API sont deux services de facturation distincts.

Après ajout ou modification des variables, redéployer l'application.

## Sources intégrées au premier lot

Treize sources publiques validées sont chargées par la migration `20261114190000_jec_ai_knowledge_base.sql` :
- histoire JEC France depuis 1929 ;
- repères de la coordination internationale JECI / IYCS ;
- pédagogie Voir–Juger–Agir ;
- cinq piliers JEC France ;
- orientations JEC France 2021–2026, avec précaution sur leur période de validité ;
- programme publié du Camp National Universitaire de Garoua 2026 ;
- chant de ralliement en français et en anglais ;
- hymne JEC en français et en anglais ;
- trois publications JEC France de 2026.

La source du Camp de Garoua précise que le programme pouvait être modifié. JEC IA doit donc le présenter comme un programme publié, et non comme une preuve que toutes les activités ont effectivement eu lieu.

## Gouvernance des sources

L'administration dispose de `/gestion/jec-ai` :
1. saisir le titre, l'éditeur, la référence, l'URL éventuelle et le texte vérifié ;
2. choisir le périmètre `public`, `members` ou `workspace` ;
3. enregistrer en brouillon ;
4. relire et approuver explicitement la source.

Les sources en brouillon ou archivées ne sont pas consultables par le moteur. La recherche est une fonction SQL `SECURITY INVOKER` : les politiques RLS Supabase continuent de s'appliquer aux sources membres et espace.

Les fichiers stockés dans `jec_documents` ne sont pas encore extraits automatiquement. Pour le premier lot, un administrateur colle le texte extrait et vérifié dans le formulaire de source. L'indexation automatique de PDF/Word et l'OCR feront l'objet d'une phase distincte.

## Confidentialité

- Les messages de messagerie, les conversations, les transcriptions de réunion et les comptes rendus ne sont pas indexés automatiquement.
- Aucune source interne n'est rendue publique par défaut.
- Les sources `members` ne sont retournées qu'aux membres JEC vérifiés et administrateurs.
- Les sources `workspace` ne sont retournées qu'aux membres de l'espace concerné.
- Si une source privée est ajoutée et retrouvée pour un utilisateur autorisé, son texte est transmis au fournisseur IA pour produire la réponse. Ne pas indexer de document confidentiel avant validation des règles de traitement des données, du contrat fournisseur et des informations à communiquer aux personnes concernées.
- L'historique de chat reste dans l'état de la page pendant la session ; il n'est pas persisté dans les tables de messagerie.
- `store: false` désactive le stockage de réponse côté API Responses, mais ne constitue pas à lui seul une garantie générale de conservation nulle chez le fournisseur. Vérifier les conditions applicables au projet OpenAI avant tout usage sensible.

## Comportement attendu

JEC IA doit :
- répondre dans la langue utilisée ;
- distinguer JEC France, JECI / IYCS et les mouvements nationaux ;
- s'appuyer seulement sur les sources récupérées ;
- citer les références réellement fournies ;
- annoncer l'absence de source lorsqu'elle ne peut pas répondre ;
- distinguer les faits documentés des suggestions d'animation ou d'interprétation ;
- ne pas inventer de responsables, mandats, dates, partenariats, décisions ou paroles de chants.

## Tests de recette suggérés

1. « Comment fonctionne le Voir–Juger–Agir ? » → source JEC France « Notre démarche ».
2. « Quels sont les cinq piliers de la JEC ? » → source « Les piliers de la JEC ».
3. « Que dit le programme du 28 juillet à Garoua ? » → livret Garoua 2026, en rappelant son caractère prévisionnel.
4. « Donne-moi le chant de ralliement en anglais. » → document source anglais.
5. Question sur un mandat ou une adresse non documentés → l'assistant doit reconnaître l'absence d'information.
6. Vérifier qu'un compte non membre ne récupère aucune source `members` ou `workspace`.
