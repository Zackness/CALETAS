import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const [stripeCustomer, manualPayments] = await Promise.all([
      db.stripeCustomer.findUnique({
        where: { userId: session.user.id },
        select: { stripeCustomerId: true },
      }),
      db.manualPayment.findMany({
        where: { userId: session.user.id },
        include: {
          subscriptionType: { select: { id: true, name: true, period: true, price: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    let stripeInvoices: any[] = [];
    if (stripeCustomer?.stripeCustomerId) {
      const invoices = await stripe.invoices.list({
        customer: stripeCustomer.stripeCustomerId,
        limit: 50,
      });

      stripeInvoices = invoices.data.map((inv) => ({
        id: inv.id,
        created: inv.created,
        status: inv.status,
        currency: inv.currency,
        amountPaid: inv.amount_paid,
        amountDue: inv.amount_due,
        hostedInvoiceUrl: inv.hosted_invoice_url,
        invoicePdf: inv.invoice_pdf,
        subscription: typeof inv.subscription === "string" ? inv.subscription : null,
        periodStart: inv.period_start,
        periodEnd: inv.period_end,
      }));
    }

    return NextResponse.json({
      stripe: {
        hasCustomer: !!stripeCustomer?.stripeCustomerId,
        invoices: stripeInvoices,
      },
      bs: {
        payments: manualPayments.map((p) => ({
          id: p.id,
          createdAt: p.createdAt,
          status: p.status,
          amountBs: p.amountBs,
          reference: p.reference,
          proofUrl: p.proofUrl,
          plan: p.subscriptionType,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching subscription history:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

