import { NextResponse } from "next/server";
import type { SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStripe, planFromStripePrice, subscriptionStatusFromStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

type StripeSubscriptionPayload = {
  id: string;
  customer?: string;
  status?: string;
  current_period_end?: number;
  metadata?: Record<string, string>;
  items?: { data?: Array<{ price?: { id?: string } }> };
};

type StripeCheckoutSessionPayload = {
  customer?: string;
  subscription?: string;
  metadata?: Record<string, string>;
};

type StripeInvoicePayload = {
  customer?: string;
  subscription?: string;
  period_end?: number;
  lines?: { data?: Array<{ subscription?: string }> };
};

function planFromMetadata(value?: string | null): SubscriptionPlan {
  if (value === "SOLO" || value === "PRO" || value === "BUSINESS") return value;
  return "FREE";
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 400 });
  }

  const payload = await request.text();
  let event;

  try {
    event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as StripeCheckoutSessionPayload;
    const userId = session.metadata?.userId;
    const plan = planFromMetadata(session.metadata?.plan);

    if (userId) {
      await prisma.user.updateMany({
        where: { id: userId },
        data: {
          plan,
          subscriptionStatus: "ACTIVE",
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
        },
      });
    }
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as StripeSubscriptionPayload;
    const priceId = subscription.items?.data?.[0]?.price?.id;
    const userId = subscription.metadata?.userId;
    const plan = event.type === "customer.subscription.deleted" ? "FREE" : planFromStripePrice(priceId);
    const status =
      event.type === "customer.subscription.deleted"
        ? "CANCELED"
        : subscriptionStatusFromStripe(subscription.status);

    await prisma.user.updateMany({
      where: userId
        ? { id: userId }
        : {
            OR: [
              { stripeCustomerId: subscription.customer },
              { stripeSubscriptionId: subscription.id },
            ],
          },
      data: {
        plan,
        subscriptionStatus: status,
        stripeCustomerId: subscription.customer,
        stripeSubscriptionId: subscription.id,
        subscriptionCurrentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null,
      },
    });
  }

  if (event.type === "invoice.payment_failed" || event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as StripeInvoicePayload;
    const subscriptionId = invoice.subscription ?? invoice.lines?.data?.find((line) => line.subscription)?.subscription;
    const customerId = invoice.customer;
    const where: Array<{ stripeCustomerId?: string; stripeSubscriptionId?: string }> = [];

    if (customerId) where.push({ stripeCustomerId: customerId });
    if (subscriptionId) where.push({ stripeSubscriptionId: subscriptionId });

    if (where.length > 0) {
      await prisma.user.updateMany({
        where: { OR: where },
        data: {
          subscriptionStatus: event.type === "invoice.payment_failed" ? "PAST_DUE" : "ACTIVE",
          subscriptionCurrentPeriodEnd: invoice.period_end
            ? new Date(invoice.period_end * 1000)
            : undefined,
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
