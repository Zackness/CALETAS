"use client";

import { useState, useEffect } from "react";
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
  History,
  Plus
} from "lucide-react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { UpdateGradeDialog } from "@/components/academico/update-grade-dialog";

interface MateriaEstudiante {
  id: string;
  estado: string;
  nota?: number;
  semestreCursado?: string;
  fechaInicio?: string;
  fechaFin?: string;
  materia: {
    id: string;
    codigo: string;
    nombre: string;
    creditos: number;
    semestre: string;
    horasTeoria: number;
    horasPractica: number;
  };
}

interface Estadisticas {
  totalMaterias: number;
  materiasAprobadas: number;
  materiasEnCurso: number;
  materiasAplazadas: number;
  creditosAprobados: number;
  creditosEnCurso: number;
  promedioGeneral: number;
  progresoCarrera: number;
}

export default function PanelAcademico() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [materiasEstudiante, setMateriasEstudiante] = useState<MateriaEstudiante[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      redirect("/auth/signin");
    }

    const fetchDatosAcademicos = async () => {
      try {
        const response = await axios.get("/api/user/academico/dashboard");
        setMateriasEstudiante(response.data.materiasEstudiante);
        setEstadisticas(response.data.estadisticas);
      } catch (error) {
        console.error("Error fetching academic data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDatosAcademicos();
  }, [session, status]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Cargando panel académico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-special text-white mb-2">
            Panel de Control Académico
          </h1>
          <p className="text-white/70">
            Gestiona tu progreso académico y visualiza tu rendimiento
          </p>
        </div>

        {/* Estadísticas Principales */}
        {estadisticas && (
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
                  {estadisticas.progresoCarrera.toFixed(1)}%
                </div>
                <Progress 
                  value={estadisticas.progresoCarrera} 
                  className="mt-2"
                />
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
                  {estadisticas.promedioGeneral.toFixed(2)}
                </div>
                <p className="text-xs text-white/70 mt-1">
                  {estadisticas.materiasAprobadas} materias aprobadas
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/70">
                  Créditos Aprobados
                </CardTitle>
                <Award className="h-4 w-4 text-[#40C9A9]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {estadisticas.creditosAprobados}
                </div>
                <p className="text-xs text-white/70 mt-1">
                  {estadisticas.creditosEnCurso} en curso
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
                  {estadisticas.materiasEnCurso}
                </div>
                <p className="text-xs text-white/70 mt-1">
                  de {estadisticas.totalMaterias} total
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs para diferentes vistas */}
        <Tabs defaultValue="actuales" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-[#354B3A] border-white/10">
            <TabsTrigger value="actuales" className="text-white data-[state=active]:bg-[#40C9A9] data-[state=active]:text-white">
              Materias Actuales
            </TabsTrigger>
            <TabsTrigger value="historial" className="text-white data-[state=active]:bg-[#40C9A9] data-[state=active]:text-white">
              Historial Académico
            </TabsTrigger>
            <TabsTrigger value="estadisticas" className="text-white data-[state=active]:bg-[#40C9A9] data-[state=active]:text-white">
              Estadísticas Detalladas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="actuales" className="space-y-4">
            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#40C9A9]" />
                      Materias en Curso
                    </CardTitle>
                    <CardDescription className="text-white/70">
                      Materias que estás cursando actualmente
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => router.push("/academico/historial")}
                      variant="outline"
                      className="border-[#40C9A9] text-[#40C9A9] hover:bg-[#40C9A9] hover:text-white"
                    >
                      <History className="w-4 h-4 mr-2" />
                      Ver Historial
                    </Button>
                    <Button
                      onClick={() => router.push("/academico/historial")}
                      className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Materia
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {materiasEstudiante
                    .filter(m => m.estado === "EN_CURSO")
                    .map((materia) => (
                      <div
                        key={materia.id}
                        className="flex items-center justify-between p-4 bg-[#1C2D20] rounded-lg border border-white/5"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {getEstadoIcon(materia.estado)}
                              <span className="font-medium text-white">
                                {materia.materia.codigo}
                              </span>
                            </div>
                            <Badge className={getEstadoColor(materia.estado)}>
                              {materia.estado}
                            </Badge>
                          </div>
                          <p className="text-white/70 mt-1">{materia.materia.nombre}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-white/60">
                            <span>Semestre: {materia.materia.semestre}</span>
                            <span>Créditos: {materia.materia.creditos}</span>
                            <span>Hrs: {materia.materia.horasTeoria}T + {materia.materia.horasPractica}P</span>
                          </div>
                        </div>
                        <UpdateGradeDialog 
                          materiaEstudiante={materia}
                          onUpdate={() => {
                            // Recargar datos
                            window.location.reload();
                          }}
                        />
                      </div>
                    ))}
                  
                  {materiasEstudiante.filter(m => m.estado === "EN_CURSO").length === 0 && (
                    <div className="text-center py-8 text-white/70">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 text-white/30" />
                      <p>No tienes materias en curso actualmente</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historial" className="space-y-4">
            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-[#40C9A9]" />
                      Historial Académico
                    </CardTitle>
                    <CardDescription className="text-white/70">
                      Todas tus materias cursadas y sus calificaciones
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => router.push("/academico/historial")}
                      variant="outline"
                      className="border-[#40C9A9] text-[#40C9A9] hover:bg-[#40C9A9] hover:text-white"
                    >
                      <History className="w-4 h-4 mr-2" />
                      Ver Historial Completo
                    </Button>
                    <Button
                      onClick={() => router.push("/academico/historial")}
                      className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Gestionar Historial
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {materiasEstudiante
                    .filter(m => m.estado !== "NO_CURSADA")
                    .sort((a, b) => {
                      const semA = parseInt(a.materia.semestre.replace('S', ''));
                      const semB = parseInt(b.materia.semestre.replace('S', ''));
                      return semA - semB;
                    })
                    .map((materia) => (
                      <div
                        key={materia.id}
                        className="flex items-center justify-between p-4 bg-[#1C2D20] rounded-lg border border-white/5"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {getEstadoIcon(materia.estado)}
                              <span className="font-medium text-white">
                                {materia.materia.codigo}
                              </span>
                            </div>
                            <Badge className={getEstadoColor(materia.estado)}>
                              {materia.estado}
                            </Badge>
                            {materia.nota && (
                              <Badge className="bg-[#40C9A9]/10 text-[#40C9A9] border-[#40C9A9]/20">
                                Nota: {materia.nota}
                              </Badge>
                            )}
                          </div>
                          <p className="text-white/70 mt-1">{materia.materia.nombre}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-white/60">
                            <span>Semestre: {materia.materia.semestre}</span>
                            <span>Créditos: {materia.materia.creditos}</span>
                            {materia.semestreCursado && (
                              <span>Cursado: {materia.semestreCursado}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estadisticas" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#354B3A] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Distribución por Estado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Aprobadas</span>
                      <span className="text-white font-medium">
                        {estadisticas?.materiasAprobadas || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">En Curso</span>
                      <span className="text-white font-medium">
                        {estadisticas?.materiasEnCurso || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Aplazadas</span>
                      <span className="text-white font-medium">
                        {estadisticas?.materiasAplazadas || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#354B3A] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Progreso de Créditos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Aprobados</span>
                      <span className="text-white font-medium">
                        {estadisticas?.creditosAprobados || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">En Curso</span>
                      <span className="text-white font-medium">
                        {estadisticas?.creditosEnCurso || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Total</span>
                      <span className="text-white font-medium">
                        {(estadisticas?.creditosAprobados || 0) + (estadisticas?.creditosEnCurso || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 