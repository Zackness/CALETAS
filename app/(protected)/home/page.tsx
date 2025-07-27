
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { OnboardingStatus } from "@prisma/client";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

// Suprimir warning de hidratación para extensiones del navegador
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  // Verificar el estado de onboarding
  const user = await db.user.findUnique({
    where: {
      id: session.user.id
    },
    select: {
      onboardingStatus: true
    }
  });

  if (user?.onboardingStatus === OnboardingStatus.PENDIENTE) {
    return redirect("/onboarding");
  }
  
  // Obtener las caletas favoritas del usuario
  let caletasFavoritas: any[] = [];
  try {
    caletasFavoritas = await db.caletaFavorita.findMany({
      where: {
        usuarioId: session.user.id
    },
    include: {
        caleta: {
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
            usuario: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
    },
    orderBy: {
      createdAt: 'desc'
      },
      take: 6
    });
    caletasFavoritas = caletasFavoritas.map(favorita => ({
      ...favorita.caleta,
      isFavorita: true,
      fechaFavorito: favorita.createdAt
    }));
  } catch {
    caletasFavoritas = [];
  }

  // Obtener caletas recientes del usuario
  let caletasRecientes: any[] = [];
  try {
    caletasRecientes = await db.caleta.findMany({
      where: {
        usuarioId: session.user.id,
        isActive: true
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
        usuario: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 4
    });
  } catch {
    caletasRecientes = [];
  }

  // Estadísticas de caletas
  let caletasStats: any = {
    total: 0,
    porTipo: { pdf: 0, imagenes: 0, documentos: 0, otros: 0 },
    favoritas: 0,
    recientes: 0,
    tamanioTotal: 0,
    materiasUnicas: 0,
    universidadesUnicas: 0
  };
  try {
    const [
      totalCaletas,
      caletasPDF,
      caletasImagenes,
      caletasDocumentos,
      caletasOtros,
      caletasFavoritasCount,
      caletasRecientes,
      totalTamanio,
      materiasUnicas,
      universidadesUnicas
    ] = await Promise.all([
      db.caleta.count({ where: { usuarioId: session.user.id, isActive: true } }),
      db.caleta.count({ where: { usuarioId: session.user.id, isActive: true, tipoArchivo: { equals: 'application/pdf' } } }),
      db.caleta.count({ where: { usuarioId: session.user.id, isActive: true, tipoArchivo: { in: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'] } } }),
      db.caleta.count({ where: { usuarioId: session.user.id, isActive: true, tipoArchivo: { in: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'] } } }),
      db.caleta.count({ where: { usuarioId: session.user.id, isActive: true, tipoArchivo: { notIn: [ 'application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain' ] } } }),
      db.caletaFavorita.count({ where: { usuarioId: session.user.id } }),
      db.caleta.count({ where: { usuarioId: session.user.id, isActive: true, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      db.caleta.aggregate({ where: { usuarioId: session.user.id, isActive: true }, _sum: { tamanio: true } }),
      db.caleta.groupBy({ by: ['materiaId'], where: { usuarioId: session.user.id, isActive: true }, _count: true }),
      db.caleta.groupBy({ by: ['materiaId'], where: { usuarioId: session.user.id, isActive: true }, _count: true })
    ]);
    
    caletasStats = {
      total: totalCaletas,
      porTipo: {
        pdf: caletasPDF,
        imagenes: caletasImagenes,
        documentos: caletasDocumentos,
        otros: caletasOtros
      },
      favoritas: caletasFavoritasCount,
      recientes: caletasRecientes,
      tamanioTotal: totalTamanio._sum.tamanio || 0,
      materiasUnicas: materiasUnicas.length,
      universidadesUnicas: universidadesUnicas.length
    };
  } catch {}

  // Funciones auxiliares
  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const day = date.getUTCDate();
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${day} ${month} ${year}`;
  };
  const getFileIcon = (tipoArchivo: string) => {
    if (tipoArchivo.includes("pdf")) return "📄";
    if (tipoArchivo.includes("image")) return "🖼️";
    return "📎";
  };

  // Mock de caletas recomendadas
  const caletasRecomendadas = [
    { id: "r1", nombre: "Cálculo I", materia: { nombre: "Matemáticas" }, tipoArchivo: "pdf", urlArchivo: "#" },
    { id: "r2", nombre: "Física Básica", materia: { nombre: "Física" }, tipoArchivo: "pdf", urlArchivo: "#" },
    { id: "r3", nombre: "Química Orgánica", materia: { nombre: "Química" }, tipoArchivo: "pdf", urlArchivo: "#" },
    { id: "r4", nombre: "Historia Universal", materia: { nombre: "Historia" }, tipoArchivo: "pdf", urlArchivo: "#" },
    { id: "r5", nombre: "Programación I", materia: { nombre: "Computación" }, tipoArchivo: "pdf", urlArchivo: "#" },
  ];

  return (
    <div className="text-center flex-1 pt-8 md:pt-20 px-4 md:px-6 space-y-6 md:space-y-10 bg-gradient-to-t from-mygreen to-mygreen-light min-h-screen overflow-x-hidden">
      {/* Header del Dashboard */}
      <div className="space-y-2">
        <h1 className="text-xl md:text-3xl font-special text-white px-2">
          ¡Bienvenido de vuelta, {session.user.name?.split(' ')[0] || 'Estudiante'}!
        </h1>
        <p className="text-white/70 text-sm md:text-base px-2">
          Aquí tienes un resumen de tu actividad académica y caletas
        </p>
      </div>

      {/* Carrusel de Caletas Favoritas */}
      <div className="text-left max-w-6xl mx-auto px-2">
        <h2 className="text-lg md:text-2xl font-special text-[#40C9A9] mb-2">Tus caletas favoritas</h2>
        <Carousel className="w-full">
          <CarouselContent>
            {caletasFavoritas.length > 0 ? caletasFavoritas.map((caleta) => (
              <CarouselItem key={caleta.id} className="basis-full sm:basis-1/2 md:basis-1/3 max-w-xs">
                <div className="bg-[#354B3A] border-white/10 border rounded-xl p-3 md:p-4 m-1 md:m-2 flex flex-col gap-2 shadow-lg h-40 md:h-48 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl md:text-2xl">{getFileIcon(caleta.tipoArchivo)}</span>
                    <span className="font-bold text-white truncate text-sm md:text-base">{caleta.nombre}</span>
                  </div>
                  <div className="text-white/70 text-xs md:text-sm truncate">{caleta.materia?.nombre}</div>
                  <a href={caleta.urlArchivo} target="_blank" rel="noopener noreferrer" className="mt-auto text-[#40C9A9] hover:underline text-sm">Ver caleta</a>
                </div>
              </CarouselItem>
            )) : (
              <CarouselItem className="basis-full sm:basis-1/2 md:basis-1/3 max-w-xs">
                <div className="bg-[#354B3A] border-white/10 border rounded-xl p-4 md:p-8 flex items-center justify-center text-white/70 h-40 md:h-48 text-sm md:text-base">
                  No tienes caletas favoritas aún
                </div>
              </CarouselItem>
            )}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      {/* Carrusel de Caletas Recientes */}
      <div className="text-left max-w-6xl mx-auto px-2">
        <h2 className="text-lg md:text-2xl font-special text-[#40C9A9] mb-2">Caletas vistas recientemente</h2>
        <Carousel className="w-full">
          <CarouselContent>
            {caletasRecientes.length > 0 ? caletasRecientes.map((caleta) => (
              <CarouselItem key={caleta.id} className="basis-full sm:basis-1/2 md:basis-1/3 max-w-xs">
                <div className="bg-[#354B3A] border-white/10 border rounded-xl p-3 md:p-4 m-1 md:m-2 flex flex-col gap-2 shadow-lg h-40 md:h-48 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl md:text-2xl">{getFileIcon(caleta.tipoArchivo)}</span>
                    <span className="font-bold text-white truncate text-sm md:text-base">{caleta.nombre}</span>
                  </div>
                  <div className="text-white/70 text-xs md:text-sm truncate">{caleta.materia?.nombre}</div>
                  <a href={caleta.urlArchivo} target="_blank" rel="noopener noreferrer" className="mt-auto text-[#40C9A9] hover:underline text-sm">Ver caleta</a>
                </div>
              </CarouselItem>
            )) : (
              <CarouselItem className="basis-full sm:basis-1/2 md:basis-1/3 max-w-xs">
                <div className="bg-[#354B3A] border-white/10 border rounded-xl p-4 md:p-8 flex items-center justify-center text-white/70 h-40 md:h-48 text-sm md:text-base">
                  No tienes caletas recientes aún
                </div>
              </CarouselItem>
            )}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      {/* Carrusel de Caletas Recomendadas */}
      <div className="text-left max-w-6xl mx-auto px-2">
        <h2 className="text-lg md:text-2xl font-special text-[#40C9A9] mb-2">Caletas recomendadas</h2>
        <Carousel className="w-full">
          <CarouselContent>
            {caletasRecomendadas.map((caleta) => (
              <CarouselItem key={caleta.id} className="basis-full sm:basis-1/2 md:basis-1/3 max-w-xs">
                <div className="bg-[#354B3A] border-white/10 border rounded-xl p-3 md:p-4 m-1 md:m-2 flex flex-col gap-2 shadow-lg h-40 md:h-48 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl md:text-2xl">{getFileIcon(caleta.tipoArchivo)}</span>
                    <span className="font-bold text-white truncate text-sm md:text-base">{caleta.nombre}</span>
                  </div>
                  <div className="text-white/70 text-xs md:text-sm truncate">{caleta.materia?.nombre}</div>
                  <a href={caleta.urlArchivo} target="_blank" rel="noopener noreferrer" className="mt-auto text-[#40C9A9] hover:underline text-sm">Ver caleta</a>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  );
}