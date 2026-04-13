import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToBunny } from "@/lib/bunny";
import { validateFile } from "@/lib/file-utils";
import { db } from "@/lib/db";
import { TipoRecurso } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const titulo = formData.get("titulo") as string;
    const descripcion = formData.get("descripcion") as string;
    const tipo = formData.get("tipo") as string;
    const materiaIdRaw = (formData.get("materiaId") as string) || "";
    const tags = formData.get("tags") as string;
    const esAnonimo = formData.get("esAnonimo") as string;
    const subfolder = (formData.get("subfolder") as string) || "";

    if (!file || !titulo || !descripcion || !tipo) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos: archivo, título, descripción y tipo" },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { universidadId: true, carreraId: true },
    });

    let materiaIdToUse: string | null = materiaIdRaw.trim() || null;
    let universidadIdToUse: string | null = null;

    if (user?.universidadId) {
      if (!user.carreraId || !materiaIdToUse) {
        return NextResponse.json(
          { error: "Debes seleccionar la materia de tu carrera (obligatorio para tu universidad)" },
          { status: 400 },
        );
      }
      const materiaOk = await db.materia.findFirst({
        where: {
          id: materiaIdToUse,
          carreraId: user.carreraId,
          carrera: { universidadId: user.universidadId },
        },
        select: { id: true },
      });
      if (!materiaOk) {
        return NextResponse.json(
          { error: "La materia debe pertenecer a tu carrera y universidad" },
          { status: 400 },
        );
      }
      universidadIdToUse = user.universidadId;
    } else {
      materiaIdToUse = null;
      universidadIdToUse = null;
    }

    const validation = validateFile(file);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    try {
      const archivoUrl = await uploadToBunny(file, {
        subfolder,
        prefix: "caleta",
      });

      const recurso = await db.recurso.create({
        data: {
          titulo,
          descripcion,
          tipo: tipo as TipoRecurso,
          tags: tags || "",
          esPublico: true,
          esAnonimo: esAnonimo === "true",
          archivoUrl,
          archivoSizeBytes: file.size ?? undefined,
          contenido: `Archivo: ${file.name} (${file.type}, ${file.size} bytes)`,
          materiaId: materiaIdToUse,
          universidadId: universidadIdToUse,
          autorId: session.user.id,
        },
        include: {
          materia: {
            include: {
              carrera: {
                include: {
                  universidad: true,
                },
              },
            },
          },
          autor: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          success: true,
          recurso,
          fileUrl: archivoUrl,
          mensaje: "Recurso subido exitosamente",
        },
        { status: 201 },
      );
    } catch (uploadError) {
      console.error("Error subiendo archivo a Bunny.net:", uploadError);
      return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error en upload-cpanel route:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
