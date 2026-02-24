"use server";

import { getUserSubscriptionById } from "@/data/subscription-queries";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";

const returnUrl = absoluteUrl("/suscripcion"); // URL de retorno

export async function createStripeUrl(subscriptionTypeId: string) {
  try {
    // Obtiene el usuario actual
    const user = await currentUser();

    if (!user || !user.id || !user.email) {
      throw new Error("No tienes autorización");
    }

    // Verifica que el tipo de suscripción exista
    const subscriptionType = await db.subscriptionType.findUnique({
      where: { id: subscriptionTypeId },
    });

    if (!subscriptionType) {
      throw new Error("Tipo de suscripción no encontrado");
    }

    // Si ya tiene una suscripción activa, manda al portal de Stripe
    const existingSubscription = await getUserSubscriptionById(user.id);

    if (existingSubscription?.isActive) {
      // Si ya tiene una suscripción activa, crea una sesión para el Customer Portal
      const stripeCustomer = await db.stripeCustomer.findUnique({
        where: { userId: user.id },
      });

      if (!stripeCustomer) {
        throw new Error("Cliente de Stripe no encontrado");
      }

      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomer.stripeCustomerId,
        return_url: returnUrl,
      });

      return stripeSession.url; // Retorna la URL del Customer Portal
    }

    // Crea o recupera el cliente de Stripe
    let stripeCustomer = await db.stripeCustomer.findUnique({
      where: { userId: user.id },
    });

    if (!stripeCustomer) {
      const customer = await stripe.customers.create({
        email: user.email,
      });

      stripeCustomer = await db.stripeCustomer.create({
        data: {
          userId: user.id,
          stripeCustomerId: customer.id,
        },
      });
    }

    // Crea una nueva sesión de Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "USD",
            product_data: {
              name: subscriptionType.name,
              description: subscriptionType.description || "Suscripción",
            },
            recurring: {
              // Stripe soporta day|week|month|year. Nosotros usaremos "day" (BASICS) y "month" (PRO).
              interval: subscriptionType.period as "day" | "month" | "year",
            },
            unit_amount: subscriptionType.price,
          },
        },
      ],
      success_url: `${returnUrl}?success=1`,
      cancel_url: `${returnUrl}?canceled=1`,
      metadata: {
        subscriptionTypeId: subscriptionType.id,
        userId: user.id,
      },
    });

    return session.url; // Retorna la URL de Stripe Checkout
  } catch (error) {
    console.error("[CREATE_STRIPE_URL_ERROR]", error);
    throw new Error("Error interno"); // Lanza un error manejable por el endpoint
  }
}