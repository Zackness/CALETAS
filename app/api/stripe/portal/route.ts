import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const stripeCustomer = await db.stripeCustomer.findUnique({
      where: { userId: session.user.id },
      select: { stripeCustomerId: true },
    });

    if (!stripeCustomer?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No tienes un cliente de Stripe asociado" },
        { status: 404 },
      );
    }

    const returnUrl = absoluteUrl("/suscripcion");
    const portal = await stripe.billingPortal.sessions.create({
      customer: stripeCustomer.stripeCustomerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error("Error creating Stripe portal session:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

