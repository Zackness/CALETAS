"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Calendar,
  Award,
  Search
} from "lucide-react";
import { EstadoMateria } from "@prisma/client";
import { toast } from "sonner";
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

interface MateriaEstudiante {
  id: string;
  estado: string;
  nota?: number;
  semestreCursado?: string;
  fechaInicio?: string;
  fechaFin?: string;
  observaciones?: string;
  materia: Materia;
}

export default function HistorialPage() {
  const { data: session, status } = useSession();
  const [materiasEstudiante, setMateriasEstudiante] = useState<MateriaEstudiante[]>([]);
  const [materiasDisponibles, setMateriasDisponibles] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("todos");

  // Estados para el diálogo de agregar/editar
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMateria, setEditingMateria] = useState<MateriaEstudiante | null>(null);
  const [formData, setFormData] = useState({
    materiaId: "",
    estado: "",
    nota: "",
    semestreCursado: "",
    fechaInicio: "",
    fechaFin: "",
    observaciones: "",
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      redirect("/auth/signin");
    }

    fetchHistorial();
  }, [session, status]);

  const fetchHistorial = async () => {
    try {
      const response = await axios.get("/api/user/academico/historial");
      setMateriasEstudiante(response.data.materiasEstudiante);
      setMateriasDisponibles(response.data.materiasDisponibles);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Error al cargar el historial");
    } finally {
      setLoading(false);
    }
  };

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

  const openAddDialog = () => {
    setEditingMateria(null);
    setFormData({
      materiaId: "",
      estado: "",
      nota: "",
      semestreCursado: "",
      fechaInicio: "",
      fechaFin: "",
      observaciones: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (materia: MateriaEstudiante) => {
    setEditingMateria(materia);
    setFormData({
      materiaId: materia.materia.id,
      estado: materia.estado,
      nota: materia.nota?.toString() || "",
      semestreCursado: materia.semestreCursado || "",
      fechaInicio: materia.fechaInicio ? new Date(materia.fechaInicio).toISOString().split('T')[0] : "",
      fechaFin: materia.fechaFin ? new Date(materia.fechaFin).toISOString().split('T')[0] : "",
      observaciones: materia.observaciones || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        nota: formData.nota ? parseFloat(formData.nota) : undefined,
        fechaInicio: formData.fechaInicio || undefined,
        fechaFin: formData.fechaFin || undefined,
      };

      // Si se está marcando como aprobada, validar prerrequisitos primero
      if (submitData.estado === "APROBADA" && !editingMateria) {
        try {
          const validationResponse = await axios.post("/api/user/academico/validate-prerequisites", {
            materiaId: submitData.materiaId,
            estado: submitData.estado,
          });

          if (!validationResponse.data.esValido) {
            // Mostrar diálogo de confirmación para agregar prerrequisitos automáticamente
            const shouldAddPrerequisites = window.confirm(
              `${validationResponse.data.mensaje}\n\n¿Deseas agregar automáticamente los prerrequisitos faltantes como aprobados?\n\nPrerrequisitos faltantes:\n${validationResponse.data.prerrequisitosFaltantes.map((p: any) => `• ${p.codigo} - ${p.nombre}`).join('\n')}`
            );

            if (shouldAddPrerequisites) {
              // Agregar prerrequisitos automáticamente
              for (const sugerencia of validationResponse.data.sugerencias) {
                await axios.post("/api/user/academico/historial", {
                  materiaId: sugerencia.materiaId,
                  estado: "APROBADA",
                  nota: 16.0, // Nota por defecto
                  semestreCursado: "ANTERIOR",
                  fechaInicio: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 meses atrás
                  fechaFin: new Date(Date.now() - 1 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 mes atrás
                  observaciones: "Prerrequisito agregado automáticamente",
                  agregadoAutomatico: true, // Indicar que se está agregando automáticamente
                });
              }
              toast.success("Prerrequisitos agregados automáticamente");
            } else {
              toast.error("No se puede agregar la materia sin aprobar los prerrequisitos");
              return;
            }
          }
        } catch (validationError: any) {
          console.error("Error validating prerequisites:", validationError);
          // Si hay error en la validación, continuar con el proceso normal
        }
      }

      if (editingMateria) {
        // Actualizar materia existente
        await axios.put("/api/user/academico/historial", {
          materiaEstudianteId: editingMateria.id,
          ...submitData,
        });
        toast.success("Materia actualizada exitosamente");
      } else {
        // Agregar nueva materia
        await axios.post("/api/user/academico/historial", submitData);
        toast.success("Materia agregada al historial exitosamente");
      }

      setDialogOpen(false);
      fetchHistorial();
    } catch (error: any) {
      console.error("Error saving materia:", error);
      
      // Manejar errores específicos de prerrequisitos
      if (error.response?.data?.error === "Prerrequisitos faltantes") {
        const prerrequisitos = error.response.data.prerrequisitosFaltantes;
        const mensaje = `${error.response.data.mensaje}\n\nPrerrequisitos faltantes:\n${prerrequisitos.map((p: any) => `• ${p.codigo} - ${p.nombre}`).join('\n')}`;
        toast.error(mensaje);
      } else {
        toast.error(error.response?.data?.error || "Error al guardar la materia");
      }
    }
  };

  const handleDelete = async (materiaId: string) => {
    try {
      await axios.delete(`/api/user/academico/historial?id=${materiaId}`);
      toast.success("Materia eliminada del historial");
      fetchHistorial();
    } catch (error: any) {
      console.error("Error deleting materia:", error);
      toast.error(error.response?.data?.error || "Error al eliminar la materia");
    }
  };

  // Filtrar materias
  const filteredMaterias = materiasEstudiante.filter(materia => {
    const matchesSearch = materia.materia.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         materia.materia.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === "todos" || materia.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Cargando historial académico...</p>
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
            <BookOpen className="w-8 h-8 text-[#40C9A9]" />
            Gestión de Historial Académico
          </h1>
          <p className="text-white/70">
            Administra tu historial completo de materias cursadas
          </p>
        </div>

        {/* Controles */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
              <Input
                placeholder="Buscar por código o nombre de materia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#354B3A] border-white/10 text-white placeholder:text-white/50"
              />
            </div>
          </div>
          
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-full md:w-48 bg-[#354B3A] border-white/10 text-white">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent className="bg-[#354B3A] border-white/10">
              <SelectItem value="todos" className="text-white">Todos los estados</SelectItem>
              <SelectItem value="APROBADA" className="text-white">Aprobadas</SelectItem>
              <SelectItem value="EN_CURSO" className="text-white">En Curso</SelectItem>
              <SelectItem value="APLAZADA" className="text-white">Aplazadas</SelectItem>
              <SelectItem value="RETIRADA" className="text-white">Retiradas</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={openAddDialog}
                className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Materia
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#354B3A] border-white/10 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingMateria ? "Editar Materia" : "Agregar Materia al Historial"}
                </DialogTitle>
                <DialogDescription className="text-white/70">
                  {editingMateria 
                    ? "Modifica los datos de la materia seleccionada"
                    : "Agrega una nueva materia a tu historial académico"
                  }
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="materiaId" className="text-white/70">
                      Materia
                    </Label>
                    <Select 
                      value={formData.materiaId} 
                      onValueChange={(value) => setFormData({...formData, materiaId: value})}
                      disabled={!!editingMateria}
                    >
                      <SelectTrigger className="bg-[#1C2D20] border-white/10 text-white">
                        <SelectValue placeholder="Seleccionar materia" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1C2D20] border-white/10">
                        {materiasDisponibles.map((materia) => (
                          <SelectItem key={materia.id} value={materia.id} className="text-white">
                            {materia.codigo} - {materia.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estado" className="text-white/70">
                      Estado
                    </Label>
                    <Select 
                      value={formData.estado} 
                      onValueChange={(value) => setFormData({...formData, estado: value})}
                    >
                      <SelectTrigger className="bg-[#1C2D20] border-white/10 text-white">
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1C2D20] border-white/10">
                        <SelectItem value="APROBADA" className="text-white">Aprobada</SelectItem>
                        <SelectItem value="EN_CURSO" className="text-white">En Curso</SelectItem>
                        <SelectItem value="APLAZADA" className="text-white">Aplazada</SelectItem>
                        <SelectItem value="RETIRADA" className="text-white">Retirada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nota" className="text-white/70">
                      Nota
                    </Label>
                    <Input
                      id="nota"
                      type="number"
                      min="0"
                      max="20"
                      step="0.1"
                      value={formData.nota}
                      onChange={(e) => setFormData({...formData, nota: e.target.value})}
                      placeholder="0.0 - 20.0"
                      className="bg-[#1C2D20] border-white/10 text-white placeholder:text-white/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="semestreCursado" className="text-white/70">
                      Semestre Cursado
                    </Label>
                    <Input
                      id="semestreCursado"
                      value={formData.semestreCursado}
                      onChange={(e) => setFormData({...formData, semestreCursado: e.target.value})}
                      placeholder="Ej: S1, S2, ANTERIOR"
                      className="bg-[#1C2D20] border-white/10 text-white placeholder:text-white/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fechaInicio" className="text-white/70">
                      Fecha de Inicio
                    </Label>
                    <Input
                      id="fechaInicio"
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
                      className="bg-[#1C2D20] border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaFin" className="text-white/70">
                    Fecha de Finalización
                  </Label>
                  <Input
                    id="fechaFin"
                    type="date"
                    value={formData.fechaFin}
                    onChange={(e) => setFormData({...formData, fechaFin: e.target.value})}
                    className="bg-[#1C2D20] border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observaciones" className="text-white/70">
                    Observaciones
                  </Label>
                  <Textarea
                    id="observaciones"
                    value={formData.observaciones}
                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                    placeholder="Observaciones adicionales..."
                    className="bg-[#1C2D20] border-white/10 text-white placeholder:text-white/50"
                    rows={3}
                  />
                </div>

                <DialogFooter className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                  >
                    {editingMateria ? "Actualizar" : "Agregar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de materias */}
        <Card className="bg-[#354B3A] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-[#40C9A9]" />
              Historial Académico ({filteredMaterias.length} materias)
            </CardTitle>
            <CardDescription className="text-white/70">
              Todas las materias que has cursado o estás cursando
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredMaterias.map((materia) => (
                <div
                  key={materia.id}
                  className="flex items-center justify-between p-4 bg-[#1C2D20] rounded-lg border border-white/5"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
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
                    <h4 className="text-white font-medium mb-2">
                      {materia.materia.nombre}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <span>Semestre: {materia.materia.semestre}</span>
                      <span>Créditos: {materia.materia.creditos}</span>
                      {materia.semestreCursado && (
                        <span>Cursado: {materia.semestreCursado}</span>
                      )}
                      {materia.fechaInicio && (
                        <span>Inicio: {new Date(materia.fechaInicio).toLocaleDateString()}</span>
                      )}
                    </div>
                    {materia.observaciones && (
                      <p className="text-sm text-white/70 mt-2">
                        {materia.observaciones}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(materia)}
                      className="border-[#40C9A9] text-[#40C9A9] hover:bg-[#40C9A9] hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-500/50 text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-[#354B3A] border-white/10">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">
                            ¿Eliminar materia del historial?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-white/70">
                            Esta acción eliminará permanentemente &quot;{materia.materia.nombre}&quot; de tu historial académico.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(materia.id)}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
              
              {filteredMaterias.length === 0 && (
                <div className="text-center py-12 text-white/70">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-white/30" />
                  <h3 className="text-xl font-medium text-white mb-2">
                    {searchTerm || filterEstado !== "todos" 
                      ? "No se encontraron materias" 
                      : "No hay materias en tu historial"
                    }
                  </h3>
                  <p className="text-white/70">
                    {searchTerm || filterEstado !== "todos"
                      ? "Intenta ajustar los filtros de búsqueda"
                      : "Agrega tu primera materia al historial académico"
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 