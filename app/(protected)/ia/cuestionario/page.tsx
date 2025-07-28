"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, BookOpen, Save, RotateCcw, CheckCircle, XCircle, Brain } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface Recurso {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  materia: {
    nombre: string;
  };
  autor: {
    id: string;
    name: string;
    email: string;
  };
  calificaciones: {
    calificacion: number;
  }[];
}

interface Pregunta {
  id: string;
  pregunta: string;
  opciones: string[];
  respuestaCorrecta: number;
  explicacion: string;
}

interface Cuestionario {
  id: string;
  titulo: string;
  descripcion: string;
  preguntas: Pregunta[];
  recursoId: string;
  createdAt: string;
}

export default function CuestionarioPage() {
  const { data: session } = useSession();
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [recursoSeleccionado, setRecursoSeleccionado] = useState<string>("");
  const [cuestionario, setCuestionario] = useState<Cuestionario | null>(null);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState<number[]>([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generando, setGenerando] = useState(false);

  // Cargar recursos del usuario (propios y favoritos)
  useEffect(() => {
    fetchRecursos();
  }, []);

  const fetchRecursos = async () => {
    try {
      const response = await fetch("/api/caletas/recursos");
      if (response.ok) {
        const data = await response.json();
        setRecursos(data.recursos);
      }
    } catch (error) {
      console.error("Error fetching recursos:", error);
      toast.error("Error al cargar los recursos");
    }
  };

  const generarCuestionario = async () => {
    if (!recursoSeleccionado) {
      toast.error("Por favor selecciona un recurso");
      return;
    }

    setGenerando(true);
    
    try {
      const response = await fetch("/api/ia/cuestionario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recursoId: recursoSeleccionado }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al generar el cuestionario");
      }

      const data = await response.json();
      const nuevoCuestionario: Cuestionario = {
        id: Date.now().toString(),
        titulo: "Cuestionario de " + data.recurso.titulo,
        descripcion: "Cuestionario generado por IA basado en el recurso seleccionado",
        recursoId: recursoSeleccionado,
        createdAt: new Date().toISOString(),
        preguntas: data.preguntas
      };

      setCuestionario(nuevoCuestionario);
      setPreguntaActual(0);
      setRespuestas(new Array(nuevoCuestionario.preguntas.length).fill(-1));
      setMostrarResultados(false);
      toast.success("¡Cuestionario generado exitosamente!");
    } catch (error) {
      console.error("Error generating cuestionario:", error);
      toast.error(error instanceof Error ? error.message : "Error al generar el cuestionario");
    } finally {
      setGenerando(false);
    }
  };

  const responderPregunta = (opcionIndex: number) => {
    const nuevasRespuestas = [...respuestas];
    nuevasRespuestas[preguntaActual] = opcionIndex;
    setRespuestas(nuevasRespuestas);
  };

  const siguientePregunta = () => {
    if (preguntaActual < (cuestionario?.preguntas.length || 0) - 1) {
      setPreguntaActual(preguntaActual + 1);
    } else {
      setMostrarResultados(true);
    }
  };

  const preguntaAnterior = () => {
    if (preguntaActual > 0) {
      setPreguntaActual(preguntaActual - 1);
    }
  };

  const reiniciarCuestionario = () => {
    setPreguntaActual(0);
    setRespuestas(new Array(cuestionario?.preguntas.length || 0).fill(-1));
    setMostrarResultados(false);
  };

  const guardarCuestionario = async () => {
    if (!cuestionario) return;

    setLoading(true);
    try {
      // Aquí iría la lógica para guardar en la base de datos
      setTimeout(() => {
        toast.success("Cuestionario guardado exitosamente");
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error saving cuestionario:", error);
      toast.error("Error al guardar el cuestionario");
      setLoading(false);
    }
  };

  const calcularPuntaje = () => {
    if (!cuestionario) return 0;
    let correctas = 0;
    cuestionario.preguntas.forEach((pregunta, index) => {
      if (respuestas[index] === pregunta.respuestaCorrecta) {
        correctas++;
      }
    });
    return Math.round((correctas / cuestionario.preguntas.length) * 100);
  };

  const getTipoRecurso = (recurso: Recurso) => {
    if (recurso.autor.id === session?.user?.id) {
      return { tipo: "propio", label: "Mi Recurso", color: "bg-green-500/10 text-green-300 border-green-500/20" };
    }
    if (recurso.calificaciones.length > 0 && recurso.calificaciones[0].calificacion >= 4) {
      return { tipo: "favorito", label: "Favorito", color: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20" };
    }
    return { tipo: "publico", label: "Público", color: "bg-blue-500/10 text-blue-300 border-blue-500/20" };
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-special text-white mb-2">
            Cuestionarios IA
          </h1>
          <p className="text-white/70">
            Genera cuestionarios personalizados basados en tus recursos y caletas favoritas
          </p>
        </div>

        {!cuestionario ? (
          /* Selección de Recurso */
          <Card className="bg-[#354B3A] border-white/10 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#40C9A9]" />
                Generar Cuestionario
              </CardTitle>
              <CardDescription className="text-white/70">
                Selecciona un recurso para generar un cuestionario personalizado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-white font-medium">Seleccionar Recurso</label>
                <Select value={recursoSeleccionado} onValueChange={setRecursoSeleccionado}>
                  <SelectTrigger className="bg-[#1C2D20] border-white/10 text-white">
                    <SelectValue placeholder="Elige un recurso de tus caletas" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1C2D20] border-white/10">
                    {recursos.map((recurso) => {
                      const tipoRecurso = getTipoRecurso(recurso);
                      return (
                        <SelectItem key={recurso.id} value={recurso.id} className="text-white">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{recurso.titulo}</span>
                              <Badge className={`text-xs ${tipoRecurso.color}`}>
                                {tipoRecurso.label}
                              </Badge>
                            </div>
                            <span className="text-sm text-white/70">{recurso.materia.nombre}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={generarCuestionario}
                className="w-full bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                disabled={!recursoSeleccionado || generando}
              >
                {generando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generando Cuestionario...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Generar Cuestionario
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Cuestionario */
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header del Cuestionario */}
            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">{cuestionario.titulo}</CardTitle>
                    <CardDescription className="text-white/70">
                      Pregunta {preguntaActual + 1} de {cuestionario.preguntas.length}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={reiniciarCuestionario}
                      className="border-[#40C9A9] text-[#40C9A9] hover:bg-[#40C9A9] hover:text-white"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Reiniciar
                    </Button>
                    <Button
                      size="sm"
                      onClick={guardarCuestionario}
                      disabled={loading}
                      className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      {loading ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {!mostrarResultados ? (
              /* Pregunta Actual */
              <Card className="bg-[#354B3A] border-white/10">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-white text-lg font-medium mb-4">
                        {cuestionario.preguntas[preguntaActual].pregunta}
                      </h3>
                      <div className="space-y-3">
                        {cuestionario.preguntas[preguntaActual].opciones.map((opcion, index) => (
                          <button
                            key={index}
                            onClick={() => responderPregunta(index)}
                            className={`w-full p-4 text-left rounded-lg border transition-colors ${
                              respuestas[preguntaActual] === index
                                ? "bg-[#40C9A9] text-white border-[#40C9A9]"
                                : "bg-[#1C2D20] text-white border-white/10 hover:bg-[#203324]"
                            }`}
                          >
                            <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                            {opcion}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={preguntaAnterior}
                        disabled={preguntaActual === 0}
                        className="border-[#40C9A9] text-[#40C9A9] hover:bg-[#40C9A9] hover:text-white"
                      >
                        Anterior
                      </Button>
                      <Button
                        onClick={siguientePregunta}
                        disabled={respuestas[preguntaActual] === -1}
                        className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                      >
                        {preguntaActual === cuestionario.preguntas.length - 1 ? "Ver Resultados" : "Siguiente"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Resultados */
              <Card className="bg-[#354B3A] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-[#40C9A9]" />
                    Resultados del Cuestionario
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Puntaje */}
                  <div className="text-center">
                    <div className="text-4xl font-bold text-[#40C9A9] mb-2">
                      {calcularPuntaje()}%
                    </div>
                    <p className="text-white/70">
                      {calcularPuntaje() >= 80 ? "¡Excelente trabajo!" : 
                       calcularPuntaje() >= 60 ? "Buen trabajo, sigue estudiando" : 
                       "Necesitas repasar más el material"}
                    </p>
                  </div>

                  {/* Revisión de Preguntas */}
                  <div className="space-y-4">
                    {cuestionario.preguntas.map((pregunta, index) => (
                      <div key={pregunta.id} className="bg-[#1C2D20] rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-3">
                          {respuestas[index] === pregunta.respuestaCorrecta ? (
                            <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-white font-medium mb-2">
                              Pregunta {index + 1}: {pregunta.pregunta}
                            </p>
                            <div className="space-y-1">
                              {pregunta.opciones.map((opcion, opcionIndex) => (
                                <div
                                  key={opcionIndex}
                                  className={`text-sm ${
                                    opcionIndex === pregunta.respuestaCorrecta
                                      ? "text-green-400 font-medium"
                                      : opcionIndex === respuestas[index] && opcionIndex !== pregunta.respuestaCorrecta
                                      ? "text-red-400 line-through"
                                      : "text-white/70"
                                  }`}
                                >
                                  {String.fromCharCode(65 + opcionIndex)}. {opcion}
                                </div>
                              ))}
                            </div>
                            <p className="text-white/60 text-sm mt-2">
                              <strong>Explicación:</strong> {pregunta.explicacion}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      onClick={reiniciarCuestionario}
                      className="border-[#40C9A9] text-[#40C9A9] hover:bg-[#40C9A9] hover:text-white"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Hacer Otro Cuestionario
                    </Button>
                    <Button
                      onClick={guardarCuestionario}
                      disabled={loading}
                      className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      {loading ? "Guardando..." : "Guardar Cuestionario"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 