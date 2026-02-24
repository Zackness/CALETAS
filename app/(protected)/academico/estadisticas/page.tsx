"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  BookOpen, 
  Award, 
  Clock,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Star
} from "lucide-react";
import axios from "axios";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface EstadisticasDetalladas {
  totalMaterias: number;
  materiasAprobadas: number;
  materiasEnCurso: number;
  materiasAplazadas: number;
  materiasRetiradas: number;
  creditosAprobados: number;
  creditosEnCurso: number;
  promedioGeneral: number;
  progresoCarrera: number;
  promedioPorSemestre: Record<string, number>;
  materiasPorEstado: Record<string, number>;
  creditosPorSemestre: Record<string, number>;
  rendimientoPorSemestre: Array<{
    semestre: string;
    promedio: number;
    materias: number;
    creditos: number;
  }>;
}

export default function EstadisticasPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [estadisticas, setEstadisticas] = useState<EstadisticasDetalladas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPending) return;
    
    if (!session) {
      router.replace("/login");
      return;
    }

    const fetchEstadisticas = async () => {
      try {
        const response = await axios.get("/api/user/academico/estadisticas");
        setEstadisticas(response.data);
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEstadisticas();
  }, [session, isPending, router]);

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

  const getRendimientoColor = (promedio: number) => {
    if (promedio >= 16) return "text-green-300";
    if (promedio >= 14) return "text-yellow-300";
    return "text-red-300";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (!estadisticas) {
    return (
      <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light flex items-center justify-center">
        <div className="text-white text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-white/30" />
          <h3 className="text-xl font-medium text-white mb-2">
            No hay datos disponibles
          </h3>
          <p className="text-white/70">
            Completa tu onboarding para ver estadísticas detalladas
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-special text-white mb-2 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-[#40C9A9]" />
            Estadísticas Académicas Detalladas
          </h1>
          <p className="text-white/70">
            Análisis completo de tu rendimiento y progreso académico
          </p>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Promedio General
              </CardTitle>
              <Star className="h-4 w-4 text-[#40C9A9]" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getRendimientoColor(estadisticas.promedioGeneral)}`}>
                {estadisticas.promedioGeneral.toFixed(2)}
              </div>
              <p className="text-xs text-white/70 mt-1">
                {estadisticas.materiasAprobadas} materias evaluadas
              </p>
            </CardContent>
          </Card>

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
                Total Materias
              </CardTitle>
              <BookOpen className="h-4 w-4 text-[#40C9A9]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {estadisticas.totalMaterias}
              </div>
              <p className="text-xs text-white/70 mt-1">
                {estadisticas.materiasEnCurso} cursando
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs para diferentes análisis */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-[#354B3A] border-white/10">
            <TabsTrigger value="general" className="text-white data-[state=active]:bg-[#40C9A9] data-[state=active]:text-white">
              General
            </TabsTrigger>
            <TabsTrigger value="semestral" className="text-white data-[state=active]:bg-[#40C9A9] data-[state=active]:text-white">
              Por Semestre
            </TabsTrigger>
            <TabsTrigger value="estados" className="text-white data-[state=active]:bg-[#40C9A9] data-[state=active]:text-white">
              Estados
            </TabsTrigger>
            <TabsTrigger value="rendimiento" className="text-white data-[state=active]:bg-[#40C9A9] data-[state=active]:text-white">
              Rendimiento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#354B3A] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-[#40C9A9]" />
                    Distribución por Estado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-white/70">Aprobadas</span>
                      </div>
                      <span className="text-white font-medium">
                        {estadisticas.materiasAprobadas} ({((estadisticas.materiasAprobadas / estadisticas.totalMaterias) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-white/70">En Curso</span>
                      </div>
                      <span className="text-white font-medium">
                        {estadisticas.materiasEnCurso} ({((estadisticas.materiasEnCurso / estadisticas.totalMaterias) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-white/70">Aplazadas</span>
                      </div>
                      <span className="text-white font-medium">
                        {estadisticas.materiasAplazadas} ({((estadisticas.materiasAplazadas / estadisticas.totalMaterias) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-white/70">Retiradas</span>
                      </div>
                      <span className="text-white font-medium">
                        {estadisticas.materiasRetiradas} ({((estadisticas.materiasRetiradas / estadisticas.totalMaterias) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#354B3A] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#40C9A9]" />
                    Progreso de Créditos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Aprobados</span>
                      <span className="text-white font-medium">
                        {estadisticas.creditosAprobados}
                      </span>
                    </div>
                    <Progress 
                      value={(estadisticas.creditosAprobados / (estadisticas.creditosAprobados + estadisticas.creditosEnCurso)) * 100} 
                      className="h-2"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">En Curso</span>
                      <span className="text-white font-medium">
                        {estadisticas.creditosEnCurso}
                      </span>
                    </div>
                    <Progress 
                      value={(estadisticas.creditosEnCurso / (estadisticas.creditosAprobados + estadisticas.creditosEnCurso)) * 100} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="semestral" className="space-y-6">
            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#40C9A9]" />
                  Rendimiento por Semestre
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {estadisticas.rendimientoPorSemestre.map((semestre) => (
                    <div
                      key={semestre.semestre}
                      className="p-4 bg-[#1C2D20] rounded-lg border border-white/5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-medium">
                          {semestre.semestre}
                        </h4>
                        <Badge className="bg-[#40C9A9]/10 text-[#40C9A9] border-[#40C9A9]/20">
                          {semestre.materias} materias
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-white/70">Promedio:</span>
                          <div className={`font-medium ${getRendimientoColor(semestre.promedio)}`}>
                            {semestre.promedio.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <span className="text-white/70">Créditos:</span>
                          <div className="text-white font-medium">
                            {semestre.creditos}
                          </div>
                        </div>
                        <div>
                          <span className="text-white/70">Estado:</span>
                          <div className="text-white font-medium">
                            {semestre.promedio >= 16 ? "Excelente" : 
                             semestre.promedio >= 14 ? "Bueno" : "Necesita Mejorar"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estados" className="space-y-6">
            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#40C9A9]" />
                  Análisis de Estados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(estadisticas.materiasPorEstado).map(([estado, cantidad]) => (
                    <div
                      key={estado}
                      className="p-4 bg-[#1C2D20] rounded-lg border border-white/5"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getEstadoColor(estado)}>
                          {estado}
                        </Badge>
                        <span className="text-white font-medium text-lg">
                          {cantidad}
                        </span>
                      </div>
                      <Progress 
                        value={(cantidad / estadisticas.totalMaterias) * 100} 
                        className="h-2"
                      />
                      <p className="text-xs text-white/70 mt-2">
                        {((cantidad / estadisticas.totalMaterias) * 100).toFixed(1)}% del total
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rendimiento" className="space-y-6">
            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#40C9A9]" />
                  Análisis de Rendimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-[#1C2D20] rounded-lg border border-white/5">
                      <div className="text-2xl font-bold text-green-300 mb-1">
                        {estadisticas.promedioGeneral >= 16 ? "Excelente" : 
                         estadisticas.promedioGeneral >= 14 ? "Bueno" : "Necesita Mejorar"}
                      </div>
                      <p className="text-white/70 text-sm">Nivel de Rendimiento</p>
                    </div>
                    <div className="text-center p-4 bg-[#1C2D20] rounded-lg border border-white/5">
                      <div className="text-2xl font-bold text-white mb-1">
                        {estadisticas.progresoCarrera.toFixed(1)}%
                      </div>
                      <p className="text-white/70 text-sm">Progreso de Carrera</p>
                    </div>
                    <div className="text-center p-4 bg-[#1C2D20] rounded-lg border border-white/5">
                      <div className="text-2xl font-bold text-white mb-1">
                        {estadisticas.creditosAprobados}
                      </div>
                      <p className="text-white/70 text-sm">Créditos Completados</p>
                    </div>
                  </div>

                  <div className="p-4 bg-[#1C2D20] rounded-lg border border-white/5">
                    <h4 className="text-white font-medium mb-3">Recomendaciones</h4>
                    <div className="space-y-2 text-sm text-white/70">
                      {estadisticas.promedioGeneral < 14 && (
                        <p>• Considera revisar tus métodos de estudio y buscar apoyo académico</p>
                      )}
                      {estadisticas.materiasAplazadas > 0 && (
                        <p>• Enfócate en recuperar las materias aplazadas en el próximo semestre</p>
                      )}
                      {estadisticas.progresoCarrera < 50 && (
                        <p>• Mantén un ritmo constante para completar tu carrera a tiempo</p>
                      )}
                      {estadisticas.promedioGeneral >= 16 && (
                        <p>• ¡Excelente rendimiento! Mantén este nivel de dedicación</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 