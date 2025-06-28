import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

// GET /api/admin/companies
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // Verificar que el usuario sea admin o abogado
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.ABOGADO) {
      return new NextResponse("No autorizado", { status: 403 });
    }

    // Obtener todas las empresas
    const companies = await db.empresa.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("[COMPANIES_GET]", error);
    return new NextResponse("Error interno", { status: 500 });
  }
}

// POST /api/admin/companies
export async function POST(req: Request) {
  try {
    console.log("[COMPANIES_POST] Iniciando request...");
    
    const session = await auth();
    console.log("[COMPANIES_POST] Session:", session ? "existe" : "no existe");
    console.log("[COMPANIES_POST] User ID:", session?.user?.id);
    console.log("[COMPANIES_POST] User role:", session?.user?.role);
    
    if (!session?.user?.id) {
      console.log("[COMPANIES_POST] No hay sesión o ID de usuario");
      return new NextResponse("No autorizado", { status: 401 });
    }

    // Verificar que el usuario sea admin
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    console.log("[COMPANIES_POST] Usuario encontrado en DB:", user);
    console.log("[COMPANIES_POST] Rol del usuario:", user?.role);

    if (user?.role !== UserRole.ADMIN) {
      console.log("[COMPANIES_POST] Usuario no es ADMIN");
      return new NextResponse("No autorizado", { status: 403 });
    }

    const body = await req.json();
    const { nombre, direccion, telefono, RIF, persona_de_contacto, email, tipo, password } = body;

    console.log("Datos recibidos:", { nombre, direccion, telefono, RIF, persona_de_contacto, email, tipo, password: password ? "***" : "no proporcionada" });

    // Validar campos requeridos
    if (!nombre || !direccion || !telefono || !RIF || !persona_de_contacto || !email || !tipo) {
      const missingFields = [];
      if (!nombre) missingFields.push("nombre");
      if (!direccion) missingFields.push("direccion");
      if (!telefono) missingFields.push("telefono");
      if (!RIF) missingFields.push("RIF");
      if (!persona_de_contacto) missingFields.push("persona_de_contacto");
      if (!email) missingFields.push("email");
      if (!tipo) missingFields.push("tipo");
      
      console.log("Campos faltantes:", missingFields);
      return new NextResponse(`Faltan campos requeridos: ${missingFields.join(", ")}`, { status: 400 });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new NextResponse("Formato de email inválido", { status: 400 });
    }

    // Verificar si ya existe una empresa con el mismo RIF
    const existingRIF = await db.empresa.findUnique({
      where: { RIF }
    });

    if (existingRIF) {
      return new NextResponse("Ya existe una empresa con este RIF", { status: 400 });
    }

    // Verificar si ya existe una empresa con el mismo nombre
    const existingName = await db.empresa.findUnique({
      where: { nombre }
    });

    if (existingName) {
      return new NextResponse("Ya existe una empresa con este nombre", { status: 400 });
    }

    // Validar que la contraseña tenga al menos 6 caracteres si se proporciona
    if (password && password.length < 6) {
      return new NextResponse("La contraseña debe tener al menos 6 caracteres", { status: 400 });
    }

    // Hashear la contraseña si se proporciona
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Crear la empresa
    const company = await db.empresa.create({
      data: {
        nombre,
        direccion,
        telefono,
        RIF,
        persona_de_contacto,
        email,
        tipo,
        password: hashedPassword,
      }
    });

    console.log("Empresa creada exitosamente:", company.id);
    return NextResponse.json(company);
  } catch (error) {
    console.error("[COMPANIES_POST]", error);
    
    // Manejar errores específicos de Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return new NextResponse("Ya existe una empresa con estos datos", { status: 400 });
      }
      
      if (error.code === 'P2003') {
        return new NextResponse("Error de referencia en la base de datos", { status: 400 });
      }
    }
    
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
} 