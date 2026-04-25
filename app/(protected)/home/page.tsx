
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { OnboardingStatus } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  GraduationCap, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Target,
  Calendar,
  Award,
  Star,
  Eye,
  Download,
  Users,
  FileText,
  Plus,
  Bell,
  BarChart3,
  Lightbulb,
  History,
  Settings,
  ArrowRight,
  Clock3,
  Trophy,
  Bookmark,
  Share2,
  CalendarDays,
  BookMarked
} from "lucide-react";
import Link from "next/link";
import { HomeHistoriasStrip } from "@/components/historias/home-historias-strip";
import { HomeCaletaFeedColumns } from "@/components/home/home-caleta-feed-columns";
import type { FeedCaleta } from "@/components/home/home-caleta-feed-card";
import { CaletaTour } from "@/components/tutorial/caleta-tour";

// Suprimir warning de hidratación para extensiones del navegador
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getSession();

  if (!session?.user?.id) {
    return null;
  }

  try {
    // Verificar el estado de onboarding
    const user = await db.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        onboardingStatus: true,
        carrera: {
          select: {
            nombre: true,
            universidad: {
              select: {
                nombre: true,
                siglas: true
              }
            }
          }
        }
      }
    });

    if (user?.onboardingStatus === OnboardingStatus.PENDIENTE) {
      return redirect("/onboarding");
    }
    
    // Obtener datos académicos del usuario
    const materiasEstudiante = await db.materiaEstudiante.findMany({
      where: {
      userId: session.user.id,
    },
    include: {
      materia: {
        select: {
          id: true,
          codigo: true,
          nombre: true,
          creditos: true,
          semestre: true,
        },
      },
    },
  });

  // Calcular estadísticas académicas
  const totalMaterias = materiasEstudiante.length;
  const materiasAprobadas = materiasEstudiante.filter(m => m.estado === "APROBADA").length;
  const materiasEnCurso = materiasEstudiante.filter(m => m.estado === "EN_CURSO").length;
  const materiasAplazadas = materiasEstudiante.filter(m => m.estado === "APLAZADA").length;
  const materiasRetiradas = materiasEstudiante.filter(m => m.estado === "RETIRADA").length;
  
  const creditosAprobados = materiasEstudiante
    .filter(m => m.estado === "APROBADA")
    .reduce((sum, m) => sum + m.materia.creditos, 0);
  
  const creditosEnCurso = materiasEstudiante
    .filter(m => m.estado === "EN_CURSO")
    .reduce((sum, m) => sum + m.materia.creditos, 0);

  const promedioGeneral = materiasEstudiante
    .filter(m => m.estado === "APROBADA" && m.nota)
    .reduce((sum, m) => sum + (m.nota || 0), 0) / 
    materiasEstudiante.filter(m => m.estado === "APROBADA" && m.nota).length || 0;

  // Progreso real (consistente con /api/user/academico/dashboard):
  // materias cursadas (APROBADA o EN_CURSO) / total materias de la carrera.
  const userWithCarreraMaterias = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      carrera: {
        select: {
          materias: { select: { id: true } },
        },
      },
    },
  });
  const totalMateriasCarrera = userWithCarreraMaterias?.carrera?.materias?.length ?? 0;
  const materiasCursadas = materiasEstudiante.filter(
    (m) => m.estado === "APROBADA" || m.estado === "EN_CURSO",
  ).length;
  const progresoCarrera = totalMateriasCarrera > 0 ? (materiasCursadas / totalMateriasCarrera) * 100 : 0;

  // Obtener recursos de Caletas del usuario
  const recursosUsuario = await db.recurso.findMany({
    where: {
      autorId: session.user.id,
    },
          include: {
            materia: {
        select: {
          codigo: true,
          nombre: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc'
      },
    take: 5
  });

  const recursosCompartidosCount = await db.recurso.count({
    where: { autorId: session.user.id },
  });

    // Obtener recursos más populares de Caletas
    const recursosPopulares = await db.recurso.findMany({
    // Todos los recursos son visibles para todos los estudiantes
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      tipo: true,
      archivoUrl: true,
      createdAt: true,
      calificacion: true,
      numCalificaciones: true,
      numVistas: true,
      numDescargas: true,
      esAnonimo: true,
      autorId: true,
      materia: {
        select: {
          codigo: true,
          nombre: true,
        },
      },
      autor: {
        select: {
          name: true,
        },
      },
      favoritos: { where: { usuarioId: session.user.id }, select: { id: true } },
      _count: { select: { favoritos: true } },
    },
    orderBy: [
      { numVistas: 'desc' },
      { calificacion: 'desc' }
    ],
    take: 5
  });

  const recursosPopularesMasked = recursosPopulares.map((r) => ({
    ...r,
    autor: r.esAnonimo && r.autorId !== session.user.id ? { name: "Anónimo" } : r.autor,
    isFavorito: Array.isArray((r as any).favoritos) && (r as any).favoritos.length > 0,
    favoritosCount: (r as any)._count?.favoritos ?? 0,
  }));

  // Feed: caletas recientes (tipo red social)
  const recursosRecientes = await db.recurso.findMany({
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      tipo: true,
      archivoUrl: true,
      createdAt: true,
      calificacion: true,
      numVistas: true,
      numDescargas: true,
      esAnonimo: true,
      autorId: true,
      materia: { select: { codigo: true, nombre: true } },
      autor: { select: { name: true } },
      favoritos: { where: { usuarioId: session.user.id }, select: { id: true } },
      _count: { select: { favoritos: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const recursosRecientesMasked = recursosRecientes.map((r) => ({
    ...r,
    autor: r.esAnonimo && r.autorId !== session.user.id ? { name: "Anónimo" } : r.autor,
    isFavorito: r.favoritos.length > 0,
    favoritosCount: r._count.favoritos,
  }));

  const toFeedCaletaClient = (r: (typeof recursosRecientesMasked)[number]): FeedCaleta => ({
    id: r.id,
    archivoUrl: r.archivoUrl,
    titulo: r.titulo,
    tipo: r.tipo,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    numVistas: r.numVistas,
    numDescargas: r.numDescargas,
    autor: { name: r.autor.name ?? "Estudiante" },
    materia: r.materia,
    isFavorito: r.isFavorito,
    favoritosCount: r.favoritosCount,
  });

  const feedNuevasClient = recursosRecientesMasked.map(toFeedCaletaClient);
  const feedPopularesClient = recursosPopularesMasked.map(toFeedCaletaClient);

  // Obtener materias próximas a vencer (materias en curso)
  const materiasProximas = materiasEstudiante
    .filter(m => m.estado === "EN_CURSO")
    .slice(0, 5);

  // Obtener notificaciones recientes
  const notificaciones = await db.notification.findMany({
    where: {
      userId: session.user.id,
      read: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  });

  // Obtener metas académicas del usuario
  const metasAcademicas = await db.metaAcademica.findMany({
    where: {
      usuarioId: session.user.id,
      completada: false,
    },
    orderBy: {
      fechaLimite: 'asc'
    },
    take: 3
  });

  // Obtener metas completadas recientes para logros
  const metasCompletadas = await db.metaAcademica.findMany({
    where: {
      usuarioId: session.user.id,
      completada: true,
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 5
  });

  // Funciones auxiliares
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "APROBADA":
        return "bg-green-500/10 text-green-300 border-green-500/20";
      case "EN_CURSO":
        return "bg-blue-500/10 text-blue-300 border-blue-500/20";
      case "APLAZADA":
        return "bg-red-500/10 text-red-300 border-red-500/20";
      case "RETIRADA":
        return "bg-yellow-500/10 text-yellow-300 border-yellow-500/20";
      default:
        return "bg-gray-500/10 text-gray-300 border-gray-500/20";
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "APROBADA":
        return <CheckCircle className="w-4 h-4" />;
      case "EN_CURSO":
        return <Clock className="w-4 h-4" />;
      case "APLAZADA":
        return <XCircle className="w-4 h-4" />;
      case "RETIRADA":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "ANOTACION":
        return <FileText className="w-4 h-4" />;
      case "RESUMEN":
        return <BookOpen className="w-4 h-4" />;
      case "GUIA_ESTUDIO":
        return <Award className="w-4 h-4" />;
      case "EJERCICIOS":
        return <TrendingUp className="w-4 h-4" />;
      case "PRESENTACION":
        return <FileText className="w-4 h-4" />;
      case "VIDEO":
        return <FileText className="w-4 h-4" />;
      case "AUDIO":
        return <FileText className="w-4 h-4" />;
      case "DOCUMENTO":
        return <FileText className="w-4 h-4" />;
      case "ENLACE":
        return <FileText className="w-4 h-4" />;
      case "TIP":
        return <Lightbulb className="w-4 h-4" />;
      case "PROMEDIO_GENERAL":
        return <BarChart3 className="w-4 h-4" />;
      case "MATERIAS_APROBADAS":
        return <BookOpen className="w-4 h-4" />;
      case "CREDITOS_COMPLETADOS":
        return <GraduationCap className="w-4 h-4" />;
      case "SEMESTRE_ESPECIFICO":
        return <CalendarDays className="w-4 h-4" />;
      case "MATERIA_ESPECIFICA":
        return <BookMarked className="w-4 h-4" />;
      case "HORAS_ESTUDIO":
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTipoNombre = (tipo: string) => {
    switch (tipo) {
      case "PROMEDIO_GENERAL":
        return "Promedio";
      case "MATERIAS_APROBADAS":
        return "Materias";
      case "CREDITOS_COMPLETADOS":
        return "Créditos";
      case "SEMESTRE_ESPECIFICO":
        return "Semestre";
      case "MATERIA_ESPECIFICA":
        return "Materia";
      case "HORAS_ESTUDIO":
        return "Horas";
      default:
        return tipo;
    }
  };

    return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <CaletaTour />
      <div className="container mx-auto px-4 py-8">
      {/* Header del Dashboard */}
        <div className="mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-special text-white mb-2">
          ¡Bienvenido de vuelta, {session.user.name?.split(' ')[0] || 'Estudiante'}!
        </h1>
              <p className="text-sm sm:text-base text-white/70">
                {user?.carrera ? 
                  `${user.carrera.universidad.siglas} - ${user.carrera.nombre}` : 
                  "Tu dashboard académico personal"
                }
        </p>
      </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
              <Badge className="bg-[color-mix(in_oklab,var(--accent-hex)_10%,transparent)] text-[var(--accent-hex)] border-[color-mix(in_oklab,var(--accent-hex)_20%,transparent)]">
                <Bell className="w-3 h-3 mr-1" />
                {notificaciones.length} nuevas
              </Badge>
            </div>
          </div>
        </div>

        <HomeHistoriasStrip />

        {/* Tabs principales */}
        <Tabs defaultValue="caletas" className="space-y-6">
          <TabsList className="flex w-full gap-0.5 overflow-x-auto border-white/10 bg-[var(--mygreen-light)] p-0.5">
            <TabsTrigger
              value="caletas"
              className="h-8 min-w-[5.5rem] flex-1 rounded-md px-2 text-xs text-white data-[state=active]:bg-[var(--accent-hex)] data-[state=active]:text-white sm:text-sm"
            >
              Caletas
            </TabsTrigger>
            <TabsTrigger
              value="overview"
              className="h-8 min-w-[6.5rem] flex-1 rounded-md px-2 text-xs text-white data-[state=active]:bg-[var(--accent-hex)] data-[state=active]:text-white sm:text-sm"
            >
              Novedades
            </TabsTrigger>
            <TabsTrigger
              value="goals"
              className="h-8 min-w-[5rem] flex-1 rounded-md px-2 text-xs text-white data-[state=active]:bg-[var(--accent-hex)] data-[state=active]:text-white sm:text-sm"
            >
              Metas
            </TabsTrigger>
          </TabsList>

          {/* Tab: Resumen General */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Materias Próximas */}
              <Card className="bg-[var(--mygreen-light)] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock3 className="w-5 h-5 text-[var(--accent-hex)]" />
                    Materias en Curso
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Tus materias actuales y próximas evaluaciones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {materiasProximas.map((materia) => (
                      <div key={materia.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[var(--mygreen-dark)] rounded-lg">
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                          {getEstadoIcon(materia.estado)}
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate">{materia.materia.codigo}</p>
                            <p className="text-white/70 text-sm truncate">{materia.materia.nombre}</p>
                          </div>
                        </div>
                        <Badge className={getEstadoColor(materia.estado)}>
                          {materia.estado}
                        </Badge>
                      </div>
                    ))}
                    {materiasProximas.length === 0 && (
                      <div className="text-center py-4 text-white/70">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 text-white/30" />
                        <p>No tienes materias en curso</p>
                      </div>
                    )}
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="mt-4 h-8 min-h-0 w-full rounded-lg border-0 bg-[var(--accent-hex)] px-3 py-0 text-xs font-medium text-white hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]"
                  >
                    <Link href="/academico" className="inline-flex items-center justify-center gap-1.5">
                      Ver Panel Académico
                      <ArrowRight className="h-3 w-3 shrink-0" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Notificaciones */}
              <Card className="bg-[var(--mygreen-light)] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[var(--accent-hex)]" />
                    Notificaciones Recientes
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Mantente al día con tu actividad académica
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {notificaciones.map((notificacion) => (
                      <div key={notificacion.id} className="flex items-start gap-3 p-3 bg-[var(--mygreen-dark)] rounded-lg">
                        <div className="w-2 h-2 bg-[var(--accent-hex)] rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">{notificacion.message}</p>
                          <p className="text-white/50 text-xs">
                            {new Date(notificacion.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                </div>
                    ))}
                    {notificaciones.length === 0 && (
                      <div className="text-center py-4 text-white/70">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-white/30" />
                        <p>No tienes notificaciones nuevas</p>
                </div>
                    )}
                  </div>
                </CardContent>
              </Card>
      </div>

            {/* Estadísticas Detalladas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-[var(--mygreen-light)] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-center">Distribución de Materias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Aprobadas</span>
                      <span className="text-white font-medium">{materiasAprobadas}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">En Curso</span>
                      <span className="text-white font-medium">{materiasEnCurso}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Aplazadas</span>
                      <span className="text-white font-medium">{materiasAplazadas}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Retiradas</span>
                      <span className="text-white font-medium">{materiasRetiradas}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[var(--mygreen-light)] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-center">Progreso de Créditos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Aprobados</span>
                      <span className="text-white font-medium">{creditosAprobados}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">En Curso</span>
                      <span className="text-white font-medium">{creditosEnCurso}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Total</span>
                      <span className="text-white font-medium">{creditosAprobados + creditosEnCurso}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[var(--mygreen-light)] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-center">Actividad Reciente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Recursos Compartidos</span>
                      <span className="text-white font-medium">{recursosUsuario.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Metas Activas</span>
                      <span className="text-white font-medium">{metasAcademicas.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Notificaciones</span>
                      <span className="text-white font-medium">{notificaciones.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Nota: el tab académico se movió a /perfil para simplificar la home */}

          {/* Tab: Caletas */}
          <TabsContent value="caletas" className="space-y-6">
            <HomeCaletaFeedColumns nuevas={feedNuevasClient} populares={feedPopularesClient} />
          </TabsContent>

          {/* Tab: Metas */}
          <TabsContent value="goals" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Metas Activas */}
              <Card className="bg-[var(--mygreen-light)] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-[var(--accent-hex)]" />
                    Mis Metas Académicas
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Objetivos que te has propuesto alcanzar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metasAcademicas.map((meta) => (
                      <div key={meta.id} className="p-3 bg-[var(--mygreen-dark)] rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                            {getTipoIcon(meta.tipo)}
                            <p className="text-white font-medium">{meta.titulo}</p>
                          </div>
                          <Badge className="bg-[color-mix(in_oklab,var(--accent-hex)_10%,transparent)] text-[var(--accent-hex)] border-[color-mix(in_oklab,var(--accent-hex)_20%,transparent)]">
                            {getTipoNombre(meta.tipo)}
                          </Badge>
                        </div>
                        <p className="text-white/70 text-sm mb-2">{meta.descripcion || "Sin descripción"}</p>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-white/50">
                            {meta.valorActual}/{meta.valorObjetivo}
                            {meta.tipo === "PROMEDIO_GENERAL" && " pts"}
                            {meta.tipo === "MATERIAS_APROBADAS" && " materias"}
                            {meta.tipo === "CREDITOS_COMPLETADOS" && " créditos"}
                            {meta.tipo === "SEMESTRE_ESPECIFICO" && " sem"}
                            {meta.tipo === "MATERIA_ESPECIFICA" && (meta.valorActual >= meta.valorObjetivo ? " ✓" : " ✗")}
                            {meta.tipo === "HORAS_ESTUDIO" && " hrs"}
                          </span>
                          <span className="text-white/50">
                            {meta.fechaLimite ? new Date(meta.fechaLimite).toLocaleDateString() : 'Sin fecha límite'}
                          </span>
                        </div>
                        <Progress 
                          value={(meta.valorActual / meta.valorObjetivo) * 100} 
                          className="mt-2"
                        />
                        <p className="text-white/50 text-xs mt-1">
                          {((meta.valorActual / meta.valorObjetivo) * 100).toFixed(1)}% completado
                        </p>
                      </div>
                    ))}
                    {metasAcademicas.length === 0 && (
                      <div className="text-center py-4 text-white/70">
                        <Target className="w-8 h-8 mx-auto mb-2 text-white/30" />
                        <p>No tienes metas activas</p>
                        <p className="text-sm mt-1">¡Crea tu primera meta para comenzar!</p>
                      </div>
                    )}
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="mt-4 h-8 min-h-0 w-full rounded-lg border-0 bg-[var(--accent-hex)] px-3 py-0 text-xs font-medium text-white hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]"
                  >
                    <Link href="/academico/metas" className="inline-flex items-center justify-center gap-1.5">
                      <Plus className="h-3 w-3 shrink-0" />
                      Crear Nueva Meta
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Logros */}
              <Card className="bg-[var(--mygreen-light)] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[var(--accent-hex)]" />
                    Logros Recientes
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Celebra tus éxitos académicos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metasCompletadas.length > 0 ? (
                      metasCompletadas.map((meta) => (
                        <div key={meta.id} className="p-3 bg-[var(--mygreen-dark)] rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Trophy className="w-4 h-4 text-yellow-400" />
                            <p className="text-white font-medium">{meta.titulo}</p>
                          </div>
                          <p className="text-white/70 text-sm">
                            {meta.tipo === "PROMEDIO_GENERAL" && `¡Alcanzaste un promedio de ${meta.valorActual} puntos!`}
                            {meta.tipo === "MATERIAS_APROBADAS" && `¡Aprobaste ${meta.valorActual} materias!`}
                            {meta.tipo === "CREDITOS_COMPLETADOS" && `¡Completaste ${meta.valorActual} créditos!`}
                            {meta.tipo === "SEMESTRE_ESPECIFICO" && `¡Llegaste al semestre ${meta.valorActual}!`}
                            {meta.tipo === "MATERIA_ESPECIFICA" && "¡Materia específica aprobada!"}
                            {meta.tipo === "HORAS_ESTUDIO" && `¡Completaste ${meta.valorActual} horas de estudio!`}
                            {!meta.tipo && "¡Meta alcanzada exitosamente!"}
                          </p>
                          <p className="text-white/50 text-xs mt-1">
                            Completada el {new Date(meta.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="p-3 bg-[var(--mygreen-dark)] rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-[var(--accent-hex)]" />
                            <p className="text-white font-medium">Primera Meta</p>
                          </div>
                          <p className="text-white/70 text-sm">¡Crea tu primera meta académica para comenzar!</p>
                        </div>
                        <div className="p-3 bg-[var(--mygreen-dark)] rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                            <p className="text-white font-medium">Progreso Académico</p>
                          </div>
                          <p className="text-white/70 text-sm">Establece metas para mejorar tu rendimiento</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Acciones Rápidas */}
        <div className="mt-8">
          <h2 className="mb-1 font-special text-lg text-white sm:text-xl">¿Qué quieres hacer hoy?</h2>
          <p className="mb-3 text-xs text-white/70 sm:text-sm">
            Accede rápido a lo más usado. Todo está a 1 toque, como en una app social.
          </p>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-3">
            <Link
              href="/caletas"
              data-tutorial="caletas-explorar"
              className="group rounded-xl border border-white/10 bg-[var(--mygreen-light)] p-3 transition-colors hover:border-[color-mix(in_oklab,var(--accent-hex)_35%,transparent)] hover:bg-white/5"
            >
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--accent-hex)_15%,transparent)] text-[var(--accent-hex)]">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">Explorar Caletas</div>
                  <div className="mt-0.5 text-xs leading-snug text-white/70">
                    Busca por materia y tipo. Guarda tus favoritos y vuelve luego.
                  </div>
                </div>
              </div>
            </Link>

            <Link
              href="/academico/historial"
              className="group rounded-xl border border-white/10 bg-[var(--mygreen-light)] p-3 transition-colors hover:border-[color-mix(in_oklab,var(--accent-hex)_35%,transparent)] hover:bg-white/5"
            >
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--accent-hex)_15%,transparent)] text-[var(--accent-hex)]">
                  <History className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">Actualizar mi historial</div>
                  <div className="mt-0.5 text-xs leading-snug text-white/70">
                    Agrega materias, notas y estados (en curso, aprobada, etc.).
                  </div>
                </div>
              </div>
            </Link>

            <Link
              href="/academico"
              className="group rounded-xl border border-white/10 bg-[var(--mygreen-light)] p-3 transition-colors hover:border-[color-mix(in_oklab,var(--accent-hex)_35%,transparent)] hover:bg-white/5"
            >
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--accent-hex)_15%,transparent)] text-[var(--accent-hex)]">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">Ver mi progreso</div>
                  <div className="mt-0.5 text-xs leading-snug text-white/70">
                    Panel académico con tu avance, créditos y materias actuales.
                  </div>
                </div>
              </div>
            </Link>
          </div>
                </div>
      </div>
    </div>
    );
  } catch (error) {
    // Next.js redirections throw an internal error (NEXT_REDIRECT). We must rethrow it.
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as any).digest === "string" &&
      ((error as any).digest as string).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    console.error("[home] Error cargando dashboard:", error);
    return (
      <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
        <div className="container mx-auto px-4 py-10">
          <Card className="bg-[var(--mygreen-light)] border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[var(--accent-hex)]" />
                No pudimos cargar tu panel
              </CardTitle>
              <CardDescription className="text-white/70">
                Hay un problema temporal conectando con la base de datos. Intenta recargar en unos segundos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-white/70">
                Si el problema persiste, revisa tu conexión o el estado del servidor de base de datos.
              </div>
              <Button
                asChild
                variant="outline"
                className="h-8 min-h-0 rounded-lg border-0 bg-[var(--accent-hex)] px-4 py-0 text-xs font-medium text-white hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]"
              >
                <Link href="/home">Reintentar</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
}