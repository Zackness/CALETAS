import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    const body = await req.text();
    const signature = headers().get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error(`Webhook Error: ${error.message}`);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session?.metadata?.userId;
        const courseId = session?.metadata?.courseId;
        const subscriptionTypeId = session?.metadata?.subscriptionTypeId;

        if (courseId) {
            if (!userId || !courseId) {
                return new NextResponse(`Webhook Error: Metadata perdida`, { status: 400 });
            }

            await db.purchaseCourse.create({
                data: {
                    courseId: courseId,
                    userId: userId,
                },
            });
        } else if (subscriptionTypeId) {
            if (!userId || !subscriptionTypeId) {
                return new NextResponse(`Webhook Error: Metadata perdida`, { status: 400 });
            }

            const subscription = await stripe.subscriptions.retrieve(
                session.subscription as string
            );

            // Verificar si la suscripción ya existe
            const existingSubscription = await db.userSubscription.findUnique({
                where: { stripeSubscriptionId: session.subscription as string },
            });

            if (existingSubscription) {
                // Actualizar la suscripción existente
                await db.userSubscription.update({
                    where: { stripeSubscriptionId: session.subscription as string },
                    data: {
                        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                    },
                });
            } else {
                // Crear una nueva suscripción
                await db.userSubscription.create({
                    data: {
                        userId: userId,
                        stripeCustomerId: session.customer as string,
                        stripeSubscriptionId: session.subscription as string,
                        stripePriceId: subscription.items.data[0].price.id,
                        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                        subscriptionTypeId: subscriptionTypeId,
                    },
                });
            }
        } else {
            return new NextResponse(`Webhook Error: Metadata perdida`, { status: 400 });
        }
    } else if (event.type === "invoice.payment_succeeded") {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);

            // Verificar si la suscripción ya existe
            const existingSubscription = await db.userSubscription.findUnique({
                where: { stripeSubscriptionId: subscriptionId },
            });

            if (existingSubscription) {
                // Actualizar la suscripción existente
                await db.userSubscription.update({
                    where: { stripeSubscriptionId: subscriptionId },
                    data: {
                        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                    },
                });
            } else {
                console.error(`Webhook Error: La suscripción no existe en la base de datos`);
                return new NextResponse(`Webhook Error: Suscripción no encontrada`, { status: 400 });
            }
        } catch (error: any) {
            console.error(`Webhook Error: ${error.message}`);
            return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
        }
    } else {
        return new NextResponse(`Webhook Error: Tipo de evento no controlado ${event.type}`, { status: 200 });
    }

    return new NextResponse("Evento procesado", { status: 200 });
}