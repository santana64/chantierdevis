# ChantierDevis - SaaS de Devis pour Artisans du Batiment

Generez des devis professionnels en quelques clics. L'IA analyse le chantier et propose une estimation detaillee. Paiement en ligne, signature electronique.

## Stack

- Next.js 14 (App Router)
- PostgreSQL + Prisma
- Stripe (abonnements + paiements)
- Claude API / Anthropic (generation de devis IA)
- pdf-lib (PDF personnalise)
- Tailwind CSS + Zod

## Fonctionnalites

- Generation de devis par IA depuis une description texte du chantier
- Catalogue de prestations personnalisable par corps de metier
- PDF professionnel avec logo, CGV, signature
- Suivi statut devis : brouillon, envoye, accepte, refuse
- Paiement d acompte en ligne via Stripe
- Tableau de bord : CA, taux de conversion, devis en attente
- Analytics Vercel integrees

## Demarrage

bash
npm install
npx prisma migrate dev
npm run dev


Variables requises : DATABASE_URL, STRIPE_SECRET_KEY, ANTHROPIC_API_KEY