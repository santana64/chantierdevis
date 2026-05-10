# ChantierDevis

ChantierDevis est une application SaaS BTP pour artisans, micro-entrepreneurs et petites entreprises du bâtiment. Elle permet de créer des devis professionnels, calculer les marges, gérer la TVA, générer des documents imprimables/PDF, envoyer les devis, suivre les statuts, convertir les devis acceptés en factures et gérer les données de compte.

## Stack

- Next.js App Router + TypeScript strict
- Tailwind CSS
- Prisma ORM + PostgreSQL
- Zod + Server Actions
- Auth maison par session HTTP-only et mot de passe hashé `scrypt`
- Rate limiting d'authentification persisté en base
- Vérification email par lien à usage unique
- Récupération de mot de passe par lien email à usage unique
- Stripe Checkout, Billing Portal et Webhook
- Email transactionnel via Resend, avec mode dégradé explicite si non configuré
- PDF via `pdf-lib`
- Vitest pour la logique métier

## Prérequis

- Node.js 20+
- npm
- Docker Desktop pour PostgreSQL local

## Installation locale rapide

```bash
npm install
cp .env.example .env
docker compose up -d
npm run db:push
npm run db:seed
npm run dev -- --hostname 127.0.0.1 --port 3001
```

Application : http://127.0.0.1:3001

Compte de démonstration seedé :

- Email : `demo@chantierdevis.fr`
- Mot de passe : `Demo-chantier-2026!`

## Installation sur base fraîche avec migrations

Procédure à utiliser pour vérifier une base propre avant bêta :

```bash
docker compose down -v
docker compose up -d
npm run db:migrate
npm run db:seed
npm run typecheck
npm run test
npm run build
npm run lint
```

`npm run db:push` reste pratique pour le développement local, mais `npm run db:migrate` est la procédure cible pour staging/production.

## Variables d'environnement

Variables obligatoires :

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `APP_URL`

Stripe sandbox/production :

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_SOLO`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_BUSINESS`

Email :

- `EMAIL_PROVIDER="resend"`
- `RESEND_API_KEY`
- `EMAIL_FROM`

Sans Stripe configuré, les écrans de facturation restent accessibles et affichent une erreur claire au lieu de planter. Sans Resend configuré, les emails sont enregistrés comme `SKIPPED` et l'utilisateur voit un retour honnête.

## Stripe Sandbox

1. Créer trois produits/prix mensuels récurrents dans Stripe :
   - Solo : 19 EUR/mois
   - Pro : 29 EUR/mois
   - Entreprise artisanale : 49 EUR/mois
2. Copier les price IDs dans :
   - `STRIPE_PRICE_SOLO`
   - `STRIPE_PRICE_PRO`
   - `STRIPE_PRICE_BUSINESS`
3. Renseigner `STRIPE_SECRET_KEY` avec une clé test `sk_test_...`.
4. Lancer le webhook local :

```bash
stripe listen --forward-to http://127.0.0.1:3001/api/stripe/webhook
```

5. Copier le secret `whsec_...` dans `STRIPE_WEBHOOK_SECRET`.
6. Démarrer l'app et tester `/app/billing`.

Événements gérés :

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.payment_succeeded`

Effet attendu :

- Checkout crée ou rattache le customer Stripe.
- Le webhook met à jour `plan`, `subscriptionStatus`, `stripeCustomerId`, `stripeSubscriptionId`.
- Les paiements échoués passent l'abonnement en `PAST_DUE`; les paiements réussis repassent le statut en `ACTIVE`.
- Les limites clients/devis/ouvrages sont recalculées côté serveur à partir du plan.
- L'annulation depuis l'offre Gratuit annule l'abonnement Stripe actif quand `stripeSubscriptionId` est présent.
- Une signature webhook invalide retourne `400`.

## Email Resend

1. Vérifier le domaine d'envoi dans Resend.
2. Renseigner :
   - `EMAIL_PROVIDER="resend"`
   - `RESEND_API_KEY`
   - `EMAIL_FROM="ChantierDevis <devis@votre-domaine.fr>"`
3. Tester :
   - inscription : email de vérification
   - `/forgot-password` : email de reset
   - détail devis : envoi du devis PDF au client

Le HTML des messages utilisateur est échappé avant envoi. Si `RESEND_API_KEY` manque, l'action ne simule pas un succès : elle enregistre `SKIPPED`.

## Commandes

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:seed
```

## Base de données

Le schéma Prisma couvre :

- utilisateurs, sessions et abonnements
- tokens de vérification email et réinitialisation mot de passe
- limites de tentatives auth
- profil entreprise
- clients
- bibliothèque d'ouvrages
- devis, lignes, événements, relances et documents générés
- factures et lignes de facture
- emails transactionnels
- demandes RGPD et audit logs

## Pages principales

- `/` : landing page
- `/login`, `/register` : authentification
- `/forgot-password`, `/reset-password`, `/verify-email` : sécurité compte
- `/app` : tableau de bord
- `/app/quotes` : devis
- `/app/quotes/new` : création de devis
- `/app/clients` : clients
- `/app/items` : bibliothèque d'ouvrages
- `/app/invoices` : factures
- `/app/settings` : entreprise
- `/app/billing` : abonnement
- `/app/data` : export et suppression RGPD
- `/legal/mentions-legales`, `/legal/confidentialite`, `/legal/cgv`, `/legal/rgpd`

## Limites connues

- L'authentification contient sessions HTTP-only, hash `scrypt`, rate limiting, vérification email et reset password. La 2FA n'est pas incluse.
- Stripe et Resend doivent être validés avec de vraies clés sandbox avant ouverture bêta.
- Les pages légales sont des bases opérationnelles à faire valider par un professionnel du droit.
- Le module facture couvre la conversion et l'impression, pas encore le paiement, l'avoir ou la numérotation réglementaire avancée.
