"use server";

import type { SubscriptionPlan } from "@prisma/client";
import { redirect } from "next/navigation";
import { PLAN_LIMITS, getStripePriceId } from "@/domain/billing/plans";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppUrl, getStripe } from "@/lib/stripe";
import { stringFromForm } from "@/lib/utils";

const paidPlans: SubscriptionPlan[] = ["SOLO", "PRO", "BUSINESS"];

export async function createCheckoutSessionAction(formData: FormData) {
  const user = await getCurrentUser();
  const plan = stringFromForm(formData.get("plan")) as SubscriptionPlan;
  if (!paidPlans.includes(plan)) redirect("/app/billing?error=plan");

  const priceId = getStripePriceId(plan);
  if (!priceId) redirect("/app/billing?error=stripe-config");
  if (!process.env.STRIPE_SECRET_KEY) redirect("/app/billing?error=stripe-config");

  const stripe = getStripe();
  const appUrl = getAppUrl();
  let stripeCustomerId = user.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });
    stripeCustomerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/app/billing?checkout=success`,
    cancel_url: `${appUrl}/app/billing?checkout=cancelled`,
    metadata: { userId: user.id, plan },
    subscription_data: { metadata: { userId: user.id, plan } },
    allow_promotion_codes: true,
  });

  if (!session.url) redirect("/app/billing?error=stripe-session");
  redirect(session.url);
}

export async function createBillingPortalSessionAction() {
  const user = await getCurrentUser();
  if (!user.stripeCustomerId) redirect("/app/billing?error=no-customer");
  if (!process.env.STRIPE_SECRET_KEY) redirect("/app/billing?error=stripe-config");

  const session = await getStripe().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${getAppUrl()}/app/billing`,
  });

  redirect(session.url);
}

export async function switchToFreePlanAction() {
  const user = await getCurrentUser();
  if (user.stripeSubscriptionId) {
    if (!process.env.STRIPE_SECRET_KEY) redirect("/app/billing?error=stripe-config");
    await getStripe().subscriptions.cancel(user.stripeSubscriptionId);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: "FREE",
      subscriptionStatus: "INACTIVE",
      stripeSubscriptionId: null,
      subscriptionCurrentPeriodEnd: null,
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "billing.switch_free",
      resource: "subscription",
      metadata: { plan: PLAN_LIMITS.FREE.label },
    },
  });
  redirect("/app/billing?updated=1");
}
