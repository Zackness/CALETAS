import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const types = await db.subscriptionType.findMany({
      orderBy: [{ price: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        period: true,
      },
    });

    return NextResponse.json({ types });
  } catch (error) {
    console.error("Error fetching subscription types:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

