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
    console.error("[CREATE_STRIPE_URL_ERROR]", error.message);
    return NextResponse.json(
      { message: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}