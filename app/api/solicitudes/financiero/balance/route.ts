import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const SolicitudSchema = z.object({
  persona: z.string().optional(),
  cedula: z.string().nonempty("Debe seleccionar una persona"),
  esBalanceConjunto: z.boolean().default(false),
  documentoConyuge: z.string().nullable(),
  usuarioId: z.string(),
  familiarId: z.string().nullable(),
});

export async function POST(req: Request) {
  console.log("[BALANCE_API] Iniciando solicitud");
  
  try {
    const session = await auth();
    console.log("[BALANCE_API] Sesión:", session?.user?.id);
    
    if (!session?.user?.id) {
      console.log("[BALANCE_API] No autorizado");
      return new NextResponse("No autorizado", { status: 401 });
    }

    const body = await req.json();
    console.log("[BALANCE_API] Body recibido:", body);
    
    const validatedFields = SolicitudSchema.safeParse(body);

    if (!validatedFields.success) {
      console.log("[BALANCE_API] Error de validación:", validatedFields.error);
      return new NextResponse("Datos inválidos", { status: 400 });
    }

    const {
      cedula,
      esBalanceConjunto,
      documentoConyuge,
      usuarioId,
      familiarId,
    } = validatedFields.data;

    console.log("[BALANCE_API] Datos validados:", {
      cedula,
      esBalanceConjunto,
      documentoConyuge,
      usuarioId,
      familiarId,
    });

    // Verificar que el usuario existe
    const usuario = await db.user.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      console.log("[BALANCE_API] Usuario no encontrado:", usuarioId);
      return new NextResponse("Usuario no encontrado", { status: 404 });
    }

    // Verificar que el familiar existe si se proporciona
    if (familiarId) {
      const familiar = await db.familiar.findUnique({
        where: { id: familiarId },
      });

      if (!familiar) {
        console.log("[BALANCE_API] Familiar no encontrado:", familiarId);
        return new NextResponse("Familiar no encontrado", { status: 404 });
      }
    }

    // Obtener el documento de balance
    const documento = await db.documento.findFirst({
      where: {
        nombre: "Balance personal",
        servicio: {
          nombre: "Financiera"
        }
      }
    });

    if (!documento) {
      console.log("[BALANCE_API] Documento no encontrado");
      return new NextResponse("Documento no encontrado", { status: 404 });
    }

    console.log("[BALANCE_API] Documento encontrado:", documento.id);

    // Crear la solicitud
    const solicitud = await db.solicitud.create({
      data: {
        documentoId: documento.id,
        usuarioId: usuarioId,
        familiarId: familiarId,
        estado: "PENDIENTE",
        detalle: {
          create: {
            Testigo3: documentoConyuge,
            Testigo4: documentoConyuge,
            generic_text: esBalanceConjunto ? "Balance conjunto con cónyuge" : null,
          }
        }
      }
    });

    console.log("[BALANCE_API] Solicitud creada:", solicitud.id);

    // Crear notificación para el usuario
    await db.notificacion.create({
      data: {
        titulo: "Nueva solicitud de Balance Personal",
        mensaje: "Su solicitud de Balance Personal ha sido creada exitosamente.",
        tipo: "GENERAL",
        usuarioId: usuarioId,
        solicitudId: solicitud.id
      }
    });

    console.log("[BALANCE_API] Notificación creada");

    return NextResponse.json({
      succes: "Solicitud creada exitosamente",
      solicitudId: solicitud.id
    });

  } catch (error) {
    console.error("[BALANCE_API] Error:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
} 