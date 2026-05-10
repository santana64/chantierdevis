import type { SubscriptionPlan } from "@prisma/client";

export type PlanLimitKey = "clients" | "quotes" | "workItems";

export const PLAN_LIMITS: Record<
  SubscriptionPlan,
  {
    label: string;
    price: string;
    stripePriceEnv?: string;
    clients: number | null;
    quotes: number | null;
    workItems: number | null;
    features: string[];
  }
> = {
  FREE: {
    label: "Gratuit",
    price: "0 €",
    clients: 1,
    quotes: 1,
    workItems: 5,
    features: ["1 client", "1 devis", "aperçu uniquement", "bibliothèque limitée"],
  },
  SOLO: {
    label: "Solo",
    price: "19 €/mois",
    stripePriceEnv: "STRIPE_PRICE_SOLO",
    clients: 20,
    quotes: null,
    workItems: null,
    features: ["devis illimités", "20 clients", "ouvrages réutilisables", "export PDF/print", "relance simple"],
  },
  PRO: {
    label: "Pro",
    price: "29 €/mois",
    stripePriceEnv: "STRIPE_PRICE_PRO",
    clients: null,
    quotes: null,
    workItems: null,
    features: ["clients illimités", "ouvrages illimités", "marges", "checklist conformité", "relances"],
  },
  BUSINESS: {
    label: "Entreprise artisanale",
    price: "49 €/mois",
    stripePriceEnv: "STRIPE_PRICE_BUSINESS",
    clients: null,
    quotes: null,
    workItems: null,
    features: ["structure multi-métiers", "réglages document avancés", "support prioritaire", "modèles multi-métiers"],
  },
};

export function getPlanLimit(plan: SubscriptionPlan, key: PlanLimitKey) {
  return PLAN_LIMITS[plan][key];
}

export function isWithinLimit(current: number, limit: number | null) {
  return limit === null || current < limit;
}

export function getStripePriceId(plan: SubscriptionPlan) {
  const envName = PLAN_LIMITS[plan].stripePriceEnv;
  return envName ? process.env[envName] : undefined;
}
