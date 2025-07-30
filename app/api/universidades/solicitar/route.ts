import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";

interface Estudiante {
  id: string;
  nombre: string;
  email: string;
  carnet: string;
}

interface SolicitudData {
  universidad: string;
  carrera: string;
  descripcion: string;
  estudiantes: Estudiante[];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const universidad = formData.get("universidad") as string;
    const siglasUniversidad = formData.get("siglasUniversidad") as string;
    const tipoUniversidad = formData.get("tipoUniversidad") as string;
    const carrera = formData.get("carrera") as string;
    const descripcionCarrera = formData.get("descripcionCarrera") as string;
    const estudiantesJson = formData.get("estudiantes") as string;
    const pensum = formData.get("pensum") as File;

    if (!universidad || !siglasUniversidad || !tipoUniversidad || !carrera || !estudiantesJson || !pensum) {
      return NextResponse.json({ error: "Datos requeridos faltantes" }, { status: 400 });
    }

    const estudiantes: Estudiante[] = JSON.parse(estudiantesJson);

    if (estudiantes.length < 1) {
      return NextResponse.json({ error: "Se requiere al menos 1 estudiante" }, { status: 400 });
    }

    // Validar que todos los estudiantes tengan datos completos
    for (const estudiante of estudiantes) {
      if (!estudiante.nombre || !estudiante.email || !estudiante.carnet) {
        return NextResponse.json({ error: "Datos de estudiantes incompletos" }, { status: 400 });
      }
    }

    // Verificar si la universidad ya existe
    const universidadExistente = await db.universidad.findFirst({
      where: {
        OR: [
          {
            nombre: {
              contains: universidad
            }
          },
          {
            siglas: {
              equals: siglasUniversidad
            }
          }
        ]
      }
    });

    let universidadId: string;

    if (universidadExistente) {
      // Universidad ya existe, usar su ID
      universidadId = universidadExistente.id;
      console.log("✅ Universidad encontrada:", universidadExistente.nombre, "(", universidadExistente.siglas, ")");
    } else {
      // Crear nueva universidad
      const nuevaUniversidad = await db.universidad.create({
        data: {
          nombre: universidad,
          siglas: siglasUniversidad,
          tipo: tipoUniversidad,
          direccion: "Por definir",
          telefono: "Por definir",
          email: "contacto@" + siglasUniversidad.toLowerCase() + ".edu.ve",
          estado: "ACTIVA",
          ciudad: "Por definir"
        }
      });
      universidadId = nuevaUniversidad.id;
      console.log("✅ Nueva universidad creada:", universidad, "(", siglasUniversidad, ")");
    }

    // Verificar si la carrera ya existe en esta universidad
    const carreraExistente = await db.carrera.findFirst({
      where: {
        nombre: {
          contains: carrera
        },
        universidadId: universidadId
      }
    });

    if (carreraExistente) {
      return NextResponse.json({ 
        error: "Esta carrera ya existe en la universidad especificada" 
      }, { status: 400 });
    }

    // Crear la nueva carrera
    const nuevaCarrera = await db.carrera.create({
      data: {
        nombre: carrera,
        universidadId: universidadId,
        descripcion: descripcionCarrera || `Carrera de ${carrera} en ${universidad}`,
        duracion: 10,
        creditos: 180,
        codigo: carrera.substring(0, 4).toUpperCase()
      }
    });

    console.log("✅ Nueva carrera creada:", carrera);

    // TODO: Aquí se procesaría el pensum PDF para extraer materias y prerrequisitos
    // Por ahora solo guardamos la información del archivo
    console.log("📄 Pensum recibido:", pensum.name, "Tamaño:", pensum.size);
    // En el futuro: procesar PDF con IA para extraer materias automáticamente

    // Crear cuentas para todos los estudiantes
    const cuentasCreadas = [];
    const cuentasExistentes = [];
    
    for (const estudiante of estudiantes) {
      try {
        // Verificar si el usuario ya existe
        const usuarioExistente = await db.user.findUnique({
          where: { email: estudiante.email }
        });

        if (usuarioExistente) {
          console.log("⚠️ Usuario ya existe:", estudiante.email);
          cuentasExistentes.push({
            email: estudiante.email,
            nombre: estudiante.nombre
          });
          continue;
        }

        // Hash del carnet como contraseña inicial
        const passwordHash = await hash(estudiante.carnet, 12);

        // Crear el usuario
        const nuevoUsuario = await db.user.create({
          data: {
            email: estudiante.email,
            name: estudiante.nombre,
            password: passwordHash,
            emailVerified: new Date(), // Marcar como verificado
            universidadId: universidadId,
            carreraId: nuevaCarrera.id,
            onboardingStatus: 'FINALIZADO', // Saltar onboarding
            userType: 'ESTUDIANTE'
          }
        });

        console.log("✅ Usuario creado:", estudiante.email);
        cuentasCreadas.push({
          email: estudiante.email,
          nombre: estudiante.nombre
        });

      } catch (error) {
        console.error("❌ Error creando usuario:", estudiante.email, error);
        return NextResponse.json({ 
          error: `Error al crear cuenta para ${estudiante.email}` 
        }, { status: 500 });
      }
    }

    console.log("✅ Integración completada exitosamente");

    return NextResponse.json({
      success: true,
      message: "¡Universidad y carrera integradas exitosamente!",
      detalles: {
        universidad: universidadExistente ? "existente" : "nueva",
        carrera: "nueva",
        universidadId,
        carreraId: nuevaCarrera.id,
        cuentasCreadas: cuentasCreadas.length,
        cuentasExistentes: cuentasExistentes.length,
        estudiantes: {
          nuevos: cuentasCreadas,
          existentes: cuentasExistentes
        }
      }
    });

  } catch (error) {
    console.error("❌ Error procesando integración:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 