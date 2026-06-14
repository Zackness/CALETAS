import { NextResponse } from "next/server";
import { createStripeUrl } from "@/actions/user-subsccription";

export async function POST(req: Request) {
  try {
    const { subscriptionTypeId } = await req.json();

    if (!subscriptionTypeId) {
      return NextResponse.json(
        { message: "Falta el ID de tipo de suscripción" },
        { status: 400 }
      );
    }

    const url = await createStripeUrl(subscriptionTypeId);

    return NextResponse.json({ url }, { status: 200 });
  } catch (error: any) {
    const msg = typeof error?.message === "string" ? error.message : "Error interno del servidor";
    console.error("[CREATE_STRIPE_URL_ERROR]", msg);
    if (msg.startsWith("WALLET_ONLY_PLAN:")) {
      return NextResponse.json(
        { message: msg.replace(/^WALLET_ONLY_PLAN:\s*/, "").trim(), code: "WALLET_ONLY_PLAN" },
        { status: 400 },
      );
    }
    return NextResponse.json({ message: msg || "Error interno del servidor" }, { status: 500 });
  }
}