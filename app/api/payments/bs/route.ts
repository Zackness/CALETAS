import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payments = await db.manualPayment.findMany({
      where: { userId: session.user.id },
      include: {
        subscriptionType: {
          select: { id: true, name: true, period: true, price: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Error listing Bs payments:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = (await request.json()) as {
      subscriptionTypeId?: string;
      amountBs?: number;
      reference?: string;
      proofUrl?: string;
    };

    if (!body.subscriptionTypeId || !body.amountBs || !body.reference) {
      return NextResponse.json(
        { error: "Faltan datos: plan, monto en Bs y referencia" },
        { status: 400 },
      );
    }

    const type = await db.subscriptionType.findUnique({
      where: { id: body.subscriptionTypeId },
      select: { id: true },
    });
    if (!type) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    const payment = await db.manualPayment.create({
      data: {
        userId: session.user.id,
        subscriptionTypeId: body.subscriptionTypeId,
        amountBs: Math.max(1, Math.floor(body.amountBs)),
        reference: body.reference.trim(),
        proofUrl: body.proofUrl?.trim() || null,
      },
      include: {
        subscriptionType: {
          select: { id: true, name: true, period: true, price: true },
        },
      },
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error("Error creating Bs payment:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

