import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { EstadoDeResidencia } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      userData,
      spouseData,
      telefono,
      estado,
      ciudad,
      empresa,
      codigoEmpresa
    } = body;

    // Validar los datos del usuario
    if (!userData?.cedula || !userData?.nombre || !userData?.fechaNacimiento) {
      return new NextResponse("Faltan datos requeridos del usuario", { status: 400 });
    }

    // Actualizar datos del usuario
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        // Datos de identificación
        cedula: userData.cedula,
        name: userData.nombre,
        name2: userData.nombre2 || null,
        apellido: userData.apellido || null,
        apellido2: userData.apellido2 || null,
        fechaNacimiento: new Date(userData.fechaNacimiento),
        estadoCivil: userData.estadoCivil?.toUpperCase() || "SOLTERO",
        // Datos de residencia
        telefono,
        EstadoDeResidencia: estado,
        ciudadDeResidencia: ciudad,
        onboardingStatus: "FINALIZADO",
        // Datos de empresa (si se proporcionaron)
        ...(empresa && {
          empresas: {
            connect: {
              id: empresa
            }
          }
        })
      },
      include: {
        empresas: true
      }
    });

    // Si se proporcionó una empresa, actualizar el código
    if (empresa && codigoEmpresa) {
      await db.user.update({
        where: { id: session.user.id },
        data: {
          codigoEmpresa
        }
      });
    }

    // Si hay datos del cónyuge, crear un familiar
    if (spouseData?.cedula && spouseData?.nombre) {
      await db.familiar.create({
        data: {
          nombre: spouseData.nombre,
          nombre2: spouseData.nombre2,
          apellido: spouseData.apellido,
          apellido2: spouseData.apellido2,
          cedula: spouseData.cedula,
          parentesco: "ESPOSO",
          fechaNacimiento: spouseData.fechaNacimiento ? new Date(spouseData.fechaNacimiento) : null,
          usuarioId: session.user.id,
        },
      });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json(
      { error: "Error al completar el onboarding" },
      { status: 500 }
    );
  }
} 