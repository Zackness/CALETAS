"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Brain, FileText, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useSubscriptionRequired } from "@/hooks/use-subscription-required";

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

interface Ficha {
  id: string;
  concepto: string;
  definicion: string;
  ejemplos: string[];
  puntosClave: string[];
  recursoId: string;
}

export default function FichasIA() {
  const { loading: subLoading, isActive } = useSubscriptionRequired();
  const { data: session } = authClient.useSession();
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [recursoSeleccionado, setRecursoSeleccionado] = useState<string>("");
  const [fichas, setFichas] = useState<Ficha[] | null>(null);
  const [generando, setGenerando] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const generarFichas = async () => {
    if (subLoading || !isActive) {
      toast.error("Necesitas una suscripción para usar IA");
      return;
    }
    if (!recursoSeleccionado) {
      toast.error("Por favor selecciona un recurso");
      return;
    }

    setGenerando(true);
    
    try {
      const response = await fetch("/api/ia/fichas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recursoId: recursoSeleccionado }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al generar las fichas");
      }

      const data = await response.json();
      setFichas(data.fichas);
      toast.success("¡Fichas de estudio generadas exitosamente!");
    } catch (error) {
      console.error("Error generating fichas:", error);
      toast.error(error instanceof Error ? error.message : "Error al generar las fichas");
    } finally {
      setGenerando(false);
    }
  };

  const guardarFichas = async () => {
    if (!fichas) return;

    setLoading(true);
    try {
      // Aquí iría la lógica para guardar en la base de datos
      setTimeout(() => {
        toast.success("Fichas guardadas exitosamente");
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error saving fichas:", error);
      toast.error("Error al guardar las fichas");
      setLoading(false);
    }
  };

  const reiniciar = () => {
    setFichas(null);
    setRecursoSeleccionado("");
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
            Fichas de Estudio IA
          </h1>
          <p className="text-white/70">
            Genera fichas de estudio personalizadas basadas en tus recursos y caletas favoritas
          </p>
        </div>

        {!fichas ? (
          /* Selección de Recurso */
          <Card className="bg-[#354B3A] border-white/10 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#40C9A9]" />
                Generar Fichas de Estudio
              </CardTitle>
              <CardDescription className="text-white/70">
                Selecciona un recurso para generar fichas de estudio personalizadas
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
                onClick={generarFichas}
                className="w-full bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                disabled={!recursoSeleccionado || generando}
            >
                {generando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generando Fichas...
                  </>
              ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Generar Fichas de Estudio
                  </>
              )}
            </Button>
            </CardContent>
          </Card>
        ) : (
          /* Fichas Generadas */
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header de las Fichas */}
            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Fichas de Estudio Generadas</CardTitle>
                    <CardDescription className="text-white/70">
                      {fichas.length} fichas basadas en tu recurso
                    </CardDescription>
                </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={reiniciar}
                      className="border-[#40C9A9] text-[#40C9A9] hover:bg-[#40C9A9] hover:text-white"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Generar Nuevas
                    </Button>
                    <Button
                      size="sm"
                      onClick={guardarFichas}
                      disabled={loading}
                      className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      {loading ? "Guardando..." : "Guardar Fichas"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Lista de Fichas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {fichas.map((ficha, index) => (
                <Card key={ficha.id} className="bg-[#354B3A] border-white/10">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#40C9A9]" />
                      <CardTitle className="text-white">Ficha {index + 1}: {ficha.concepto}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Definición */}
                    <div>
                      <h4 className="text-white font-medium mb-2">Definición</h4>
                      <p className="text-white/80 text-sm leading-relaxed">{ficha.definicion}</p>
                    </div>

                    {/* Ejemplos */}
                    <div>
                      <h4 className="text-white font-medium mb-2">Ejemplos</h4>
                      <ul className="space-y-1">
                        {ficha.ejemplos.map((ejemplo, idx) => (
                          <li key={idx} className="text-white/70 text-sm flex items-start gap-2">
                            <span className="text-[#40C9A9] mt-1">•</span>
                            {ejemplo}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Puntos Clave */}
                    <div>
                      <h4 className="text-white font-medium mb-2">Puntos Clave</h4>
                      <div className="space-y-1">
                        {ficha.puntosClave.map((punto, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-[#1C2D20] text-white/80 border-white/10 mr-1 mb-1">
                            {punto}
                          </Badge>
                        ))}
                      </div>
              </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 