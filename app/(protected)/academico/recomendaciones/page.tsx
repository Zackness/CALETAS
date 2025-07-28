"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  Star,
  Target,
  Clock,
  Award
} from "lucide-react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

interface Materia {
  id: string;
  codigo: string;
  nombre: string;
  creditos: number;
  semestre: string;
  horasTeoria: number;
  horasPractica: number;
}

interface Recomendacion {
  tipo: string;
  titulo: string;
  descripcion: string;
  materias: Materia[];
  prioridad: string;
}

interface Estadisticas {
  totalMateriasCarrera: number;
  materiasCursadas: number;
  materiasAprobadas: number;
  materiasEnCurso: number;
  progreso: number;
  materiasDisponibles: number;
}

export default function RecomendacionesPage() {
  const { data: session, status } = useSession();
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [proximoSemestre, setProximoSemestre] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      redirect("/auth/signin");
    }

    const fetchRecomendaciones = async () => {
      try {
        const response = await axios.get("/api/user/academico/recomendaciones");
        setRecomendaciones(response.data.recomendaciones);
        setEstadisticas(response.data.estadisticas);
        setProximoSemestre(response.data.proximoSemestre);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecomendaciones();
  }, [session, status]);

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case "alta":
        return "bg-red-500/10 text-red-300 border-red-500/20";
      case "media":
        return "bg-yellow-500/10 text-yellow-300 border-yellow-500/20";
      case "baja":
        return "bg-blue-500/10 text-blue-300 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-300 border-gray-500/20";
    }
  };

  const getPrioridadIcon = (prioridad: string) => {
    switch (prioridad) {
      case "alta":
        return <Star className="w-4 h-4" />;
      case "media":
        return <Target className="w-4 h-4" />;
      case "baja":
        return <Clock className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Generando recomendaciones...</p>
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
            <Lightbulb className="w-8 h-8 text-[#40C9A9]" />
            Recomendaciones Académicas
          </h1>
          <p className="text-white/70">
            Descubre las mejores materias para tu próximo semestre
          </p>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/70">
                  Progreso de Carrera
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-[#40C9A9]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {estadisticas.progreso.toFixed(1)}%
                </div>
                <p className="text-xs text-white/70 mt-1">
                  {estadisticas.materiasCursadas} de {estadisticas.totalMateriasCarrera} materias
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/70">
                  Materias Disponibles
                </CardTitle>
                <BookOpen className="h-4 w-4 text-[#40C9A9]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {estadisticas.materiasDisponibles}
                </div>
                <p className="text-xs text-white/70 mt-1">
                  Para cursar próximamente
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/70">
                  Materias Aprobadas
                </CardTitle>
                <Award className="h-4 w-4 text-[#40C9A9]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {estadisticas.materiasAprobadas}
                </div>
                <p className="text-xs text-white/70 mt-1">
                  Completadas exitosamente
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/70">
                  En Curso
                </CardTitle>
                <Clock className="h-4 w-4 text-[#40C9A9]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {estadisticas.materiasEnCurso}
                </div>
                <p className="text-xs text-white/70 mt-1">
                  Cursando actualmente
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Próximo Semestre */}
        {proximoSemestre && (
          <Card className="bg-[#354B3A] border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#40C9A9]" />
                Próximo Semestre Recomendado: {proximoSemestre}
              </CardTitle>
              <CardDescription className="text-white/70">
                Basado en tu progreso actual y los prerrequisitos cumplidos
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Recomendaciones */}
        <div className="space-y-6">
          {recomendaciones.map((recomendacion, index) => (
            <Card key={index} className="bg-[#354B3A] border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getPrioridadIcon(recomendacion.prioridad)}
                    <CardTitle className="text-white">
                      {recomendacion.titulo}
                    </CardTitle>
                    <Badge className={getPrioridadColor(recomendacion.prioridad)}>
                      {recomendacion.prioridad.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-white/70">
                  {recomendacion.descripcion}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recomendacion.materias.map((materia) => (
                    <div
                      key={materia.id}
                      className="p-4 bg-[#1C2D20] rounded-lg border border-white/5 hover:border-[#40C9A9]/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white text-sm">
                          {materia.codigo}
                        </span>
                        <Badge className="bg-[#40C9A9]/10 text-[#40C9A9] border-[#40C9A9]/20 text-xs">
                          {materia.semestre}
                        </Badge>
                      </div>
                      <h4 className="text-white font-medium mb-2">
                        {materia.nombre}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-white/60">
                        <span>{materia.creditos} créditos</span>
                        <span>{materia.horasTeoria}T + {materia.horasPractica}P</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {recomendacion.materias.length === 0 && (
                  <div className="text-center py-8 text-white/70">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-white/30" />
                    <p>No hay materias disponibles en esta categoría</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {recomendaciones.length === 0 && (
            <Card className="bg-[#354B3A] border-white/10">
              <CardContent className="text-center py-12">
                <Lightbulb className="w-16 h-16 mx-auto mb-4 text-white/30" />
                <h3 className="text-xl font-medium text-white mb-2">
                  ¡Excelente progreso!
                </h3>
                <p className="text-white/70 mb-4">
                  Has completado todas las materias disponibles para tu nivel actual.
                </p>
                <Button 
                  className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                  onClick={() => window.history.back()}
                >
                  Volver al Panel Académico
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Consejos */}
        <Card className="bg-[#354B3A] border-white/10 mt-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-[#40C9A9]" />
              Consejos para tu Planificación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#40C9A9] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-white/70 text-sm">
                    Prioriza las materias de <strong>alta prioridad</strong> para mantener un buen flujo académico
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#40C9A9] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-white/70 text-sm">
                    Considera tu carga académica y no sobrecargues tu horario
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#40C9A9] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-white/70 text-sm">
                    Las materias electivas te ayudan a especializarte en áreas de tu interés
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#40C9A9] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-white/70 text-sm">
                    Revisa los horarios y evita conflictos entre materias
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#40C9A9] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-white/70 text-sm">
                    Consulta con tu coordinador académico para confirmar tu plan de estudios
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#40C9A9] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-white/70 text-sm">
                    Mantén un balance entre materias teóricas y prácticas
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 