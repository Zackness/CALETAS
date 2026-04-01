import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { deleteFromBunny, listBunnyFiles, uploadToBunny } from "@/lib/bunny";
import { db } from "@/lib/db";

async function requireAdmin(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session?.user?.id) return { ok: false as const, status: 401 as const };
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { ok: false as const, status: 403 as const };
  return { ok: true as const };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) return NextResponse.json({ error: "No autorizado" }, { status: admin.status });

    const { searchParams } = new URL(request.url);
    const subfolder = searchParams.get("subfolder") || "";
    const folderToList = ["caleta", subfolder].filter(Boolean).join("/");
    const files = await listBunnyFiles(folderToList);
    return NextResponse.json({ files });
  } catch (error) {
    console.error("Error listing media files:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) return NextResponse.json({ error: "No autorizado" }, { status: admin.status });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const subfolder = (formData.get("subfolder") as string) || "";
    if (!file) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    }

    const fileUrl = await uploadToBunny(file, {
      prefix: "caleta",
      subfolder,
    });

    return NextResponse.json({ fileUrl }, { status: 201 });
  } catch (error) {
    console.error("Error uploading media file:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) return NextResponse.json({ error: "No autorizado" }, { status: admin.status });

    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("fileUrl");
    if (!fileUrl) return NextResponse.json({ error: "fileUrl requerido" }, { status: 400 });

    const deleted = await deleteFromBunny(fileUrl);
    if (!deleted) return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting media file:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
