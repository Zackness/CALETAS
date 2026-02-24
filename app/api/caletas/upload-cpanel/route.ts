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
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const titulo = formData.get("titulo") as string;
    const descripcion = formData.get("descripcion") as string;
    const tipo = formData.get("tipo") as string;
    const materiaId = formData.get("materiaId") as string;
    const tags = formData.get("tags") as string;
    const esAnonimo = formData.get("esAnonimo") as string;
    const subfolder = formData.get("subfolder") as string || "";

    // Validar campos requeridos
    if (!file || !titulo || !descripcion || !tipo) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos: archivo, título, descripción y tipo" },
        { status: 400 }
      );
    }

    // Si no hay materiaId, usar un valor por defecto o crear una materia temporal
    let materiaIdToUse = materiaId;
    if (!materiaId || materiaId === "test-materia-id" || materiaId === "") {
      // Buscar una materia existente o crear una temporal
      const materiaExistente = await db.materia.findFirst();
      if (materiaExistente) {
        materiaIdToUse = materiaExistente.id;
      } else {
        return NextResponse.json(
          { error: "No se encontró ninguna materia en la base de datos. Contacta al administrador." },
          { status: 400 }
        );
      }
    }

    // Validar archivo usando las nuevas utilidades
    const validation = validateFile(file);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    console.log("📤 Subiendo archivo a Bunny.net...");
    
    try {
      // Subir archivo a Bunny.net
      // Respetamos subfolder: si viene, prefijamos el nombre del archivo dentro del storage.
      const archivoUrl = await uploadToBunny(file, {
        subfolder,
        prefix: "caletas",
      });

      console.log("✅ Archivo subido exitosamente a Bunny.net:", archivoUrl);

      // Registrar en la base de datos
      const recurso = await db.recurso.create({
        data: {
          titulo,
          descripcion,
          tipo: tipo as TipoRecurso,
          tags: tags || "",
          esPublico: true,
          esAnonimo: esAnonimo === "true",
          archivoUrl,
          contenido: `Archivo: ${file.name} (${file.type}, ${file.size} bytes)`,
          materiaId: materiaIdToUse,
          autorId: session.user.id,
        },
        include: {
          materia: {
            include: {
              carrera: {
                include: {
                  universidad: true
                }
              }
            }
          },
          autor: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      });

      console.log("✅ Recurso registrado en la base de datos:", recurso.id);

      return NextResponse.json({
        success: true,
        recurso,
        fileUrl: archivoUrl,
        mensaje: "Recurso subido exitosamente a Bunny.net y registrado en la base de datos"
      }, { status: 201 });

    } catch (uploadError) {
      console.error("Error subiendo archivo a Bunny.net:", uploadError);
      return NextResponse.json(
        { error: "Error al subir el archivo a Bunny.net" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error en upload-cpanel route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
