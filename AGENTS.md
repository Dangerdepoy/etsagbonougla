# ETS AGBONOUGLA — Règles permanentes du projet

## Priorité actuelle : la peau neuve du site public

La mission en cours est exclusivement la refonte de l'identité visuelle et de l'expérience du site public ETS AGBONOUGLA. Le prompt principal fourni par l'utilisateur reste le brief détaillé de la tâche.

### Périmètre autorisé maintenant
- Auditer rapidement la structure existante, la stack, les pages, les assets et les interactions pour travailler proprement sur le site actuel.
- Refaire le design public : composition des pages, hero, typographie, palette, grilles/bento, images, navigation, micro-interactions, animations au scroll et responsive.
- Réparer les problèmes front-end rencontrés pendant cette refonte.
- Garder le site cohérent, rapide, accessible et facile à maintenir.
- Préserver les pages, contenus et URLs utiles sauf raison claire et documentée.
- Tenir à jour une courte liste des images/éléments de contenu qui manquent réellement.

### Hors périmètre jusqu'à validation explicite
Ne pas développer maintenant le CRM, le CMS, le dashboard administrateur, l'authentification, les rôles, les tables de base de données, les routes serveur, les notifications email, la configuration SMTP ou l'infrastructure de production. Ne migre pas l'application vers une nouvelle stack pour anticiper ces fonctions. Tu peux noter les besoins futurs et éviter de rendre le site difficile à faire évoluer, mais ne construis pas ces fonctions avant que l'utilisateur ait explicitement validé la direction artistique et demandé de passer à la phase suivante.

**La fin d'une première passe de code ne signifie pas que le design est validé.** L'utilisateur doit pouvoir examiner le rendu, demander plusieurs corrections et approuver le site public avant le démarrage du CRM/CMS.

## ADN visuel et métier
- Positionnement : conteneurs préfabriqués/modulaires principalement pour chantiers, bureaux et usages professionnels confirmés.
- Ne présente pas les villas, maisons ou mobil-homes comme offres principales sans preuve dans le projet.
- Style : industriel premium, éditorial, réaliste, sobre et mature. Produit d'abord, espaces bien maîtrisés, hiérarchie typographique claire, photos authentiques, composition asymétrique équilibrée.
- Inspiration palette : Paper `#F6F4F1`, Stone `#E4DED2`, Coral `#F95C4B`, Black `#000000`, à adapter à l'identité/logo réel de l'entreprise.
- Évite les motifs « IA générique » : dégradés tape-à-l'œil, glow, glassmorphism systématique, cartes inutiles, compteurs décoratifs, boutons flottants gratuits, icônes emoji et animations envahissantes.
- Utilise les assets du projet après les avoir examinés. Ne déforme jamais le logo et n'invente pas de photos, de clients, d'avis, de certifications, de chiffres ou de caractéristiques techniques.
- Conserve la signature « Design & développement par LAMANO DESIGN ». Le lien doit utiliser une URL vérifiée du projet ou une configuration clairement à compléter ; ne fabrique pas l'adresse du portfolio.

## Qualité d'implémentation
- Avant une modification importante, comprends le code concerné et évite de réécrire des parties sans nécessité.
- Travaille par étapes cohérentes, garde le projet exécutable et corrige les régressions introduites.
- Vérifie au minimum les vues mobile, tablette et desktop ; contrôle débordements horizontaux, titres coupés, menus, formulaires, liens, images, focus clavier et console navigateur lorsque les outils sont disponibles.
- Respecte `prefers-reduced-motion`. Les animations doivent améliorer la lecture et ne jamais masquer le contenu essentiel.
- N'affirme pas qu'une fonction ou un test a réussi s'il n'a pas été réellement vérifié.
- Sois économe en tokens et en dépendances : privilégie quelques décisions visuelles fortes, des composants réutilisables et des changements ciblés plutôt que de multiplier les fichiers, bibliothèques et documents.
- Si une information métier ou une URL manque, note-la clairement au lieu de l'inventer.

## Ordre de travail
1. Examiner rapidement le site et comprendre les assets existants.
2. Refaire la direction artistique et les pages publiques prioritaires.
3. Vérifier le responsive, les interactions et les performances.
4. Présenter les changements et les limites à valider par l'utilisateur.
5. Attendre la validation explicite avant tout travail CRM/CMS/backend.
