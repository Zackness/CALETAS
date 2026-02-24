
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

// Suprimir warning de hidratación para extensiones del navegador
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getSession();

  if (!session?.user?.id) {
    return null;
  }

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

  const progresoCarrera = user?.carrera ? 
    (creditosAprobados / (creditosAprobados + creditosEnCurso + 50)) * 100 : 0; // Estimación

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

  // Obtener recursos más populares de Caletas
  const recursosPopulares = await db.recurso.findMany({
      where: {
      esPublico: true,
      },
      include: {
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
    },
    orderBy: [
      { numVistas: 'desc' },
      { calificacion: 'desc' }
    ],
    take: 5
  });

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
      <div className="container mx-auto px-4 py-8">
      {/* Header del Dashboard */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-special text-white mb-2">
          ¡Bienvenido de vuelta, {session.user.name?.split(' ')[0] || 'Estudiante'}!
        </h1>
              <p className="text-white/70">
                {user?.carrera ? 
                  `${user.carrera.universidad.siglas} - ${user.carrera.nombre}` : 
                  "Tu dashboard académico personal"
                }
        </p>
      </div>
                  <div className="flex items-center gap-2">
              <Badge className="bg-[#40C9A9]/10 text-[#40C9A9] border-[#40C9A9]/20">
                <Bell className="w-3 h-3 mr-1" />
                {notificaciones.length} nuevas
              </Badge>
            </div>
          </div>
        </div>

        {/* Estadísticas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Progreso de Carrera
              </CardTitle>
              <Target className="h-4 w-4 text-[#40C9A9]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {progresoCarrera.toFixed(1)}%
              </div>
              <Progress 
                value={progresoCarrera} 
                className="mt-2"
              />
              <p className="text-xs text-white/70 mt-1">
                {creditosAprobados} créditos aprobados
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Promedio General
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-[#40C9A9]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {promedioGeneral.toFixed(2)}
              </div>
              <p className="text-xs text-white/70 mt-1">
                {materiasAprobadas} materias aprobadas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Materias en Curso
              </CardTitle>
              <Clock className="h-4 w-4 text-[#40C9A9]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {materiasEnCurso}
              </div>
              <p className="text-xs text-white/70 mt-1">
                {creditosEnCurso} créditos en curso
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Recursos Compartidos
              </CardTitle>
              <Share2 className="h-4 w-4 text-[#40C9A9]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {recursosUsuario.length}
              </div>
              <p className="text-xs text-white/70 mt-1">
                En Caletas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs principales */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-[#354B3A] border-white/10">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-[#40C9A9] data-[state=active]:text-white">
              Resumen General
            </TabsTrigger>
            <TabsTrigger value="academic" className="text-white data-[state=active]:bg-[#40C9A9] data-[state=active]:text-white">
              Académico
            </TabsTrigger>
            <TabsTrigger value="caletas" className="text-white data-[state=active]:bg-[#40C9A9] data-[state=active]:text-white">
              Caletas
            </TabsTrigger>
            <TabsTrigger value="goals" className="text-white data-[state=active]:bg-[#40C9A9] data-[state=active]:text-white">
              Metas
            </TabsTrigger>
          </TabsList>

          {/* Tab: Resumen General */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Materias Próximas */}
              <Card className="bg-[#354B3A] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock3 className="w-5 h-5 text-[#40C9A9]" />
                    Materias en Curso
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Tus materias actuales y próximas evaluaciones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {materiasProximas.map((materia) => (
                      <div key={materia.id} className="flex items-center justify-between p-3 bg-[#1C2D20] rounded-lg">
                        <div className="flex items-center gap-3">
                          {getEstadoIcon(materia.estado)}
                          <div>
                            <p className="text-white font-medium">{materia.materia.codigo}</p>
                            <p className="text-white/70 text-sm">{materia.materia.nombre}</p>
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
                  <Button asChild className="w-full mt-4 bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white">
                    <Link href="/academico">
                      Ver Panel Académico
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Notificaciones */}
              <Card className="bg-[#354B3A] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#40C9A9]" />
                    Notificaciones Recientes
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Mantente al día con tu actividad académica
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {notificaciones.map((notificacion) => (
                      <div key={notificacion.id} className="flex items-start gap-3 p-3 bg-[#1C2D20] rounded-lg">
                        <div className="w-2 h-2 bg-[#40C9A9] rounded-full mt-2 flex-shrink-0"></div>
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
              <Card className="bg-[#354B3A] border-white/10">
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

              <Card className="bg-[#354B3A] border-white/10">
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

              <Card className="bg-[#354B3A] border-white/10">
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

          {/* Tab: Académico */}
          <TabsContent value="academic" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Materias Actuales */}
              <Card className="bg-[#354B3A] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#40C9A9]" />
                    Materias en Curso
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Gestiona tu progreso actual
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {materiasProximas.map((materia) => (
                      <div key={materia.id} className="flex items-center justify-between p-3 bg-[#1C2D20] rounded-lg">
                        <div className="flex items-center gap-3">
                          {getEstadoIcon(materia.estado)}
                          <div>
                            <p className="text-white font-medium">{materia.materia.codigo}</p>
                            <p className="text-white/70 text-sm">{materia.materia.nombre}</p>
                            <p className="text-white/50 text-xs">Semestre {materia.materia.semestre}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getEstadoColor(materia.estado)}>
                            {materia.estado}
                          </Badge>
                          {materia.nota && (
                            <p className="text-white/70 text-sm mt-1">Nota: {materia.nota}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button asChild className="flex-1 bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white">
                      <Link href="/academico">
                        Panel Académico
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="border-[#40C9A9] text-[#40C9A9] hover:bg-[#40C9A9] hover:text-white">
                      <Link href="/academico/historial">
                        Historial
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recomendaciones */}
              <Card className="bg-[#354B3A] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-[#40C9A9]" />
                    Recomendaciones
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Sugerencias para tu próximo semestre
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-[#1C2D20] rounded-lg">
                      <p className="text-white font-medium">Materias Sugeridas</p>
                      <p className="text-white/70 text-sm">Basado en tu progreso actual</p>
                    </div>
                    <div className="p-3 bg-[#1C2D20] rounded-lg">
                      <p className="text-white font-medium">Mejora tu Promedio</p>
                      <p className="text-white/70 text-sm">Enfócate en las materias en curso</p>
                    </div>
                    <div className="p-3 bg-[#1C2D20] rounded-lg">
                      <p className="text-white font-medium">Próximas Evaluaciones</p>
                      <p className="text-white/70 text-sm">Revisa tu calendario académico</p>
                    </div>
                  </div>
                  <Button asChild className="w-full mt-4 bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white">
                    <Link href="/academico/recomendaciones">
                      Ver Recomendaciones Completas
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Caletas */}
          <TabsContent value="caletas" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mis Recursos */}
              <Card className="bg-[#354B3A] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#40C9A9]" />
                    Mis Recursos Compartidos
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Los recursos que has compartido en Caletas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recursosUsuario.map((recurso) => (
                      <div key={recurso.id} className="flex items-center justify-between p-3 bg-[#1C2D20] rounded-lg">
                        <div className="flex items-center gap-3">
                          {getTipoIcon(recurso.tipo)}
                          <div>
                            <p className="text-white font-medium">{recurso.titulo}</p>
                            <p className="text-white/70 text-sm">{recurso.materia.codigo}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Star className="w-3 h-3" />
                            <span className="text-white text-sm">{recurso.calificacion.toFixed(1)}</span>
                          </div>
                          <p className="text-white/50 text-xs">{recurso.numVistas} vistas</p>
                        </div>
                </div>
                    ))}
                    {recursosUsuario.length === 0 && (
                      <div className="text-center py-4 text-white/70">
                        <Share2 className="w-8 h-8 mx-auto mb-2 text-white/30" />
                        <p>No has compartido recursos aún</p>
                </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button asChild className="flex-1 bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white">
                      <Link href="/caletas/crear">
                        <Plus className="w-4 h-4 mr-2" />
                        Compartir Recurso
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="border-[#40C9A9] text-[#40C9A9] hover:bg-[#40C9A9] hover:text-white">
                      <Link href="/caletas/mis-recursos">
                        Ver Todos
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recursos Populares */}
              <Card className="bg-[#354B3A] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#40C9A9]" />
                    Recursos Populares
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Los recursos más vistos en Caletas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recursosPopulares.map((recurso) => (
                      <div key={recurso.id} className="flex items-center justify-between p-3 bg-[#1C2D20] rounded-lg">
                        <div className="flex items-center gap-3">
                          {getTipoIcon(recurso.tipo)}
                          <div>
                            <p className="text-white font-medium">{recurso.titulo}</p>
                            <p className="text-white/70 text-sm">por {recurso.autor.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Star className="w-3 h-3" />
                            <span className="text-white text-sm">{recurso.calificacion.toFixed(1)}</span>
                          </div>
                          <p className="text-white/50 text-xs">{recurso.numVistas} vistas</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button asChild className="w-full mt-4 bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white">
                    <Link href="/caletas">
                      Explorar Caletas
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
      </div>
          </TabsContent>

          {/* Tab: Metas */}
          <TabsContent value="goals" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Metas Activas */}
              <Card className="bg-[#354B3A] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#40C9A9]" />
                    Mis Metas Académicas
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Objetivos que te has propuesto alcanzar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metasAcademicas.map((meta) => (
                      <div key={meta.id} className="p-3 bg-[#1C2D20] rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                            {getTipoIcon(meta.tipo)}
                            <p className="text-white font-medium">{meta.titulo}</p>
                          </div>
                          <Badge className="bg-[#40C9A9]/10 text-[#40C9A9] border-[#40C9A9]/20">
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
                  <Button asChild className="w-full mt-4 bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white">
                    <Link href="/academico/metas">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Nueva Meta
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Logros */}
              <Card className="bg-[#354B3A] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#40C9A9]" />
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
                        <div key={meta.id} className="p-3 bg-[#1C2D20] rounded-lg">
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
                        <div className="p-3 bg-[#1C2D20] rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-[#40C9A9]" />
                            <p className="text-white font-medium">Primera Meta</p>
                          </div>
                          <p className="text-white/70 text-sm">¡Crea tu primera meta académica para comenzar!</p>
                        </div>
                        <div className="p-3 bg-[#1C2D20] rounded-lg">
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
          <h2 className="text-xl font-special text-white mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white h-16">
              <Link href="/academico">
                <GraduationCap className="w-5 h-5 mr-2" />
                Panel Académico
              </Link>
            </Button>
            <Button asChild className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white h-16">
              <Link href="/caletas">
                <BookOpen className="w-5 h-5 mr-2" />
                Explorar Caletas
              </Link>
            </Button>
            <Button asChild className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white h-16">
              <Link href="/caletas/crear">
                <Plus className="w-5 h-5 mr-2" />
                Compartir Recurso
              </Link>
            </Button>
            <Button asChild className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white h-16">
              <Link href="/academico/historial">
                <History className="w-5 h-5 mr-2" />
                Gestionar Historial
              </Link>
            </Button>
          </div>
                </div>
      </div>
    </div>
  );
}