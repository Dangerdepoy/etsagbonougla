# PROMPT — PHASE 1 : REFONTE VISUELLE PREMIUM D’ETS AGBONOUGLA

## CONSIGNE PRIORITAIRE — À RESPECTER AVANT TOUT

**La mission d’aujourd’hui est exclusivement la refonte du design, de l’expérience utilisateur et de l’ADN visuel du site public ETS AGBONOUGLA. C’est la priorité majeure et urgente.** Le résultat doit donner l’impression d’un site industriel professionnel, mature, soigné et conçu sur mesure — pas d’un template générique généré par IA.

Le projet contiendra peut-être plus tard un serveur, une base de données, un CRM et une interface d’administration/CMS. **C’est une évolution prévue pour une phase ultérieure, pas le travail demandé aujourd’hui.** Garde cette information en mémoire comme contrainte pour la suite du projet, mais ne commence pas à développer ces fonctionnalités maintenant.

Pour cette première phase :
- Refonds le site public existant : direction artistique, structure des pages, dispositions, typographie, couleurs, visuels, composants, interactions, animations et responsive.
- Inspecte la stack et le fonctionnement actuel afin de travailler proprement, de ne rien casser et de préserver autant que possible les contenus, URL, formulaires et fonctions déjà utiles.
- Tu peux rendre le code plus propre et préparer une structure front-end réutilisable qui facilitera les prochaines étapes. Tu peux documenter brièvement les prérequis techniques d’une future phase serveur/admin, mais **n’installe pas et ne développe pas le backend, la base de données, le CRM, le CMS, l’authentification, le SMTP ou le dashboard administrateur**.
- Ne migre pas le projet vers un nouveau framework lourd sans nécessité démontrée. Ne reconstruis pas inutilement ce qui fonctionne déjà.
- Travaille de façon autonome sur les décisions de design normales : pas besoin de demander une validation à chaque détail banal.
- Livre une première version visuelle cohérente et testée, puis attends mes retours pour les itérations suivantes. **Ne passe pas à la phase admin tant que je n’ai pas validé explicitement le site public après plusieurs cycles de modifications.**

### Hors périmètre explicite pour cette phase

Ne crée pas de route `/admin`, de connexion administrateur, de schéma de base de données, de système de rôles, de CRUD, d’API, de stockage de leads, d’upload administrateur ni d’intégration d’email serveur. Ne perds pas de temps à construire ces éléments. Ne simule pas leur existence. On y reviendra seulement après validation du design.

Le formulaire de contact/devis doit être **visuellement refondu et utilisable côté interface** : champs adaptés, validations front-end pertinentes, erreurs lisibles, état de chargement si approprié et affichage mobile irréprochable. Préserve toute intégration d’envoi qui fonctionne déjà. Si l’envoi actuel est seulement simulé, n’affiche pas de fausse confirmation laissant croire qu’une demande a réellement été envoyée ; signale simplement que le branchement serveur sera traité en phase 2. Ne développe pas ce branchement maintenant.

---

## 1. Compréhension métier et positionnement

Le site présente ETS AGBONOUGLA, une entreprise proposant des conteneurs préfabriqués/modulaires. Son cœur d’activité vise principalement les professionnels, les chantiers, les bureaux de chantier, les bases-vie, les espaces de travail, les locaux techniques et les solutions professionnelles réellement proposées par l’entreprise.

**Le produit doit être le héros du site.** Le visiteur doit rapidement comprendre les solutions disponibles, visualiser les produits dans leur contexte réel, découvrir des réalisations authentiques et savoir comment contacter l’entreprise ou demander un devis.

Le site historique peut contenir des mentions de villas, maisons, habitats ou usages résidentiels qui ne reflètent pas le positionnement communiqué. Ne les conserve pas automatiquement. Priorise les usages chantier et professionnels. N’affirme pas que l’entreprise propose un service, une catégorie, une dimension, une certification, une garantie, un délai ou une caractéristique si le projet et ses documents ne le confirment pas. Quand une information semble incertaine, garde une formulation neutre et liste-la dans le compte rendu pour validation.

Avant de modifier, examine le ZIP et identifie :
- les pages publiques existantes et leur fonction ;
- la technologie réellement utilisée ;
- les fichiers CSS/JS et composants communs ;
- les photos, logos, icônes, polices et autres assets ;
- les liens, formulaires et interactions qui marchent déjà ;
- les éléments obsolètes, incohérents ou cassés.

Ne te contente pas d’un audit : après cette inspection rapide, passe à la réalisation de la refonte.

## 2. Direction artistique : industriel, éditorial, calme et premium

Les références jointes sont des inspirations de niveau de qualité et de sens du design, pas des modèles à recopier pixel par pixel :

- **Landing page de conteneurs cinématographique** : produit grand et immédiatement visible, imagerie réaliste, profondeur, cadrage spectaculaire, grande typographie éditoriale et ambiance industrielle maîtrisée.
- **One Stock** : sobriété, hiérarchie visuelle nette, espace bien utilisé, retenue dans les effets et impression de produit conçu avec soin.
- **Palette Paper / Stone / Coral / Black** : papier `#F6F4F1`, pierre `#E4DED2`, corail `#F95C4B`, noir `#000000`.
- **Interface Pointsale** : navigation claire, icônes cohérentes et précises, espacements réguliers et absence de décoration inutile.
- **Présentation Goal / Result** : narration de projet visuelle et structurée, lorsque les informations réelles permettent de montrer le besoin, la solution et le résultat.
- **Menu de profil minimaliste** : simplicité des interactions et netteté des états, à adapter seulement aux besoins réels du site.

Construis un langage visuel qui appartient à ETS AGBONOUGLA. La palette Paper/Stone/Coral/Black est un point de départ, pas une obligation aveugle : respecte le logo et les couleurs de marque déjà établies, et marie-les avec des tons graphite, acier, bleu nuit ou orange industriel lorsque les visuels le justifient. Le corail doit rester un accent maîtrisé, pas envahir toutes les pages.

Le résultat recherché : **une identité industrielle contemporaine, mature, lucide et crédible**, avec de fortes images, une vraie composition, des détails précis et des mouvements discrets.

### Interdictions de design

- Pas de look SaaS générique appliqué artificiellement à un site industriel.
- Pas de gradients voyants, halos, glow, glassmorphism à outrance, cartes arrondies à répétition ou bordures décoratives partout.
- Pas de chiffres, badges, logos clients ou statistiques inventés pour remplir l’espace.
- Pas de curseur custom, de boutons flottants ajoutés sans raison, de widgets superflus ou d’éléments qui se déplacent juste pour impressionner.
- Pas d’emojis pour remplacer un système d’icônes professionnel.
- Pas de textes minuscules, de paragraphes génériques, de titres coupés ou d’images de maisons modernes sans rapport avec les offres.
- Pas de mouvement qui empêche la lecture, détourne du produit ou ralentit la navigation.

Chaque bloc, effet, animation et élément de navigation doit avoir une raison d’exister.

## 3. Architecture visuelle et contenu du site public

Refonds la mise en page des pages existantes plutôt que de plaquer une nouvelle maquette uniquement sur l’accueil. Préserve les pages qui ont une valeur pour l’entreprise, tout en réorganisant les sections et les priorités. Maintiens les URL utiles autant que possible.

### Accueil

1. **Hero de grande qualité** : image de conteneur/modulaire réaliste, composition forte, titre très lisible qui décrit clairement ce que fait ETS AGBONOUGLA, court sous-titre concret et CTA principal « Demander un devis ». Prévois un deuxième CTA seulement s’il a un objectif utile, comme découvrir les solutions. La photo et le produit sont au centre : pas une grande accroche abstraite qui masque le conteneur.
2. **Bento grid soignée** des principales familles de solutions : compositions asymétriques équilibrées, une ou deux images fortes, titres explicites, descriptifs courts et navigation directe. Évite une grille uniforme de petites cartes interchangeables.
3. **Usages métiers** présentés par des situations réelles : chantier, bureau temporaire, espace technique ou autres usages confirmés.
4. **Sélection de réalisations** avec des photographies suffisamment grandes et de vrais éléments descriptifs.
5. **Méthode de travail** simple, uniquement avec les étapes confirmées par l’entreprise.
6. **Bloc de réassurance** fondé sur les informations disponibles et vérifiables, suivi d’un CTA devis clair.

N’ajoute pas de chiffres inutiles. À la place, démontre la valeur par le produit, les visuels, les usages, les détails matériels confirmés et la qualité de présentation.

### Pages de solutions/produits et expertise

- Organise les catégories pour qu’elles soient immédiatement compréhensibles.
- Pour chaque solution, favorise une photo adaptée, le besoin traité, les usages, les caractéristiques confirmées et une action cohérente.
- Donne au produit une présence visuelle forte. Utilise de l’espace et une hiérarchie typographique soignée au lieu de multiplier les encadrés.
- Évite les répétitions de texte et les promesses commerciales non vérifiées.

### Réalisations

- Transforme la présentation en galerie éditoriale ou bento responsive, avec des images grandes et correctement cadrées.
- Garde les noms, lieux, dates et informations seulement s’ils sont disponibles et exacts.
- Si plusieurs types de projets existent réellement, ajoute des filtres simples et fonctionnels ; sinon, préfère une galerie éditoriale sans filtre artificiel.
- Quand le contenu le permet, structure chaque projet autour du besoin, de la solution et du résultat, sans inventer d’informations.

### Contact / demande de devis

- Refonds le formulaire et la disposition de la page : champs alignés, libellés persistants, messages d’erreur utiles, CTA visible, coordonnées cohérentes et accès téléphone/email/WhatsApp réellement cliquables si ces informations sont présentes.
- Sur mobile, le formulaire doit être simple à parcourir, avec des cibles tactiles confortables et aucun chevauchement.
- Ne change pas le périmètre technique du formulaire dans cette phase. Préserve le fonctionnement existant lorsqu’il est réel et documente les raccordements serveur à faire plus tard lorsqu’ils manquent.

### Carrières et autres pages

Garde les pages existantes qui restent utiles. Corrige leur hiérarchie, leur lisibilité, leurs espacements et leur responsive. Ne crée pas artificiellement de nouvelles rubriques ni de postes vacants fictifs.

## 4. Photos, logos et arrière-plans personnalisés

Inspecte les assets disponibles, notamment les photos `.jpg` / `.jpeg`, les logos et le favicon. Regarde le contenu réel des images plutôt que de te fier uniquement à leur nom de fichier. Si nécessaire, réalise une planche-contact locale pour choisir les meilleurs visuels.

- Vérifie les variantes du logo et leurs chemins. Conserve les bonnes proportions et privilégie le véritable logo existant plutôt qu’une imitation HTML/CSS.
- Choisis un visuel principal de grande qualité pour le hero, puis des photos qui montrent réellement les conteneurs dans des contextes de chantier, de bureau ou d’activité professionnelle.
- Construis des arrière-plans personnalisés à partir de vraies photographies, d’un recadrage travaillé, de superpositions typographiques et de CSS discret. La composition doit donner de la profondeur sans rendre le texte illisible.
- Ne remplace pas une photo produit manquante par une image sans rapport. Ne laisse pas une image distante non vérifiée comme asset critique final.
- Optimise le poids et les dimensions des images, utilise des formats modernes si cela s’intègre proprement à la stack, prévois des tailles adaptées et charge en priorité le hero.
- Si des visuels supplémentaires sont réellement nécessaires, poursuis avec les meilleurs assets existants et crée `ASSETS_A_FOURNIR.md` : précise pour chaque photo le sujet, l’emplacement, le cadrage/orientation et l’objectif. Ne bloque pas le travail en attendant de nouvelles photos.

## 5. Typographie, composants et détails d’interface

Définis une hiérarchie typographique cohérente : titres expressifs et éditoriaux, textes courants confortables, largeurs de lecture contrôlées et tailles adaptées selon les écrans. Ne rends pas tout énorme et ne réduis pas le texte pour faire tenir des mises en page trop denses.

Harmonise :
- navigation, menu mobile et pied de page ;
- boutons primaires et secondaires ;
- liens et états hover/focus ;
- formulaires, listes et éléments de réassurance ;
- galeries, catégories et fiches de projets ;
- espacements, rayons, ombres, séparateurs et alignements.

Utilise une seule famille d’icônes cohérente si les icônes existantes ne le sont pas. Leur taille, leur épaisseur, leur alignement et leur signification doivent rester constants. Évite les boîtes inutiles et les icônes orphelines.

## 6. Motion et animations au scroll

Les animations doivent renforcer la perception premium, pas constituer le sujet du site. Utilise-les avec retenue :

- apparition progressive et douce de sections lors de leur entrée dans le viewport ;
- mouvement de profondeur ou parallaxe très discret sur certaines grandes images ;
- micro-interactions nettes et rapides sur les boutons, liens, galeries et cartes de projets ;
- transitions propres entre états de navigation ou de filtres lorsque cela aide à comprendre l’action ;
- mouvement lent et maîtrisé sur le hero seulement si cela améliore vraiment la mise en scène.

Ne déclenche pas d’animation sur chaque élément. Évite les scroll-jacking, les mouvements continus lourds, les vidéos automatiques intrusives et l’ajout de dépendances volumineuses sans raison. Le contenu principal doit rester consultable si JavaScript ou l’animation échoue. Respecte `prefers-reduced-motion`, la navigation clavier et les appareils tactiles.

## 7. Responsive irréprochable

Le responsive est un objectif prioritaire : le site actuel possède des problèmes de disposition. Ne te contente pas de réduire l’échelle desktop. Recompose réellement les grilles, les titres, les marges, la navigation et les interactions sur mobile.

Teste au minimum les largeurs suivantes : **320, 360, 390, 768, 1024, 1280 et 1440 px**. Vérifie les pages clés, pas seulement l’accueil.

À corriger impérativement :
- aucun débordement horizontal ;
- aucun titre ou bouton coupé ;
- aucune image déformée ;
- pas de texte illisible superposé à une image ;
- navigation mobile simple et fonctionnelle ;
- boutons et liens faciles à toucher ;
- formulaires confortables ;
- grilles bento réorganisées intelligemment sur petit écran ;
- pas d’espace vide excessif causé par des sections dimensionnées pour desktop ;
- aucun élément fixe ou flottant qui masque le contenu.

Le menu mobile doit s’ouvrir et se fermer proprement, rester utilisable au clavier, gérer convenablement le focus et permettre de revenir au contenu sans blocage.

## 8. Performance, accessibilité et SEO de base

- Évite les sauts de mise en page, les chargements qui clignotent et les preloaders inutiles.
- Réduis le poids des images, supprime les dépendances inutilisées et garde le JavaScript proportionné aux besoins.
- Utilise un HTML sémantique, des contrastes lisibles, des états de focus visibles et des textes alternatifs pertinents.
- Préserve les fonctions existantes qui marchent. Vérifie les liens de navigation, les CTA, les ancres, les menus, les FAQ et filtres s’ils existent.
- Corrige les titres de pages et les métadonnées de base quand c’est possible dans l’architecture actuelle, sans transformer cette mission en refonte backend/SEO technique lourde.
- N’invente pas de données structurées, d’avis, de nombres, de certifications ou d’informations d’entreprise.

## 9. Signature développeur — LAMANO DESIGN

Dans le pied de page, remplace l’ancienne signature « DESIGNER LAMANO DEV » par une mention discrète et professionnelle : **« Design & développement par LAMANO DESIGN »**. Le texte **LAMANO DESIGN doit être un lien cliquable** vers le portfolio/site officiel du développeur.

Cherche d’abord une URL existante dans les fichiers du projet. Si aucune URL n’existe, ne l’invente pas : isole la cible dans une constante ou un emplacement de configuration front-end clairement nommé `LAMANO_DESIGN_URL`, avec un commentaire indiquant qu’elle doit être renseignée. Signale cette seule information manquante dans le compte rendu. Ne laisse pas un lien `#` qui remonte simplement en haut de page.

## 10. Contrôle qualité avant livraison de cette phase

Teste et corrige les problèmes détectés dans la partie publique :

1. Les pages existantes et leur navigation fonctionnent encore.
2. Les CTA pointent vers la bonne section ou destination.
3. Les menus, filtres, galeries, FAQ et interactions présents fonctionnent.
4. Les formulaires sont visuellement corrects, avec validation et erreurs côté interface ; aucune fausse confirmation d’envoi n’est affichée si aucun envoi réel n’existe.
5. Les logos, photos, polices et chemins des assets sont corrects.
6. Les largeurs responsive listées sont vérifiées et les débordements corrigés.
7. Les icônes sont visibles, correctement alignées et cohérentes.
8. Les animations restent fluides, discrètes, accessibles et non bloquantes.
9. Les erreurs visibles dans la console et les régressions évidentes sont corrigées.
10. Les anciennes informations métier inexactes ou non confirmées sont supprimées, reformulées prudemment ou listées pour validation.

Si un navigateur de test ou un outil de capture est disponible, inspecte visuellement les pages principales à plusieurs largeurs. Ne déclare pas un test réussi s’il n’a pas réellement été effectué.

## 11. Livrable et suite du projet

Pour cette phase, livre uniquement la refonte publique et ses améliorations front-end. Fournis un compte rendu court, concret et honnête :
- pages et composants visuellement refondus ;
- changements majeurs de direction artistique et d’expérience ;
- vérifications responsive et fonctionnelles effectuées ;
- éventuels éléments métier qui nécessitent confirmation ;
- photos supplémentaires recommandées dans `ASSETS_A_FOURNIR.md` si nécessaire ;
- URL à renseigner pour le lien LAMANO DESIGN, si elle n’a pas été trouvée ;
- limitations connues des formulaires existants, notamment tout envoi qui dépendra du futur serveur.

Tu peux créer une petite note `PHASE_2_ADMIN_CRM_CMS.md` uniquement si cela est utile pour mémoriser les prérequis et les fonctions envisagées plus tard. Cette note doit rester un document de cadrage, **pas du code fonctionnel**. Aucun développement de phase 2 ne doit commencer avant ma validation explicite.

### Ordre de priorité absolu

1. **ADN visuel, direction artistique et qualité générale du design.**
2. Hero, photographie, hiérarchie typographique, dispositions et bento grids qui mettent réellement les produits en valeur.
3. Responsive de toutes les pages et cohérence des composants.
4. Animations au scroll, motion et micro-interactions utiles.
5. Corrections front-end, accessibilité, performance et vérifications.
6. Documentation minimale des éléments à fournir et de la future phase serveur/admin.

**Ne développe pas le CRM/CMS aujourd’hui. La priorité est de parvenir à un site public dont le design est validé après plusieurs itérations. Ce n’est qu’ensuite que nous passerons à l’administration et au backend.**
