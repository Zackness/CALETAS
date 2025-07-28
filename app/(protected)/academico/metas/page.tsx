"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Award,
  BookOpen,
  GraduationCap,
  BarChart3,
  Lightbulb,
  CalendarDays,
  BookMarked
} from "lucide-react";
import { toast } from "sonner";

interface MetaAcademica {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: string;
  valorObjetivo: number;
  valorActual: number;
  fechaLimite: string | null;
  completada: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Materia {
  id: string;
  codigo: string;
  nombre: string;
  semestre: string;
}

export default function MetasAcademicasPage() {
  const [metas, setMetas] = useState<MetaAcademica[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState<MetaAcademica | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    tipo: "",
    valorObjetivo: 0,
    valorActual: 0,
    fechaLimite: "",
    materiaId: ""
  });

  // Fetch metas and materias
  useEffect(() => {
    fetchMetas();
    fetchMaterias();
  }, []);

  const fetchMetas = async () => {
    try {
      const response = await fetch("/api/user/academico/metas");
      if (response.ok) {
        const data = await response.json();
        setMetas(data.metas);
      }
    } catch (error) {
      console.error("Error fetching metas:", error);
      toast.error("Error al cargar las metas");
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterias = async () => {
    try {
      const response = await fetch("/api/user/academico/materias");
      if (response.ok) {
        const data = await response.json();
        setMaterias(data.materias);
      }
    } catch (error) {
      console.error("Error fetching materias:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: "",
      descripcion: "",
      tipo: "",
      valorObjetivo: 0,
      valorActual: 0,
      fechaLimite: "",
      materiaId: ""
    });
    setEditingMeta(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Enviando datos de meta:", formData);
    
    try {
      const url = editingMeta 
        ? `/api/user/academico/metas/${editingMeta.id}`
        : "/api/user/academico/metas";
      
      const method = editingMeta ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingMeta 
            ? "Meta actualizada exitosamente" 
            : "Meta creada exitosamente"
        );
        setIsDialogOpen(false);
        resetForm();
        fetchMetas();
      } else {
        const error = await response.json();
        console.error("Error response:", error);
        toast.error(error.error || error.message || "Error al guardar la meta");
      }
    } catch (error) {
      console.error("Error saving meta:", error);
      toast.error("Error al guardar la meta");
    }
  };

  const handleEdit = (meta: MetaAcademica) => {
    setEditingMeta(meta);
    setFormData({
      titulo: meta.titulo,
      descripcion: meta.descripcion || "",
      tipo: meta.tipo,
      valorObjetivo: meta.valorObjetivo,
      valorActual: meta.valorActual,
      fechaLimite: meta.fechaLimite ? meta.fechaLimite.split('T')[0] : "",
      materiaId: ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (metaId: string) => {
    try {
      const response = await fetch(`/api/user/academico/metas/${metaId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Meta eliminada exitosamente");
        fetchMetas();
      } else {
        toast.error("Error al eliminar la meta");
      }
    } catch (error) {
      console.error("Error deleting meta:", error);
      toast.error("Error al eliminar la meta");
    }
  };

  const handleToggleComplete = async (meta: MetaAcademica) => {
    try {
      const response = await fetch(`/api/user/academico/metas/${meta.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          completada: !meta.completada,
        }),
      });

      if (response.ok) {
        toast.success(
          meta.completada 
            ? "Meta marcada como pendiente" 
            : "¡Meta completada! ¡Felicidades!"
        );
        fetchMetas();
      } else {
        toast.error("Error al actualizar la meta");
      }
    } catch (error) {
      console.error("Error updating meta:", error);
      toast.error("Error al actualizar la meta");
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
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
        return <Target className="w-4 h-4" />;
    }
  };

  const getTipoNombre = (tipo: string) => {
    switch (tipo) {
      case "PROMEDIO_GENERAL":
        return "Promedio General";
      case "MATERIAS_APROBADAS":
        return "Materias Aprobadas";
      case "CREDITOS_COMPLETADOS":
        return "Créditos Completados";
      case "SEMESTRE_ESPECIFICO":
        return "Semestre Específico";
      case "MATERIA_ESPECIFICA":
        return "Materia Específica";
      case "HORAS_ESTUDIO":
        return "Horas de Estudio";
      default:
        return tipo;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "PROMEDIO_GENERAL":
        return "bg-blue-500/10 text-blue-300 border-blue-500/20";
      case "MATERIAS_APROBADAS":
        return "bg-green-500/10 text-green-300 border-green-500/20";
      case "CREDITOS_COMPLETADOS":
        return "bg-purple-500/10 text-purple-300 border-purple-500/20";
      case "SEMESTRE_ESPECIFICO":
        return "bg-orange-500/10 text-orange-300 border-orange-500/20";
      case "MATERIA_ESPECIFICA":
        return "bg-pink-500/10 text-pink-300 border-pink-500/20";
      case "HORAS_ESTUDIO":
        return "bg-cyan-500/10 text-cyan-300 border-cyan-500/20";
      default:
        return "bg-gray-500/10 text-gray-300 border-gray-500/20";
    }
  };

  const metasActivas = metas.filter(meta => !meta.completada);
  const metasCompletadas = metas.filter(meta => meta.completada);
  const progresoGeneral = metas.length > 0 
    ? (metasCompletadas.length / metas.length) * 100 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Cargando metas académicas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-special text-white mb-2">
                Metas Académicas
              </h1>
              <p className="text-white/70">
                Establece y da seguimiento a tus objetivos académicos
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Meta
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#354B3A] border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle>
                    {editingMeta ? "Editar Meta" : "Crear Nueva Meta"}
                  </DialogTitle>
                  <DialogDescription className="text-white/70">
                    {editingMeta 
                      ? "Modifica los detalles de tu meta académica"
                      : "Define un nuevo objetivo para tu progreso académico"
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="titulo" className="text-white">Título de la Meta</Label>
                    <Input
                      id="titulo"
                      value={formData.titulo}
                      onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                      className="bg-[#1C2D20] border-white/20 text-white"
                      placeholder="Ej: Alcanzar promedio de 18 puntos"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="descripcion" className="text-white">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                      className="bg-[#1C2D20] border-white/20 text-white"
                      placeholder="Describe tu meta en detalle..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tipo" className="text-white">Tipo de Meta</Label>
                    <Select 
                      value={formData.tipo} 
                      onValueChange={(value) => setFormData({...formData, tipo: value})}
                      required
                    >
                      <SelectTrigger className="bg-[#1C2D20] border-white/20 text-white">
                        <SelectValue placeholder="Selecciona el tipo de meta" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#354B3A] border-white/10">
                        <SelectItem value="PROMEDIO_GENERAL">Promedio General</SelectItem>
                        <SelectItem value="MATERIAS_APROBADAS">Materias Aprobadas</SelectItem>
                        <SelectItem value="CREDITOS_COMPLETADOS">Créditos Completados</SelectItem>
                        <SelectItem value="SEMESTRE_ESPECIFICO">Semestre Específico</SelectItem>
                        <SelectItem value="MATERIA_ESPECIFICA">Materia Específica</SelectItem>
                        <SelectItem value="HORAS_ESTUDIO">Horas de Estudio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tipo" className="text-white">Tipo de Meta</Label>
                      <Select 
                        value={formData.tipo} 
                        onValueChange={(value) => setFormData({...formData, tipo: value})}
                        required
                      >
                        <SelectTrigger className="bg-[#1C2D20] border-white/20 text-white">
                          <SelectValue placeholder="Selecciona el tipo de meta" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#354B3A] border-white/10">
                          <SelectItem value="PROMEDIO_GENERAL">📊 Promedio General</SelectItem>
                          <SelectItem value="MATERIAS_APROBADAS">📚 Materias Aprobadas</SelectItem>
                          <SelectItem value="CREDITOS_COMPLETADOS">🎓 Créditos Completados</SelectItem>
                          <SelectItem value="SEMESTRE_ESPECIFICO">📅 Semestre Específico</SelectItem>
                          <SelectItem value="MATERIA_ESPECIFICA">📖 Materia Específica</SelectItem>
                          <SelectItem value="HORAS_ESTUDIO">⏰ Horas de Estudio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Explicación dinámica según el tipo */}
                    {formData.tipo && (
                      <div className="p-3 bg-[#1C2D20] rounded-lg border border-[#40C9A9]/20">
                        <h4 className="text-[#40C9A9] font-medium mb-2">
                          {getTipoNombre(formData.tipo)} - ¿Cómo funciona?
                        </h4>
                        <p className="text-white/70 text-sm">
                          {formData.tipo === "PROMEDIO_GENERAL" && 
                            "Establece tu meta de promedio general. Ej: Objetivo = 18.0, Actual = 16.5"
                          }
                          {formData.tipo === "MATERIAS_APROBADAS" && 
                            "Define cuántas materias quieres aprobar. Ej: Objetivo = 10, Actual = 7 (ya aprobadas)"
                          }
                          {formData.tipo === "CREDITOS_COMPLETADOS" && 
                            "Establece tu meta de créditos. Ej: Objetivo = 50, Actual = 35 (créditos completados)"
                          }
                          {formData.tipo === "SEMESTRE_ESPECIFICO" && 
                            "Define hasta qué semestre quieres llegar. Ej: Objetivo = 8, Actual = 6 (semestre actual)"
                          }
                          {formData.tipo === "MATERIA_ESPECIFICA" && 
                            "Selecciona una materia específica que quieres aprobar. Ej: Objetivo = 1, Actual = 0 (no aprobada)"
                          }
                          {formData.tipo === "HORAS_ESTUDIO" && 
                            "Define tus horas de estudio semanales. Ej: Objetivo = 20, Actual = 15 (horas esta semana)"
                          }
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="valorObjetivo" className="text-white">
                          {formData.tipo === "PROMEDIO_GENERAL" && "Promedio Objetivo"}
                          {formData.tipo === "MATERIAS_APROBADAS" && "Materias a Aprobar"}
                          {formData.tipo === "CREDITOS_COMPLETADOS" && "Créditos Objetivo"}
                          {formData.tipo === "SEMESTRE_ESPECIFICO" && "Semestre Objetivo"}
                          {formData.tipo === "MATERIA_ESPECIFICA" && "Aprobar Materia"}
                          {formData.tipo === "HORAS_ESTUDIO" && "Horas Objetivo"}
                          {!formData.tipo && "Valor Objetivo"}
                        </Label>
                        <Input
                          id="valorObjetivo"
                          type="number"
                          step={formData.tipo === "PROMEDIO_GENERAL" ? "0.1" : "1"}
                          min={formData.tipo === "PROMEDIO_GENERAL" ? "0" : "1"}
                          max={formData.tipo === "PROMEDIO_GENERAL" ? "20" : formData.tipo === "SEMESTRE_ESPECIFICO" ? "10" : "999"}
                          value={formData.valorObjetivo}
                          onChange={(e) => setFormData({...formData, valorObjetivo: parseFloat(e.target.value)})}
                          className="bg-[#1C2D20] border-white/20 text-white"
                          placeholder={
                            formData.tipo === "PROMEDIO_GENERAL" ? "18.0" :
                            formData.tipo === "MATERIAS_APROBADAS" ? "10" :
                            formData.tipo === "CREDITOS_COMPLETADOS" ? "50" :
                            formData.tipo === "SEMESTRE_ESPECIFICO" ? "8" :
                            formData.tipo === "MATERIA_ESPECIFICA" ? "1" :
                            formData.tipo === "HORAS_ESTUDIO" ? "20" : "0"
                          }
                          required
                        />
                        <p className="text-white/50 text-xs mt-1">
                          {formData.tipo === "PROMEDIO_GENERAL" && "Ej: 18.0 (escala 0-20)"}
                          {formData.tipo === "MATERIAS_APROBADAS" && "Ej: 10 materias"}
                          {formData.tipo === "CREDITOS_COMPLETADOS" && "Ej: 50 créditos"}
                          {formData.tipo === "SEMESTRE_ESPECIFICO" && "Ej: 8 (semestre final)"}
                          {formData.tipo === "MATERIA_ESPECIFICA" && "Siempre 1 (aprobar la materia)"}
                          {formData.tipo === "HORAS_ESTUDIO" && "Ej: 20 horas por semana"}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="valorActual" className="text-white">
                          {formData.tipo === "PROMEDIO_GENERAL" && "Promedio Actual"}
                          {formData.tipo === "MATERIAS_APROBADAS" && "Materias Aprobadas"}
                          {formData.tipo === "CREDITOS_COMPLETADOS" && "Créditos Actuales"}
                          {formData.tipo === "SEMESTRE_ESPECIFICO" && "Semestre Actual"}
                          {formData.tipo === "MATERIA_ESPECIFICA" && "Estado Actual"}
                          {formData.tipo === "HORAS_ESTUDIO" && "Horas Actuales"}
                          {!formData.tipo && "Valor Actual"}
                        </Label>
                        <Input
                          id="valorActual"
                          type="number"
                          step={formData.tipo === "PROMEDIO_GENERAL" ? "0.1" : "1"}
                          min="0"
                          max={formData.tipo === "PROMEDIO_GENERAL" ? "20" : formData.tipo === "SEMESTRE_ESPECIFICO" ? "10" : "999"}
                          value={formData.valorActual}
                          onChange={(e) => setFormData({...formData, valorActual: parseFloat(e.target.value)})}
                          className="bg-[#1C2D20] border-white/20 text-white"
                          placeholder={
                            formData.tipo === "PROMEDIO_GENERAL" ? "16.5" :
                            formData.tipo === "MATERIAS_APROBADAS" ? "7" :
                            formData.tipo === "CREDITOS_COMPLETADOS" ? "35" :
                            formData.tipo === "SEMESTRE_ESPECIFICO" ? "6" :
                            formData.tipo === "MATERIA_ESPECIFICA" ? "0" :
                            formData.tipo === "HORAS_ESTUDIO" ? "15" : "0"
                          }
                          required
                        />
                        <p className="text-white/50 text-xs mt-1">
                          {formData.tipo === "PROMEDIO_GENERAL" && "Tu promedio actual"}
                          {formData.tipo === "MATERIAS_APROBADAS" && "Materias que ya aprobaste"}
                          {formData.tipo === "CREDITOS_COMPLETADOS" && "Créditos que ya tienes"}
                          {formData.tipo === "SEMESTRE_ESPECIFICO" && "Semestre en el que estás"}
                          {formData.tipo === "MATERIA_ESPECIFICA" && "0 = No aprobada, 1 = Aprobada"}
                          {formData.tipo === "HORAS_ESTUDIO" && "Horas estudiadas esta semana"}
                        </p>
                      </div>
                    </div>

                    {/* Selector de materia para materia específica */}
                    {formData.tipo === "MATERIA_ESPECIFICA" && (
                      <div>
                        <Label htmlFor="materiaId" className="text-white">Seleccionar Materia</Label>
                        <Select 
                          value={formData.materiaId} 
                          onValueChange={(value) => setFormData({...formData, materiaId: value})}
                          required
                        >
                          <SelectTrigger className="bg-[#1C2D20] border-white/20 text-white">
                            <SelectValue placeholder="Selecciona la materia que quieres aprobar" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#354B3A] border-white/10">
                            {materias.map((materia) => (
                              <SelectItem key={materia.id} value={materia.id}>
                                {materia.codigo} - {materia.nombre} (S{materia.semestre})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-white/50 text-xs mt-1">
                          Selecciona la materia específica que quieres aprobar
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="fechaLimite" className="text-white">Fecha Límite (Opcional)</Label>
                    <Input
                      id="fechaLimite"
                      type="date"
                      value={formData.fechaLimite}
                      onChange={(e) => setFormData({...formData, fechaLimite: e.target.value})}
                      className="bg-[#1C2D20] border-white/20 text-white"
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                    >
                      {editingMeta ? "Actualizar" : "Crear"} Meta
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Guía de uso */}
        <Card className="bg-[#354B3A] border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-[#40C9A9]" />
              ¿Cómo funcionan las Metas Académicas?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-[#40C9A9] font-medium">📊 Tipos de Metas:</h4>
                <ul className="text-white/70 text-sm space-y-2">
                  <li><strong>Promedio General:</strong> Establece tu meta de calificación (ej: 18.0 puntos)</li>
                  <li><strong>Materias Aprobadas:</strong> Define cuántas materias quieres aprobar (ej: 10 materias)</li>
                  <li><strong>Créditos Completados:</strong> Establece tu meta de créditos (ej: 50 créditos)</li>
                  <li><strong>Semestre Específico:</strong> Define hasta qué semestre llegar (ej: semestre 8)</li>
                  <li><strong>Materia Específica:</strong> Selecciona una materia particular para aprobar</li>
                  <li><strong>Horas de Estudio:</strong> Define tus horas semanales de estudio (ej: 20 horas)</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="text-[#40C9A9] font-medium">🎯 Cómo establecer metas:</h4>
                <ul className="text-white/70 text-sm space-y-2">
                  <li><strong>Valor Objetivo:</strong> Es tu meta final (lo que quieres alcanzar)</li>
                  <li><strong>Valor Actual:</strong> Es tu progreso actual (donde estás ahora)</li>
                  <li><strong>Progreso:</strong> Se calcula automáticamente y se muestra visualmente</li>
                  <li><strong>Fecha Límite:</strong> Opcional, para establecer un plazo</li>
                </ul>
                <div className="p-3 bg-[#1C2D20] rounded-lg">
                  <p className="text-white text-sm">
                    <strong>Ejemplo:</strong> Si quieres alcanzar un promedio de 18.0 y actualmente tienes 16.5:
                    <br />
                    • <strong>Objetivo:</strong> 18.0 puntos
                    <br />
                    • <strong>Actual:</strong> 16.5 puntos
                    <br />
                    • <strong>Progreso:</strong> 91.7% completado
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Total de Metas
              </CardTitle>
              <Target className="h-4 w-4 text-[#40C9A9]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metas.length}</div>
              <p className="text-xs text-white/70 mt-1">
                Objetivos establecidos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Metas Activas
              </CardTitle>
              <Clock className="h-4 w-4 text-[#40C9A9]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metasActivas.length}</div>
              <p className="text-xs text-white/70 mt-1">
                En progreso
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Metas Completadas
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metasCompletadas.length}</div>
              <p className="text-xs text-white/70 mt-1">
                Objetivos alcanzados
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Progreso General
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-[#40C9A9]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{progresoGeneral.toFixed(1)}%</div>
              <Progress 
                value={progresoGeneral} 
                className="mt-2"
              />
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="activas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-[#354B3A] border-white/10">
            <TabsTrigger value="activas" className="text-white data-[state=active]:bg-[#40C9A9] data-[state=active]:text-white">
              Metas Activas ({metasActivas.length})
            </TabsTrigger>
            <TabsTrigger value="completadas" className="text-white data-[state=active]:bg-[#40C9A9] data-[state=active]:text-white">
              Completadas ({metasCompletadas.length})
            </TabsTrigger>
          </TabsList>

          {/* Metas Activas */}
          <TabsContent value="activas" className="space-y-4">
            {metasActivas.length === 0 ? (
              <Card className="bg-[#354B3A] border-white/10">
                <CardContent className="text-center py-12">
                  <Target className="w-12 h-12 text-white/30 mx-auto mb-4" />
                  <h3 className="text-white font-medium mb-2">No tienes metas activas</h3>
                  <p className="text-white/70 mb-4">
                    Crea tu primera meta académica para comenzar a trabajar en tus objetivos
                  </p>
                  <Button 
                    className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                    onClick={() => {
                      resetForm();
                      setIsDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primera Meta
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {metasActivas.map((meta) => (
                  <Card key={meta.id} className="bg-[#354B3A] border-white/10">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTipoIcon(meta.tipo)}
                          <CardTitle className="text-white text-lg">{meta.titulo}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getTipoColor(meta.tipo)}>
                            {getTipoNombre(meta.tipo)}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription className="text-white/70">
                        {meta.descripcion || "Sin descripción"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-white/70">
                              {meta.tipo === "PROMEDIO_GENERAL" && "Promedio"}
                              {meta.tipo === "MATERIAS_APROBADAS" && "Materias"}
                              {meta.tipo === "CREDITOS_COMPLETADOS" && "Créditos"}
                              {meta.tipo === "SEMESTRE_ESPECIFICO" && "Semestre"}
                              {meta.tipo === "MATERIA_ESPECIFICA" && "Estado"}
                              {meta.tipo === "HORAS_ESTUDIO" && "Horas"}
                              {!meta.tipo && "Progreso"}
                            </span>
                            <span className="text-white">
                              {meta.valorActual}/{meta.valorObjetivo}
                              {meta.tipo === "PROMEDIO_GENERAL" && " pts"}
                              {meta.tipo === "MATERIAS_APROBADAS" && " materias"}
                              {meta.tipo === "CREDITOS_COMPLETADOS" && " créditos"}
                              {meta.tipo === "SEMESTRE_ESPECIFICO" && " sem"}
                              {meta.tipo === "MATERIA_ESPECIFICA" && (meta.valorActual >= meta.valorObjetivo ? " ✓" : " ✗")}
                              {meta.tipo === "HORAS_ESTUDIO" && " hrs"}
                            </span>
                          </div>
                          <Progress 
                            value={(meta.valorActual / meta.valorObjetivo) * 100} 
                            className="h-2"
                          />
                          <p className="text-white/50 text-xs mt-1">
                            {meta.tipo === "PROMEDIO_GENERAL" && `${((meta.valorActual / meta.valorObjetivo) * 100).toFixed(1)}% del objetivo alcanzado`}
                            {meta.tipo === "MATERIAS_APROBADAS" && `${meta.valorObjetivo - meta.valorActual} materias restantes`}
                            {meta.tipo === "CREDITOS_COMPLETADOS" && `${meta.valorObjetivo - meta.valorActual} créditos restantes`}
                            {meta.tipo === "SEMESTRE_ESPECIFICO" && `${meta.valorObjetivo - meta.valorActual} semestres restantes`}
                            {meta.tipo === "MATERIA_ESPECIFICA" && (meta.valorActual >= meta.valorObjetivo ? "¡Materia aprobada!" : "Materia pendiente")}
                            {meta.tipo === "HORAS_ESTUDIO" && `${meta.valorObjetivo - meta.valorActual} horas restantes esta semana`}
                            {!meta.tipo && `${((meta.valorActual / meta.valorObjetivo) * 100).toFixed(1)}% completado`}
                          </p>
                        </div>
                        
                        {meta.fechaLimite && (
                          <div className="flex items-center gap-2 text-sm text-white/70">
                            <Calendar className="w-4 h-4" />
                            <span>Límite: {new Date(meta.fechaLimite).toLocaleDateString()}</span>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            className="flex-1 bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                            onClick={() => handleToggleComplete(meta)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Completar
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                            onClick={() => handleEdit(meta)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm"
                                variant="outline"
                                className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#354B3A] border-white/10">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">
                                  ¿Eliminar meta?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-white/70">
                                  Esta acción no se puede deshacer. La meta será eliminada permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-red-500 hover:bg-red-600 text-white"
                                  onClick={() => handleDelete(meta.id)}
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Metas Completadas */}
          <TabsContent value="completadas" className="space-y-4">
            {metasCompletadas.length === 0 ? (
              <Card className="bg-[#354B3A] border-white/10">
                <CardContent className="text-center py-12">
                  <Award className="w-12 h-12 text-white/30 mx-auto mb-4" />
                  <h3 className="text-white font-medium mb-2">No hay metas completadas</h3>
                  <p className="text-white/70">
                    ¡Comienza a trabajar en tus metas para ver tus logros aquí!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {metasCompletadas.map((meta) => (
                  <Card key={meta.id} className="bg-[#354B3A] border-white/10">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTipoIcon(meta.tipo)}
                          <CardTitle className="text-white text-lg">{meta.titulo}</CardTitle>
                        </div>
                        <Badge className="bg-green-500/10 text-green-300 border-green-500/20">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completada
                        </Badge>
                      </div>
                      <CardDescription className="text-white/70">
                        {meta.descripcion || "Sin descripción"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-white/70">
                              {meta.tipo === "PROMEDIO_GENERAL" && "Promedio Final"}
                              {meta.tipo === "MATERIAS_APROBADAS" && "Materias Aprobadas"}
                              {meta.tipo === "CREDITOS_COMPLETADOS" && "Créditos Finales"}
                              {meta.tipo === "SEMESTRE_ESPECIFICO" && "Semestre Alcanzado"}
                              {meta.tipo === "MATERIA_ESPECIFICA" && "Estado Final"}
                              {meta.tipo === "HORAS_ESTUDIO" && "Horas Finales"}
                              {!meta.tipo && "Resultado Final"}
                            </span>
                            <span className="text-white">
                              {meta.valorActual}/{meta.valorObjetivo}
                              {meta.tipo === "PROMEDIO_GENERAL" && " pts"}
                              {meta.tipo === "MATERIAS_APROBADAS" && " materias"}
                              {meta.tipo === "CREDITOS_COMPLETADOS" && " créditos"}
                              {meta.tipo === "SEMESTRE_ESPECIFICO" && " sem"}
                              {meta.tipo === "MATERIA_ESPECIFICA" && " ✓"}
                              {meta.tipo === "HORAS_ESTUDIO" && " hrs"}
                            </span>
                          </div>
                          <Progress 
                            value={100} 
                            className="h-2 bg-green-500/20"
                          />
                          <p className="text-green-400 text-xs mt-1 font-medium">
                            ¡Meta alcanzada exitosamente!
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-white/70">
                          <Calendar className="w-4 h-4" />
                          <span>Completada el {new Date(meta.updatedAt).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            variant="outline"
                            className="flex-1 border-white/20 text-white hover:bg-white/10"
                            onClick={() => handleToggleComplete(meta)}
                          >
                            <Clock className="w-4 h-4 mr-1" />
                            Marcar Pendiente
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm"
                                variant="outline"
                                className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#354B3A] border-white/10">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">
                                  ¿Eliminar meta?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-white/70">
                                  Esta acción no se puede deshacer. La meta será eliminada permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-red-500 hover:bg-red-600 text-white"
                                  onClick={() => handleDelete(meta.id)}
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 