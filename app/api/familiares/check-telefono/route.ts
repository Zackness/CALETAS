import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const telefono = searchParams.get("telefono");

    if (!telefono) {
      return new NextResponse("Teléfono is required", { status: 400 });
    }

    // Check if telefono exists in users table
    const existingUser = await db.user.findFirst({
      where: {
        telefono: telefono,
      },
    });

    // Check if telefono exists in familiares table
    const existingFamiliar = await db.familiar.findFirst({
      where: {
        telefono: telefono,
      },
    });

    return NextResponse.json({
      exists: !!(existingUser || existingFamiliar),
    });
  } catch (error) {
    console.error("[CHECK_TELEFONO]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 