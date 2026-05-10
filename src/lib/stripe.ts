import "server-only";

import Stripe from "stripe";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { getStripePriceId } from "@/domain/billing/plans";

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(secretKey);
}

export function getAppUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (!url) throw new Error("APP_URL is not configured");
  return url;
}

export function getStripeSetupIssues() {
  const issues: string[] = [];
  if (!process.env.STRIPE_SECRET_KEY) issues.push("STRIPE_SECRET_KEY manquant");
  if (!process.env.STRIPE_WEBHOOK_SECRET) issues.push("STRIPE_WEBHOOK_SECRET manquant");
  for (const plan of ["SOLO", "PRO", "BUSINESS"] as SubscriptionPlan[]) {
    if (!getStripePriceId(plan)) issues.push(`${plan} sans prix Stripe`);
  }
  return issues;
}

export function planFromStripePrice(priceId?: string | null): SubscriptionPlan {
  const entries: SubscriptionPlan[] = ["SOLO", "PRO", "BUSINESS"];
  return entries.find((plan) => getStripePriceId(plan) === priceId) ?? "FREE";
}

export function subscriptionStatusFromStripe(status?: string | null): SubscriptionStatus {
  if (status === "trialing") return "TRIALING";
  if (status === "active") return "ACTIVE";
  if (status === "past_due" || status === "unpaid") return "PAST_DUE";
  if (status === "canceled" || status === "incomplete_expired") return "CANCELED";
  return "INACTIVE";
}
