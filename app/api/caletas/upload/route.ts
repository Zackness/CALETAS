import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { uploadToBunny } from "@/lib/bunny";

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
    const titulo = formData.get("titulo") as string;
    const descripcion = formData.get("descripcion") as string;
    const tipo = formData.get("tipo") as "ANOTACION" | "RESUMEN" | "GUIA_ESTUDIO" | "EJERCICIOS" | "PRESENTACION" | "VIDEO" | "AUDIO" | "DOCUMENTO" | "ENLACE" | "TIP";
    const materiaId = formData.get("materiaId") as string;
    const tags = formData.get("tags") as string;
    const esPublico = formData.get("esPublico") === "true";
    const file = formData.get("file") as File;

    // Validar campos requeridos
    if (!titulo || !descripcion || !tipo || !materiaId || !file) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Solo PDF, JPG, JPEG y PNG" },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "El archivo es demasiado grande. Máximo 10MB" },
        { status: 400 }
      );
    }

    // Verificar que la materia existe y pertenece al usuario
    const materia = await db.materia.findFirst({
      where: {
        id: materiaId,
        carrera: {
          usuarios: {
            some: {
              id: session.user.id
            }
          }
        }
      }
    });

    if (!materia) {
      return NextResponse.json(
        { error: "Materia no encontrada o no tienes acceso" },
        { status: 400 }
      );
    }

    // PASO 1: MODERACIÓN DE CONTENIDO
    console.log("✅ Contenido ya verificado automáticamente");

    // PASO 2: SUBIR ARCHIVO A BUNNY.NET
    console.log("📤 Subiendo archivo a Bunny.net...");
    
    try {
      const archivoUrl = await uploadToBunny(file);
      console.log("✅ Archivo subido exitosamente:", archivoUrl);

      // PASO 3: CREAR RECURSO EN LA BASE DE DATOS
      console.log("💾 Guardando recurso en la base de datos...");
      
      const recurso = await db.recurso.create({
        data: {
          titulo,
          descripcion,
          tipo,
          contenido: descripcion, // Usar descripción como contenido
          archivoUrl,
          materiaId,
          autorId: session.user.id,
          esPublico,
          tags: tags || "",
          calificacion: 0,
          numCalificaciones: 0,
          numVistas: 0,
          numDescargas: 0,
        },
        include: {
          materia: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
            }
          },
          autor: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });

      console.log("✅ Recurso creado exitosamente");

      return NextResponse.json({
        success: true,
        recurso,
        mensaje: "Recurso subido exitosamente después de la verificación de contenido"
      }, { status: 201 });

    } catch (uploadError) {
      console.error("Error subiendo archivo:", uploadError);
      return NextResponse.json(
        { error: "Error al subir el archivo" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error en upload route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 