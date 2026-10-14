# ETS AGBONOUGLA — Cadrage Prévisionnel Phase 2 (Serveur, CRM & CMS)

> **RAPPEL IMPORTANT :** Ce document est une note d'architecture et de prérequis. Aucun développement backend, serveur, authentification ou base de données ne doit démarrer avant la validation explicite et complète de la refonte visuelle du site public par le client.

---

## 1. Objectifs de la Phase 2

1. **Raccordement serveur du formulaire de devis :**
   - Réception et enregistrement en base de données de chaque demande avec horodatage, statut et pièces jointes éventuelles (plans de chantier, cahier des charges).
   - Envoi de notifications email automatiques sécurisées (client + équipe commerciale ETS AGBONOUGLA via SMTP authentifié).
   - Validation stricte côté serveur, protection anti-spam (reCAPTCHA v3 ou Turnstile sans friction, limitation de débit / rate limiting).

2. **Mini-CRM commercial (Gestion des demandes) :**
   - Tableau de bord interne pour visualiser, trier et changer le statut des leads : *Nouveau*, *Étude en cours*, *Devis envoyé*, *En négociation*, *Validé / En production*, *Livré*.
   - Export CSV / PDF des demandes pour transmission à l'atelier d'Attinguié.
   - Suivi des relances et historique des échanges avec le prospect.

3. **Gestionnaire de contenu léger (CMS pour réalisations & offres) :**
   - Ajout et modification des projets réalisés (upload de photos réelles, localisation, description technique).
   - Mise à jour des offres d'emploi et des fiches techniques des conteneurs.
   - Gestion des accès administrateur avec authentification forte (sessions chiffrées, hachage bcrypt/argon2, pas de clés publiques dans le code front-end).

---

## 2. Prérequis Techniques Recommandés

- **Environnement d'exécution :** Node.js LTS ou PHP 8.2+ selon la compatibilité de l'hébergeur LWS (Pack cPanel / VPS).
- **Base de données :** PostgreSQL ou MySQL avec schéma relationnel normalisé pour les tables `prospects`, `projets`, `utilisateurs_admin` et `historique_actions`.
- **Certificat TLS / HTTPS :** Activation obligatoire du certificat Let's Encrypt sur le domaine `etsagbonougla.net` et redirection permanente 301 HTTP -> HTTPS au niveau du serveur web (Apache `.htaccess` ou Nginx).
- **En-têtes de sécurité HTTP :** Configuration de `Content-Security-Policy`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **Politique de confidentialité & purge :** Définir une durée légale de rétention des demandes de contact (ex. 12 à 24 mois) avec suppression automatisée des données obsolètes.
