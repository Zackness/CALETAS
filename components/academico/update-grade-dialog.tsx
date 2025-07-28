"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EstadoMateria } from "@prisma/client";
import { toast } from "sonner";
import axios from "axios";

interface UpdateGradeDialogProps {
  materiaEstudiante: {
    id: string;
    estado: string;
    nota?: number;
    observaciones?: string;
    materia: {
      codigo: string;
      nombre: string;
      creditos: number;
      semestre: string;
    };
  };
  onUpdate: () => void;
}

export function UpdateGradeDialog({ materiaEstudiante, onUpdate }: UpdateGradeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nota, setNota] = useState(materiaEstudiante.nota?.toString() || "");
  const [estado, setEstado] = useState(materiaEstudiante.estado);
  const [observaciones, setObservaciones] = useState(materiaEstudiante.observaciones || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const notaValue = nota ? parseFloat(nota) : undefined;
      
      await axios.post("/api/user/academico/update-nota", {
        materiaEstudianteId: materiaEstudiante.id,
        nota: notaValue,
        estado,
        observaciones,
      });

      toast.success("Nota actualizada exitosamente");
      onUpdate();
      setOpen(false);
    } catch (error: any) {
      console.error("Error updating grade:", error);
      toast.error(error.response?.data?.error || "Error al actualizar la nota");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setNota(materiaEstudiante.nota?.toString() || "");
    setEstado(materiaEstudiante.estado);
    setObservaciones(materiaEstudiante.observaciones || "");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="border-[#40C9A9] text-[#40C9A9] hover:bg-[#40C9A9] hover:text-white"
        >
          Actualizar Nota
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#354B3A] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            Actualizar Calificación
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {materiaEstudiante.materia.codigo} - {materiaEstudiante.materia.nombre}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="0.0 - 20.0"
                className="bg-[#1C2D20] border-white/10 text-white placeholder:text-white/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estado" className="text-white/70">
                Estado
              </Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger className="bg-[#1C2D20] border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1C2D20] border-white/10">
                  <SelectItem value={EstadoMateria.NO_CURSADA} className="text-white">
                    No Cursada
                  </SelectItem>
                  <SelectItem value={EstadoMateria.EN_CURSO} className="text-white">
                    En Curso
                  </SelectItem>
                  <SelectItem value={EstadoMateria.APROBADA} className="text-white">
                    Aprobada
                  </SelectItem>
                  <SelectItem value={EstadoMateria.APLAZADA} className="text-white">
                    Aplazada
                  </SelectItem>
                  <SelectItem value={EstadoMateria.RETIRADA} className="text-white">
                    Retirada
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones" className="text-white/70">
              Observaciones
            </Label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Observaciones adicionales..."
              className="bg-[#1C2D20] border-white/10 text-white placeholder:text-white/50"
              rows={3}
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Restablecer
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
            >
              {loading ? "Actualizando..." : "Actualizar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 