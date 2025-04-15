import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSolicitud } from "@/app/(protected)/admin/hooks/use-solicitud";
import { useNota } from "@/app/(protected)/admin/hooks/use-nota";
import { FileText, User, Phone, Mail, IdCard, Clock, AlertCircle, Calendar, Upload, Pencil } from "lucide-react";
import { CustomDialogHeader } from "../common/dialog-header";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";
import { useNotasPredefinidas } from "@/app/(protected)/admin/hooks/use-notas-predefinidas";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";

// Configurar el worker de PDF.js
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
}

interface PersonalDialogProps {
  solicitudId: string;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (solicitudId: string, newStatus: string) => void;
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
  onStatusChange,
}: PersonalDialogProps) => {
  const { solicitud, loading } = useSolicitud(solicitudId);
  const { getNota, createNota, updateNota, deleteNota, isLoading: isLoadingNota } = useNota({
    solicitudId: solicitudId || "",
  });
  const { getNotasPredefinidas, isLoading: isLoadingNotasPredefinidas } = useNotasPredefinidas();
  const [nota, setNota] = useState<string>("");
  const [lastLoadedId, setLastLoadedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isLoadingNotaState, setIsLoadingNotaState] = useState(false);
  const [notasPredefinidas, setNotasPredefinidas] = useState<Array<{ id: string; contenido: string }>>([]);
  const [notasPredefinidasLoaded, setNotasPredefinidasLoaded] = useState(false);
  const [selectedNotaId, setSelectedNotaId] = useState<string>("");
  const [notaPorDefecto, setNotaPorDefecto] = useState<{ id: string; contenido: string } | null>(null);
  const [isLoadingEstado, setIsLoadingEstado] = useState(false);
  const [localEstado, setLocalEstado] = useState<string>("");
  const [displayEstado, setDisplayEstado] = useState<string>("");
  const [localNota, setLocalNota] = useState<string>("");

  const documentoNombre = solicitud?.documento?.nombre || "Documento no disponible";
  const servicioNombre = solicitud?.documento?.servicio?.nombre || "Servicio no disponible";
  const fechaFormateada = solicitud?.createdAt ? format(new Date(solicitud.createdAt), "PPP", { locale: es }) : "Fecha no disponible";

  // Efecto para cargar las notas predefinidas solo cuando el diálogo se abre
  useEffect(() => {
    if (isOpen && !notasPredefinidasLoaded) {
      loadNotasPredefinidas();
    }
  }, [isOpen, notasPredefinidasLoaded]);

  // Efecto para cargar la nota actual cuando se abre el diálogo
  useEffect(() => {
    if (isOpen && solicitudId) {
      const fetchNota = async () => {
        try {
          const response = await fetch(`/api/solicitudes/${solicitudId}/nota`);
          if (response.ok) {
            const data = await response.json();
            if (data.nota) {
              setLocalNota(data.nota.contenido);
              setSelectedNotaId(data.nota.id);
            } else {
              // Si no hay nota, usar la nota por defecto
              setSelectedNotaId(notaPorDefecto?.id || "");
              setLocalNota(notaPorDefecto?.contenido || "");
            }
          }
        } catch (error) {
          console.error("Error al cargar la nota:", error);
        }
      };
      fetchNota();
    }
  }, [isOpen, solicitudId]);

  // Efecto para limpiar el estado cuando se cierra el diálogo
  useEffect(() => {
    if (!isOpen) {
      setNotasPredefinidasLoaded(false);
      setSelectedNotaId("");
      setLocalNota("");
    }
  }, [isOpen]);

  // Actualizar el estado local cuando cambie la solicitud
  useEffect(() => {
    if (solicitud?.estado) {
      setLocalEstado(solicitud.estado);
      setDisplayEstado(solicitud.estado);
    }
  }, [solicitud?.estado]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar que sea un PDF
    if (file.type !== 'application/pdf') {
      toast.error("Solo se permiten archivos PDF");
      return;
    }

    setIsUploading(true);
    try {
      // Crear un FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', file);
      formData.append('solicitudId', solicitudId);

      // Subir el archivo a Bunny.net
      const response = await axios.post('/api/upload/documento-finalizado', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.url) {
        setUploadedFile(response.data.url);
        toast.success("Documento subido correctamente");
      } else {
        toast.error("Error al subir el documento");
      }
    } catch (error) {
      console.error("Error al subir el archivo:", error);
      toast.error("Error al subir el documento");
    } finally {
      setIsUploading(false);
    }
  };

  const handleNotaPredefinidaChange = async (notaId: string) => {
    setSelectedNotaId(notaId);
    
    // Si se selecciona la opción vacía, usar la nota por defecto
    if (notaId === "") {
      if (notaPorDefecto) {
        setLocalNota(notaPorDefecto.contenido);
      }
      return;
    }
    
    // Buscar la nota seleccionada
    const notaSeleccionada = notasPredefinidas.find(n => n.id === notaId);
    if (notaSeleccionada) {
      setLocalNota(notaSeleccionada.contenido);
    }
  };

  const handleSaveNota = async (contenidoNota: string) => {
    if (!solicitudId) return;

    try {
      const notaData = await getNota();
      if (notaData) {
        await updateNota(contenidoNota);
      } else {
        await createNota(contenidoNota);
      }
      toast.success("Nota guardada correctamente");
    } catch (error) {
      console.error("Error al guardar la nota:", error);
      toast.error("Error al guardar la nota");
    }
  };

  const handleEstadoChange = async (estado: string) => {
    if (!solicitudId) return;
    
    setIsLoadingEstado(true);
    try {
      // Actualizar inmediatamente el estado mostrado en el badge
      setDisplayEstado(estado);
      
      const response = await fetch(`/api/solicitudes/${solicitudId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado');
      }

      setLocalEstado(estado);
      toast.success("Estado actualizado correctamente");
      // Notificar al componente padre sobre el cambio de estado
      onStatusChange?.(solicitudId, estado);
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      toast.error("Error al actualizar el estado");
      // Revertir el estado mostrado en caso de error
      setDisplayEstado(localEstado);
    } finally {
      setIsLoadingEstado(false);
    }
  };

  const loadNotasPredefinidas = async () => {
    try {
      setIsLoadingNotaState(true);
      const notas = await getNotasPredefinidas();
      
      if (Array.isArray(notas)) {
        // Encontrar la nota por defecto
        const notaDefecto = notas.find(n => n.id === "e20313fa-a6a3-4585-8b1f-9151452976a1");
        if (notaDefecto) {
          setNotaPorDefecto(notaDefecto);
          // Si no hay una nota asignada, usar la nota por defecto
          if (!solicitud?.notaId) {
            setLocalNota(notaDefecto.contenido);
            await handleSaveNota(notaDefecto.contenido);
          }
        }
        
        // Filtrar la nota por defecto del listado
        const notasFiltradas = notas.filter(n => n.id !== "e20313fa-a6a3-4585-8b1f-9151452976a1");
        setNotasPredefinidas(notasFiltradas);
        setNotasPredefinidasLoaded(true);
      } else {
        console.error("Las notas predefinidas no son un array:", notas);
        setNotasPredefinidas([]);
      }
    } catch (error) {
      console.error("Error al cargar notas predefinidas:", error);
      setNotasPredefinidas([]);
    } finally {
      setIsLoadingNotaState(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    if (!solicitud) {
      return (
        <div className="text-center p-4">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-lg font-medium">Solicitud no encontrada</p>
          <p className="text-sm text-muted-foreground">No se pudo encontrar la solicitud solicitada.</p>
        </div>
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
        
        {/* Sección del badge y prioridad */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Estado:</span>
              </div>
              {getStatusBadge(displayEstado)}
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
        </div>

        {/* Sección de estado */}
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Estado de la solicitud</h3>
          </div>
          
          {isLoadingEstado ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Estado actual</Label>
                <Select 
                  value={localEstado} 
                  onValueChange={handleEstadoChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                    <SelectItem value="APROBADA">Aprobada</SelectItem>
                    <SelectItem value="EN_PROGRESO">En progreso</SelectItem>
                    <SelectItem value="FINALIZADA">Finalizada</SelectItem>
                    <SelectItem value="RECHAZADA">Rechazada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Sección de notas */}
        <div className="pb-5 mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Notas del estado de la solicitud</h3>
          </div>

          {isLoadingNotaState ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Combobox de notas predefinidas */}
              <div className="space-y-2">
                <Label>Seleccionar nota predefinida</Label>
                <div className="w-full">
                  <Combobox
                    options={[
                      { value: "", label: notaPorDefecto?.contenido || "Nota por defecto" },
                      ...notasPredefinidas.map(nota => ({
                        value: nota.id,
                        label: nota.contenido
                      }))
                    ]}
                    value={selectedNotaId}
                    onChange={handleNotaPredefinidaChange}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Formulario para subir documento finalizado */}
        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-blue-500">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <Upload className="h-5 w-5 text-blue-900" />
              Documento Finalizado
            </CardTitle>
            <CardDescription className="text-foreground">
              Sube el documento PDF que ha sido preparado para el cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Input
                  id="documento-finalizado"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </div>
              
              {isUploading && (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Subiendo documento...</span>
                </div>
              )}
              
              {uploadedFile && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-green-600">Documento subido correctamente</p>
                  <a 
                    href={uploadedFile} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    <FileText className="h-4 w-4" />
                    Ver documento
                  </a>
                </div>
              )}
              
              {solicitud.detalle?.solicitud_finalizada && !uploadedFile && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Documento ya subido anteriormente:</p>
                  <a 
                    href={solicitud.detalle.solicitud_finalizada} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    <FileText className="h-4 w-4" />
                    Ver documento
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Sección de testigos (solo para soltería) */}
        {isSolteria && (
          <div className="border-t pt-4 mt-4 grid grid-cols-2 gap-4">
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
          <div className=" border-t pt-4 mt-4 space-y-4">
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