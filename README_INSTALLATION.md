# Installation des règles — ETS AGBONOUGLA

Ce pack ne crée pas plusieurs agents. Il ajoute des règles de projet pour que l'agent principal garde le bon périmètre.

## Installation

1. Décompressez ce pack **dans le dossier racine du projet**, c'est-à-dire le dossier `etsagbonougla.net` qui contient `index.html`, `style.css` et `script.js`.
2. Vérifiez que `AGENTS.md` se trouve au même niveau que `index.html`.
3. Si Antigravity a déjà un `AGENTS.md` dans le projet, ne l'écrasez pas : fusionnez les règles pertinentes.
4. Ouvrez le dossier du projet comme workspace dans Antigravity. Les règles `AGENTS.md` à la racine du workspace sont découvertes automatiquement par Antigravity selon sa documentation officielle.
5. Dans la conversation d'implémentation, joignez/utilisez aussi le prompt principal de refonte. Le prompt décrit les livrables ; `AGENTS.md` rappelle continuellement le périmètre et les garde-fous.

## Nombre d'agents recommandé

- Maintenant : **un seul agent d'implémentation à la fois** (Gemini ou Claude, selon celui qui donne le meilleur résultat sur ton environnement). Évite deux agents qui modifient les mêmes fichiers.
- Plus tard, lorsque plusieurs pages seront visuellement avancées : un deuxième agent peut servir de **relecteur indépendant**, idéalement en lecture seule. Utilisez alors `PROMPT_REVUE_VISUELLE.md` ; il ne doit pas éditer le code.
- La phase CRM/CMS commencera uniquement après validation explicite de l'identité visuelle.
