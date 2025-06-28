import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

// PUT /api/admin/companies/[id]
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // Verificar que el usuario sea admin
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== UserRole.ADMIN) {
      return new NextResponse("No autorizado", { status: 403 });
    }

    // Extraer el ID de la URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    const body = await req.json();
    const { nombre, direccion, telefono, RIF, persona_de_contacto, email, tipo, password } = body;

    // Validar campos requeridos
    if (!nombre || !direccion || !telefono || !RIF || !persona_de_contacto || !email || !tipo) {
      return new NextResponse("Faltan campos requeridos", { status: 400 });
    }

    // Verificar si la empresa existe
    const existingCompany = await db.empresa.findUnique({
      where: { id }
    });

    if (!existingCompany) {
      return new NextResponse("Empresa no encontrada", { status: 404 });
    }

    // Verificar si ya existe otra empresa con el mismo RIF
    const existingRIF = await db.empresa.findFirst({
      where: { 
        RIF,
        id: { not: id }
      }
    });

    if (existingRIF) {
      return new NextResponse("Ya existe otra empresa con este RIF", { status: 400 });
    }

    // Verificar si ya existe otra empresa con el mismo nombre
    const existingName = await db.empresa.findFirst({
      where: { 
        nombre,
        id: { not: id }
      }
    });

    if (existingName) {
      return new NextResponse("Ya existe otra empresa con este nombre", { status: 400 });
    }

    // Preparar los datos de actualización
    const updateData: any = {
      nombre,
      direccion,
      telefono,
      RIF,
      persona_de_contacto,
      email,
      tipo,
    };

    // Hashear la contraseña si se proporciona una nueva
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Actualizar la empresa
    const company = await db.empresa.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error("[COMPANY_PUT]", error);
    return new NextResponse("Error interno", { status: 500 });
  }
}

// DELETE /api/admin/companies/[id]
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // Verificar que el usuario sea admin
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== UserRole.ADMIN) {
      return new NextResponse("No autorizado", { status: 403 });
    }

    // Extraer el ID de la URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    // Verificar si la empresa existe
    const existingCompany = await db.empresa.findUnique({
      where: { id },
      include: {
        users: true
      }
    });

    if (!existingCompany) {
      return new NextResponse("Empresa no encontrada", { status: 404 });
    }

    // Verificar si hay usuarios asociados a esta empresa
    if (existingCompany.users.length > 0) {
      return new NextResponse("No se puede eliminar la empresa porque tiene usuarios asociados", { status: 400 });
    }

    // Eliminar la empresa
    await db.empresa.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[COMPANY_DELETE]", error);
    return new NextResponse("Error interno", { status: 500 });
  }
} 