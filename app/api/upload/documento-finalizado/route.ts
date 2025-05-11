import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // Verificar que el usuario sea ADMIN o ABOGADO
    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        role: true,
      },
    });

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.ABOGADO)) {
      return new NextResponse("No autorizado", { status: 403 });
    }

    // Obtener el FormData de la solicitud
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const solicitudId = formData.get("solicitudId") as string;

    if (!file || !solicitudId) {
      return new NextResponse("Archivo y ID de solicitud son requeridos", { status: 400 });
    }

    // Verificar que el archivo sea un PDF
    if (file.type !== "application/pdf") {
      return new NextResponse("Solo se permiten archivos PDF", { status: 400 });
    }

    // Generar un nombre único para el archivo
    const fileName = `${uuidv4()}.pdf`;
    
    // Convertir el archivo a un buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Subir el archivo a Bunny.net
    const bunnyResponse = await axios.put(
      `${process.env.BUNNY_STORAGE_URL}/${process.env.BUNNY_STORAGE_ZONE}/${fileName}`,
      buffer,
      {
        headers: {
          "AccessKey": process.env.BUNNY_STORAGE_API_KEY || "",
          "Content-Type": "application/pdf",
        },
      }
    );

    if (bunnyResponse.status !== 201) {
      return new NextResponse("Error al subir el archivo a Bunny.net", { status: 500 });
    }

    // Construir la URL del archivo
    const fileUrl = `${process.env.BUNNY_STORAGE_PUBLIC_URL}/${fileName}`;

    // Actualizar el detalle con la URL del documento finalizado
    await db.detalle.update({
      where: {
        solicitudId: parseInt(solicitudId),
      },
      data: {
        solicitud_finalizada: fileUrl,
      },
    });

    // Actualizar el estado de la solicitud a FINALIZADA
    await db.solicitud.update({
      where: {
        id: parseInt(solicitudId),
      },
      data: {
        estado: "FINALIZADA",
      },
    });

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error("Error al subir el documento finalizado:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
} 