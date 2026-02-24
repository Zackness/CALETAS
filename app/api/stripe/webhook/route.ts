import { NextRequest, NextResponse } from "next/server";
import type StripeType from "stripe";

import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const getSubscriptionData = async (subscriptionId: string) => {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price?.id || null;
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null;
  return { subscription, priceId, currentPeriodEnd };
};

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET no configurado" }, { status: 500 });
    }

    const rawBody = await req.text();
    let event: StripeType.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      return NextResponse.json({ error: `Webhook signature verification failed` }, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as StripeType.Checkout.Session;
        const userId = session.metadata?.userId;
        const subscriptionTypeId = session.metadata?.subscriptionTypeId || null;
        const customerId = typeof session.customer === "string" ? session.customer : null;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : null;

        if (!userId || !customerId || !subscriptionId) break;

        const { priceId, currentPeriodEnd } = await getSubscriptionData(subscriptionId);

        await db.stripeCustomer.upsert({
          where: { userId },
          create: { userId, stripeCustomerId: customerId },
          update: { stripeCustomerId: customerId },
        });

        const existingSub = await db.userSubscription.findFirst({
          where: { userId },
          select: { id: true },
        });

        if (existingSub?.id) {
          await db.userSubscription.update({
            where: { id: existingSub.id },
            data: {
              subscriptionTypeId: subscriptionTypeId || undefined,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: priceId || undefined,
              stripeCurrentPeriodEnd: currentPeriodEnd || undefined,
            },
          });
        } else {
          await db.userSubscription.create({
            data: {
              userId,
              subscriptionTypeId: subscriptionTypeId || undefined,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: priceId || undefined,
              stripeCurrentPeriodEnd: currentPeriodEnd || undefined,
            },
          });
        }

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as StripeType.Subscription;
        const subscriptionId = subscription.id;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
        if (!customerId) break;

        const currentPeriodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null;
        const priceId = subscription.items.data[0]?.price?.id || null;

        const existing = await db.userSubscription.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
          select: { id: true },
        });
        if (!existing?.id) break;

        await db.userSubscription.update({
          where: { id: existing.id },
          data: {
            stripeCustomerId: customerId,
            stripePriceId: priceId || undefined,
            stripeCurrentPeriodEnd:
              event.type === "customer.subscription.deleted"
                ? null
                : currentPeriodEnd || undefined,
          },
        });

        break;
      }

      case "invoice.payment_succeeded": {
        // Renovaciones: mantener periodo actualizado
        const invoice = event.data.object as StripeType.Invoice;
        const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : null;
        if (!subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const currentPeriodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000)
          : null;
        const priceId = sub.items.data[0]?.price?.id || null;

        const existing = await db.userSubscription.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
          select: { id: true },
        });
        if (!existing?.id) break;

        await db.userSubscription.update({
          where: { id: existing.id },
          data: {
            stripePriceId: priceId || undefined,
            stripeCurrentPeriodEnd: currentPeriodEnd || undefined,
          },
        });

        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}

