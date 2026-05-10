# Déploiement ChantierDevis

## Variables d'environnement

Obligatoires :

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `APP_URL`

Paiement Stripe :

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_SOLO`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_BUSINESS`

Email transactionnel :

- `EMAIL_PROVIDER` (`resend`)
- `RESEND_API_KEY`
- `EMAIL_FROM`

## Commandes

```bash
npm install
npx prisma migrate deploy
npm run db:seed
npm run typecheck
npm run test
npm run lint
npm run build
npm run start
```

## Stripe

Créer trois prix récurrents mensuels dans Stripe puis renseigner les IDs dans :

- `STRIPE_PRICE_SOLO`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_BUSINESS`

Configurer le webhook :

```text
POST https://votre-domaine.com/api/stripe/webhook
```

Événements à écouter :

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.payment_succeeded`

Annulation : le bouton "Annuler et passer en Gratuit" annule l'abonnement Stripe actif si `stripeSubscriptionId` est présent, puis remet le compte en offre `FREE`.

## Sécurité

- Les sessions sont stockées en base via token hashé et cookie HTTP-only.
- Les mots de passe sont hashés avec `scrypt`.
- Les tentatives sensibles d'authentification sont limitées via `AuthRateLimit`.
- La récupération de mot de passe utilise des tokens hashés, expirables et à usage unique.
- La vérification email utilise des tokens hashés, expirables et à usage unique.
- Les routes `/app/*` sont protégées par middleware et revérifiées côté serveur.
- Les actions serveur valident l'utilisateur et scopent toutes les requêtes par `userId`.
- Les headers de sécurité sont configurés dans `next.config.ts`.
- Les secrets ne doivent jamais être commités.

## RGPD

L'utilisateur peut :

- exporter ses données depuis `/app/data`
- supprimer son compte depuis `/app/data`

Les pages légales sont disponibles dans `/legal/*`.
