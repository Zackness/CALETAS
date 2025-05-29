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
    const cedula = searchParams.get("cedula");

    if (!cedula) {
      return new NextResponse("Cédula is required", { status: 400 });
    }

    // Check if cedula exists in users table
    const existingUser = await db.user.findFirst({
      where: {
        cedula: cedula,
      },
    });

    // Check if cedula exists in familiares table
    const existingFamiliar = await db.familiar.findFirst({
      where: {
        cedula: cedula,
      },
    });

    return NextResponse.json({
      exists: !!(existingUser || existingFamiliar),
    });
  } catch (error) {
    console.error("[CHECK_CEDULA]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 