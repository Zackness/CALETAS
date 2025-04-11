"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, FileText, User, Phone, Mail, IdCard, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNota } from "../hooks/use-nota";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Nota {
  id: string;
  contenido: string;
  createdAt: string;
}

interface DetalleSolicitud {
  id: string;
  estado: string;
  fecha: string;
  prioridad: string;
  documento: {
    id: string;
    nombre: string;
    servicio: {
      id: string;
      nombre: string;
    };
  };
  client: {
    id: string;
    name: string;
    email: string;
    avatar: string;
  };
  familiar?: {
    id: string;
    name: string;
    email: string;
    avatar: string;
  } | null;
  detalle?: {
    Testigo1?: string;
    Testigo2?: string;
    Testigo3?: string;
    Testigo4?: string;
    generic_text?: string;
    bienes_generico1?: string;
    bienes_generico2?: string;
    bienes_generico3?: string;
    bienes_generico4?: string;
    bienes_generico5?: string;
    Acta_de_nacimiento?: string;
    Acta_de_matrimonio?: string;
    Acta_de_defuncion?: string;
    Acta_de_divorcio?: string;
  } | null;
  notas?: Nota[];
}

interface SolicitudDialogProps {
  solicitud: DetalleSolicitud | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Función para obtener el badge estilizado según el estado
const getStatusBadge = (status: string) => {
  switch (status) {
    case "FINALIZADA":
      return (
        <span className="bg-green-500 hover:bg-green-600 text-white rounded px-2 py-1 text-xs">
          Finalizada
        </span>
      );
    case "EN_PROGRESO":
      return (
        <span className="bg-blue-500 hover:bg-blue-600 text-white rounded px-2 py-1 text-xs">
          En progreso
        </span>
      );
    case "PENDIENTE":
      return (
        <span className="bg-amber-500 hover:bg-amber-600 text-white rounded px-2 py-1 text-xs">
          Pendiente
        </span>
      );
    case "APROBADA":
      return (
        <span className="bg-purple-500 hover:bg-purple-600 text-white rounded px-2 py-1 text-xs">
          Aprobada
        </span>
      );
    case "RECHAZADA":
      return (
        <span className="bg-red-500 hover:bg-red-600 text-white rounded px-2 py-1 text-xs">
          Rechazada
        </span>
      );
    default:
      return <span className="border rounded px-2 py-1 text-xs">Desconocido</span>;
  }
};

// Función para obtener el ícono de prioridad
const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case "ALTA":
      return <span className="text-red-500">●</span>;
    case "NORMAL":
      return <span className="text-yellow-500">●</span>;
    case "BAJA":
      return <span className="text-green-500">●</span>;
    default:
      return <span>●</span>;
  }
};

export const SolicitudDialog = ({
  solicitud,
  open,
  onOpenChange,
}: SolicitudDialogProps) => {
  const { isLoading, getNota, createNota, updateNota, deleteNota } = useNota({
    solicitudId: solicitud?.id || "",
  });

  const [nota, setNota] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadNota = async () => {
      if (solicitud?.id) {
        const notaData = await getNota();
        if (notaData) {
          setNota(notaData.contenido);
        }
      }
    };
    loadNota();
  }, [solicitud?.id]);

  const handleSaveNota = async () => {
    if (nota.trim()) {
      if (isEditing) {
        await updateNota(nota);
      } else {
        await createNota(nota);
      }
      setIsEditing(false);
    }
  };

  const handleDeleteNota = async () => {
    await deleteNota();
    setNota("");
    setIsEditing(false);
  };

  if (!solicitud) return null;

  const solicitante = solicitud.familiar || solicitud.client;
  const fechaFormateada = solicitud.fecha ? format(new Date(solicitud.fecha), "PPP", { locale: es }) : "Fecha no disponible";
  const documentoNombre = solicitud.documento?.nombre || "Documento no disponible";
  const servicioNombre = solicitud.documento?.servicio?.nombre || "Servicio no disponible";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Detalles de la solicitud #{solicitud.id}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Información del solicitante - Ahora a la izquierda */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Información del solicitante</h3>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={solicitante.avatar} alt={solicitante.name} />
                <AvatarFallback>
                  {solicitante.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{solicitante.name}</p>
                <p className="text-sm text-muted-foreground">{solicitud.familiar ? "Familiar" : "Usuario"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{solicitante.email}</span>
              </div>
              {solicitud.familiar && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{solicitante.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Información general - Ahora a la derecha */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Estado:</span>
              </div>
              {getStatusBadge(solicitud.estado)}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Fecha:</span>
              </div>
              <span className="text-sm">{fechaFormateada}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Prioridad:</span>
              </div>
              <div className="flex items-center gap-2">
                {getPriorityIcon(solicitud.prioridad)}
                <span className="text-sm capitalize">{solicitud.prioridad}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Documento:</span>
              </div>
              <span className="text-sm">{documentoNombre}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Servicio:</span>
              </div>
              <span className="text-sm">{servicioNombre}</span>
            </div>
          </div>
        </div>

        {/* Detalles específicos del documento */}
        {solicitud.detalle && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium text-lg mb-3">Detalles del documento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {solicitud.detalle.Testigo1 && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Testigo 1: {solicitud.detalle.Testigo1}</span>
                </div>
              )}
              {solicitud.detalle.Testigo2 && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Testigo 2: {solicitud.detalle.Testigo2}</span>
                </div>
              )}
              {solicitud.detalle.Testigo3 && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Testigo 3: {solicitud.detalle.Testigo3}</span>
                </div>
              )}
              {solicitud.detalle.Testigo4 && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Testigo 4: {solicitud.detalle.Testigo4}</span>
                </div>
              )}
              {solicitud.detalle.generic_text && (
                <div className="col-span-2">
                  <p className="text-sm font-medium">Texto genérico:</p>
                  <p className="text-sm">{solicitud.detalle.generic_text}</p>
                </div>
              )}
              {solicitud.detalle.bienes_generico1 && (
                <div className="col-span-2">
                  <p className="text-sm font-medium">Bienes:</p>
                  <ul className="text-sm list-disc pl-5">
                    {solicitud.detalle.bienes_generico1 && <li>{solicitud.detalle.bienes_generico1}</li>}
                    {solicitud.detalle.bienes_generico2 && <li>{solicitud.detalle.bienes_generico2}</li>}
                    {solicitud.detalle.bienes_generico3 && <li>{solicitud.detalle.bienes_generico3}</li>}
                    {solicitud.detalle.bienes_generico4 && <li>{solicitud.detalle.bienes_generico4}</li>}
                    {solicitud.detalle.bienes_generico5 && <li>{solicitud.detalle.bienes_generico5}</li>}
                  </ul>
                </div>
              )}
              {solicitud.detalle.Acta_de_nacimiento && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Acta de nacimiento: {solicitud.detalle.Acta_de_nacimiento}</span>
                </div>
              )}
              {solicitud.detalle.Acta_de_matrimonio && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Acta de matrimonio: {solicitud.detalle.Acta_de_matrimonio}</span>
                </div>
              )}
              {solicitud.detalle.Acta_de_defuncion && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Acta de defunción: {solicitud.detalle.Acta_de_defuncion}</span>
                </div>
              )}
              {solicitud.detalle.Acta_de_divorcio && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Acta de divorcio: {solicitud.detalle.Acta_de_divorcio}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notas del abogado */}
        {solicitud.notas && solicitud.notas.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium text-lg mb-3">Notas del abogado</h3>
            <div className="space-y-3">
              {solicitud.notas.map((nota) => (
                <div key={nota.id} className="bg-muted p-3 rounded-md">
                  <p className="text-sm">{nota.contenido}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(nota.createdAt), "PPP", { locale: es })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sección de notas con título y botón de editar alineados */}
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Notas</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Cancelar" : "Editar"}
              </Button>
              {nota && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteNota}
                  disabled={isLoading}
                >
                  Eliminar
                </Button>
              )}
            </div>
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Escribe una nota..."
                className="min-h-[100px]"
              />
              <Button
                onClick={handleSaveNota}
                disabled={isLoading || !nota.trim()}
              >
                Guardar
              </Button>
            </div>
          ) : (
            <div className="p-4 bg-muted rounded-md">
              {nota || "No hay notas para esta solicitud"}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 