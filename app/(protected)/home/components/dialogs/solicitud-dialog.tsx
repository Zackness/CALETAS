import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useSolicitud } from "@/app/(protected)/admin/hooks/use-solicitud";
import { useNota } from "@/app/(protected)/admin/hooks/use-nota";
import { FileText, Upload, Pencil, MessageSquare } from "lucide-react";
import { CustomDialogHeader } from "./common/dialog-header";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useNotasPredefinidas } from "@/app/(protected)/admin/hooks/use-notas-predefinidas";
import { useAbogados } from "@/app/(protected)/admin/hooks/use-abogados";
import { ClientInfo } from "./common/client-info";
import { SolteriaContent } from "./solteria/solteria-content";
import { MigranteContent } from "./migrante/migrante-content";

// Configurar el worker de PDF.js
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
}

interface SolicitudDialogProps {
  solicitudId: string;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (solicitudId: string, newStatus: string) => void;
}

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

export const SolicitudDialog = ({
  solicitudId,
  isOpen,
  onClose,
  onStatusChange,
}: SolicitudDialogProps) => {
  const { solicitud, loading } = useSolicitud(solicitudId);
  const { getNota, createNota, updateNota, deleteNota, isLoading: isLoadingNota } = useNota({
    solicitudId: solicitudId || "",
  });
  const { getNotasPredefinidas, isLoading: isLoadingNotasPredefinidas } = useNotasPredefinidas();
  const [isLoadingNotaState, setIsLoadingNotaState] = useState(false);
  const [notasPredefinidas, setNotasPredefinidas] = useState<Array<{ id: string; contenido: string }>>([]);
  const [notasPredefinidasLoaded, setNotasPredefinidasLoaded] = useState(false);
  const [selectedNotaId, setSelectedNotaId] = useState<string>("");
  const [displayEstado, setDisplayEstado] = useState<string>("");
  const [localNota, setLocalNota] = useState<string>("");

  const documentoNombre = solicitud?.documento?.nombre || "Documento no disponible";
  const servicioNombre = solicitud?.documento?.servicio?.nombre || "Servicio no disponible";
  const fechaFormateada = solicitud?.createdAt ? format(new Date(solicitud.createdAt), "PPP", { locale: es }) : "Fecha no disponible";

  // Efecto para cargar la nota actual cuando se abre el diálogo
  useEffect(() => {
    if (isOpen && solicitudId) {
      const fetchNota = async () => {
        try {
          setIsLoadingNotaState(true);
          const response = await fetch(`/api/solicitudes/${solicitudId}/nota`);
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.id) {
              setSelectedNotaId(data.id);
              setLocalNota(data.contenido);
              console.log("Nota cargada:", data);
            } else {
              // Si no hay nota, usar la nota por defecto
              setSelectedNotaId("");
              setLocalNota("");
              console.log("No hay nota asociada a esta solicitud");
            }
          } else if (response.status === 404) {
            // Si no hay nota, usar la nota por defecto
            setSelectedNotaId("");
            setLocalNota("");
            console.log("No hay nota asociada a esta solicitud (404)");
          } else {
            console.error("Error al cargar la nota:", response.status);
          }
        } catch (error) {
          console.error("Error al cargar la nota:", error);
        } finally {
          setIsLoadingNotaState(false);
        }
      };
      fetchNota();
    }
  }, [isOpen, solicitudId]);

  const loadNotasPredefinidas = async () => {
    try {
      setIsLoadingNotaState(true);
      const notas = await getNotasPredefinidas();
      
      if (Array.isArray(notas)) {
        setNotasPredefinidas(notas);
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
          <p className="text-lg font-medium">Solicitud no encontrada</p>
          <p className="text-sm text-muted-foreground">No se pudo encontrar la solicitud solicitada.</p>
        </div>
      );
    }

    const solicitante = solicitud.familiar || solicitud.client;
    const isMainUser = !solicitud.familiar;

    // Determinar el tipo de documento
    const isSolteria = solicitud.documento?.nombre?.toLowerCase().includes("soltería") || 
                       solicitud.documento?.nombre?.includes("solteria");
    const isPoder = solicitud.documento?.nombre?.toLowerCase().includes("poder");
    const isPoderViajero = solicitud.documento?.nombre?.toLowerCase().includes("poder") && 
                           (solicitud.documento?.nombre?.toLowerCase().includes("viajero") || 
                            solicitud.documento?.nombre?.toLowerCase().includes("viaje"));
    const isMigrante = (solicitud.documento?.nombre?.toLowerCase().includes("migrante") || 
                       solicitud.documento?.nombre?.toLowerCase().includes("viajero")) && 
                       !isPoderViajero;

    return (
      <div className="space-y-6">
        {/* Información del solicitante usando el componente ClientInfo */}
        <ClientInfo 
          name={solicitante?.name || "Sin nombre"}
          email={solicitante?.email || "Sin email"}
          avatar={solicitante?.avatar}
          telefono={solicitante?.telefono}
          cedula={solicitante?.cedula}
          isMainUser={isMainUser}
          estado={solicitud.estado}
          prioridad={solicitud.prioridad}
        />
        
        {/* Sección de notas */}
        {localNota && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-700 mb-1">Nota de la solicitud</h4>
                <p className="text-sm text-blue-800 whitespace-pre-line">{localNota}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Contenido específico según el tipo de documento */}
        {isSolteria && (
          <SolteriaContent 
            testigo1={solicitud.detalle?.Testigo1}
            testigo2={solicitud.detalle?.Testigo2}
          />
        )}

        {/* Sección de migrante */}
        {isMigrante && (
          <MigranteContent 
            pasaporte={solicitud.detalle?.pasaporte}
            visa={solicitud.detalle?.visa}
            otrosDocumentos={[
              solicitud.detalle?.otros_documentos1,
              solicitud.detalle?.otros_documentos2,
              solicitud.detalle?.otros_documentos3
            ].filter(Boolean) as string[]}
          />
        )}

        {/* Sección de poder (regular o para viajero) */}
        {(isPoder || isPoderViajero) && (
          <div className="border-t pt-4 mt-4 space-y-4">
            {/* Texto genérico para poder */}
            {solicitud.detalle?.generic_text && (
              <div className="border rounded p-4">
                <h4 className="font-medium mb-2">
                  {isPoderViajero 
                    ? "Detalles del poder para viajero" 
                    : "Detalles del poder especial"}
                </h4>
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