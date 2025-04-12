import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSolicitud } from "@/app/(protected)/home/hooks/use-solicitud";
import { useNota } from "@/app/(protected)/home/hooks/use-nota";
import { PersonalDocumentForm } from "./document-form";
import { FileText, User, Phone, Mail, IdCard, Clock, AlertCircle, Calendar } from "lucide-react";
import { CustomDialogHeader } from "../common/dialog-header";
import { ClientInfo } from "../common/client-info";
import { StatusBadge } from "../common/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configurar el worker de PDF.js
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
}

interface PersonalDialogProps {
  solicitudId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Solicitante {
  name: string;
  email: string;
  avatar?: string;
  telefono?: string;
  cedula?: string;
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

const renderDocument = (url: string) => {
  const fileType = url.split('.').pop()?.toLowerCase();

  if (fileType === 'pdf') {
    return (
      <div className="mt-2 border rounded p-2">
        <Document 
          file={url}
          loading={
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          }
          error={
            <div className="text-red-500 p-4">
              Error al cargar el PDF. Por favor, intente nuevamente.
            </div>
          }
          onLoadError={(error) => {
            console.error('Error loading PDF:', error);
          }}
        >
          <Page 
            pageNumber={1} 
            width={400}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            }
          />
        </Document>
      </div>
    );
  } else if (['jpg', 'jpeg', 'png'].includes(fileType || '')) {
    return (
      <div className="mt-2 border rounded p-2">
        <img 
          src={url} 
          alt="Documento" 
          className="max-w-full h-auto rounded"
          style={{ maxHeight: '400px' }}
        />
      </div>
    );
  } else {
    return <p className="text-sm text-muted-foreground mt-2">Formato de archivo no soportado para vista previa</p>;
  }
};

export const PersonalDialog = ({
  solicitudId,
  isOpen,
  onClose,
}: PersonalDialogProps) => {
  const { solicitud, loading } = useSolicitud(solicitudId);
  const { isLoading, getNota, createNota, updateNota, deleteNota } = useNota({
    solicitudId: solicitudId,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [nota, setNota] = useState<string>("");
  const [isEditingNota, setIsEditingNota] = useState(false);
  const [lastLoadedId, setLastLoadedId] = useState<string | null>(null);

  const documentoNombre = solicitud?.documento?.nombre || "Documento no disponible";
  const servicioNombre = solicitud?.documento?.servicio?.nombre || "Servicio no disponible";
  const fechaFormateada = solicitud?.fecha ? format(new Date(solicitud.fecha), "PPP", { locale: es }) : "Fecha no disponible";

  useEffect(() => {
    const loadNota = async () => {
      if (solicitudId && isOpen && solicitudId !== lastLoadedId) {
        const notaData = await getNota();
        if (notaData) {
          setNota(notaData.contenido);
        }
        setLastLoadedId(solicitudId);
      }
    };
    loadNota();
  }, [solicitudId, isOpen, getNota, lastLoadedId]);

  useEffect(() => {
    if (!isOpen) {
      setNota("");
      setIsEditingNota(false);
      setLastLoadedId(null);
    }
  }, [isOpen]);

  const handleSaveNota = async () => {
    if (nota.trim()) {
      if (isEditingNota) {
        await updateNota(nota);
      } else {
        await createNota(nota);
      }
      setIsEditingNota(false);
    }
  };

  const handleDeleteNota = async () => {
    await deleteNota();
    setNota("");
    setIsEditingNota(false);
  };

  const handleSave = async (data: any) => {
    // TODO: Implementar guardado
    setIsEditing(false);
  };

  const renderContent = () => {
    if (loading) {
      return <div>Cargando...</div>;
    }

    if (!solicitud) {
      return <div>No se encontró la solicitud</div>;
    }

    if (isEditing) {
      return (
        <PersonalDocumentForm
          detalle={solicitud.detalle || null}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      );
    }

    const solicitante: Solicitante = solicitud.familiar || (solicitud.client && {
      name: solicitud.client.name,
      email: solicitud.client.email,
      avatar: solicitud.client.avatar,
      telefono: solicitud.client.telefono || "Sin teléfono",
      cedula: solicitud.client.cedula || "Sin cédula",
    }) || { name: "Sin nombre", email: "Sin email", avatar: undefined, telefono: "Sin teléfono", cedula: "Sin cédula" };

    // Determinar el tipo de documento
    const isSolteria = solicitud.documento?.nombre?.toLowerCase().includes("soltería") || 
                       solicitud.documento?.nombre?.toLowerCase().includes("solteria");
    const isPoder = solicitud.documento?.nombre?.toLowerCase().includes("poder");

    return (
      <div className="space-y-6">

        {/* Información del solicitante */}
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Información del solicitante</h3>
          <div className="flex items-start gap-4">
            {/* Avatar a la izquierda */}
            <Avatar className="h-12 w-12">
              <AvatarImage 
                src={solicitante?.avatar} 
                alt={solicitante?.name || "Avatar"} 
              />
              <AvatarFallback>
                {(solicitante?.name || "Sin nombre")
                  .substring(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Información principal (nombre y cédula) */}
            <div className="flex-1">
              <p className="font-medium">{solicitante?.name || "Sin nombre"}</p>
              <p className="text-sm text-muted-foreground">
                {solicitud.familiar ? "Familiar" : "Usuario principal"}
              </p>
            </div>
            
            {/* Información de contacto (teléfono y correo) */}
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-medium">Teléfono:</span> {solicitante?.telefono || "Sin teléfono"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Correo:</span> {solicitante?.email || "Sin email"}
              </p>
              <p className="text-sm mt-1">
                <span className="font-medium">Cédula:</span> {solicitante?.cedula || "Sin cédula"}
              </p>    
            </div>
          </div>
        </div>
        
        {/* Sección del badge y botón editar */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Estado:</span>
              </div>
              {getStatusBadge(solicitud.estado)}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Prioridad:</span>
              </div>
              <div className="flex items-center gap-2">
                {getPriorityIcon(solicitud.prioridad)}
                <span className="text-sm capitalize">{solicitud.prioridad}</span>
              </div>
            </div>

          <Button onClick={() => setIsEditing(true)}>Editar</Button>
        </div>

        {/* Sección de testigos (solo para soltería) */}
        {isSolteria && (
          <div className="grid grid-cols-2 gap-4">
            {solicitud.detalle?.Testigo1 && (
              <div>
                <h4 className="font-medium mb-2">Testigo 1</h4>
                <a
                  href={solicitud.detalle.Testigo1}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  <span>Abrir en otra pestaña</span>
                </a>
                {renderDocument(solicitud.detalle.Testigo1)}
              </div>
            )}
            {solicitud.detalle?.Testigo2 && (
              <div>
                <h4 className="font-medium mb-2">Testigo 2</h4>
                <a
                  href={solicitud.detalle.Testigo2}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  <span>Abrir en otra pestaña</span>
                </a>
                {renderDocument(solicitud.detalle.Testigo2)}
              </div>
            )}
          </div>
        )}

        {/* Sección de poder (solo para poder especial o general) */}
        {isPoder && (
          <div className="space-y-4">
            {/* Texto genérico para poder especial */}
            {solicitud.detalle?.generic_text && (
              <div className="border rounded p-4">
                <h4 className="font-medium mb-2">Detalles del poder especial</h4>
                <p className="text-sm whitespace-pre-line">{solicitud.detalle.generic_text}</p>
              </div>
            )}

            {/* Bienes */}
            <div>
              <h4 className="font-medium mb-2">Bienes o propiedades</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {solicitud.detalle?.bienes_generico1 && (
                  <div className="border rounded p-3">
                    <h5 className="text-sm font-medium mb-1">Bien 1</h5>
                    <a
                      href={solicitud.detalle.bienes_generico1}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline mb-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Abrir en otra pestaña</span>
                    </a>
                    {renderDocument(solicitud.detalle.bienes_generico1)}
                  </div>
                )}
                {solicitud.detalle?.bienes_generico2 && (
                  <div className="border rounded p-3">
                    <h5 className="text-sm font-medium mb-1">Bien 2</h5>
                    <a
                      href={solicitud.detalle.bienes_generico2}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline mb-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Abrir en otra pestaña</span>
                    </a>
                    {renderDocument(solicitud.detalle.bienes_generico2)}
                  </div>
                )}
                {solicitud.detalle?.bienes_generico3 && (
                  <div className="border rounded p-3">
                    <h5 className="text-sm font-medium mb-1">Bien 3</h5>
                    <a
                      href={solicitud.detalle.bienes_generico3}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline mb-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Abrir en otra pestaña</span>
                    </a>
                    {renderDocument(solicitud.detalle.bienes_generico3)}
                  </div>
                )}
                {solicitud.detalle?.bienes_generico4 && (
                  <div className="border rounded p-3">
                    <h5 className="text-sm font-medium mb-1">Bien 4</h5>
                    <a
                      href={solicitud.detalle.bienes_generico4}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline mb-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Abrir en otra pestaña</span>
                    </a>
                    {renderDocument(solicitud.detalle.bienes_generico4)}
                  </div>
                )}
                {solicitud.detalle?.bienes_generico5 && (
                  <div className="border rounded p-3">
                    <h5 className="text-sm font-medium mb-1">Bien 5</h5>
                    <a
                      href={solicitud.detalle.bienes_generico5}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline mb-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Abrir en otra pestaña</span>
                    </a>
                    {renderDocument(solicitud.detalle.bienes_generico5)}
                  </div>
                )}
              </div>
              {!solicitud.detalle?.bienes_generico1 && 
               !solicitud.detalle?.bienes_generico2 && 
               !solicitud.detalle?.bienes_generico3 && 
               !solicitud.detalle?.bienes_generico4 && 
               !solicitud.detalle?.bienes_generico5 && (
                <p className="text-sm text-muted-foreground">No se han registrado bienes para esta solicitud.</p>
              )}
            </div>
          </div>
        )}

        {/* Sección de notas */}
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Notas</h3>
          </div>
            <div className="p-4 bg-muted rounded-md">
              {nota || "No hay notas para esta solicitud"}
            </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <CustomDialogHeader 
          title={`${documentoNombre} - ${servicioNombre}`}
          description={`Fecha: ${fechaFormateada}`}
        />
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}; 