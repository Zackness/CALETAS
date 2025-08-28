import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadToCPanel } from "@/lib/cpanel-storage";
import { validateFile } from "@/lib/file-utils";
import { db } from "@/lib/db";
import { TipoRecurso } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
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
    const esPublico = formData.get("esPublico") as string;
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

    console.log("📤 Subiendo archivo a cPanel (Banna Hosting)...");
    
    try {
      // Subir archivo a cPanel
      const archivoUrl = await uploadToCPanel(file, subfolder);
      console.log("✅ Archivo subido exitosamente a cPanel:", archivoUrl);

      // Registrar en la base de datos
      const recurso = await db.recurso.create({
        data: {
          titulo,
          descripcion,
          tipo: tipo as TipoRecurso,
          tags: tags || "",
          esPublico: esPublico === "true",
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
        mensaje: "Recurso subido exitosamente a cPanel y registrado en la base de datos"
      }, { status: 201 });

    } catch (uploadError) {
      console.error("Error subiendo archivo a cPanel:", uploadError);
      return NextResponse.json(
        { error: "Error al subir el archivo a cPanel" },
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
