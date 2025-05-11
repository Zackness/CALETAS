import { useEffect, useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { useNotasPredefinidas } from "@/app/(protected)/admin/hooks/use-notas-predefinidas";
import { useAbogados } from "@/app/(protected)/admin/hooks/use-abogados";
import { toast } from "sonner";
import axios from "axios";

interface NotaPredefinida {
  id: string;
  contenido: string;
}

interface AdminConfigProps {
  solicitudId: string;
  estadoActual: string;
  onEstadoChange: (estado: string) => void;
  isLoadingEstado: boolean;
}

export const AdminConfig = ({
  solicitudId,
  estadoActual,
  onEstadoChange,
  isLoadingEstado,
}: AdminConfigProps) => {
  const { getNotasPredefinidas, isLoading: isLoadingNotas } = useNotasPredefinidas();
  const { abogados, isLoading: isLoadingAbogados } = useAbogados();
  const [selectedNotaId, setSelectedNotaId] = useState<string>("");
  const [selectedAbogadoId, setSelectedAbogadoId] = useState<string>("");
  const [isLoadingNotaState, setIsLoadingNotaState] = useState(false);
  const [localNota, setLocalNota] = useState<string>("");
  const [notasPredefinidas, setNotasPredefinidas] = useState<NotaPredefinida[]>([]);
  const [notasLoaded, setNotasLoaded] = useState(false);

  // Función memoizada para cargar las notas predefinidas
  const loadNotasPredefinidas = useCallback(async () => {
    if (notasLoaded) return;
    
    try {
      const notas = await getNotasPredefinidas();
      setNotasPredefinidas(notas);
      setNotasLoaded(true);
    } catch (error) {
      console.error("Error al cargar notas predefinidas:", error);
    }
  }, [getNotasPredefinidas, notasLoaded]);

  // Efecto para cargar las notas predefinidas solo una vez al montar el componente
  useEffect(() => {
    loadNotasPredefinidas();
  }, [loadNotasPredefinidas]);

  // Efecto para cargar la nota actual cuando se abre el diálogo
  useEffect(() => {
    if (!solicitudId) return;

    const fetchNota = async () => {
      try {
        setIsLoadingNotaState(true);
        const response = await axios.get(`/api/solicitudes/${solicitudId}/nota`);
        
        if (response.data && response.data.id) {
          setLocalNota(response.data.contenido);
          setSelectedNotaId(response.data.id);
          console.log("Nota cargada:", response.data);
        } else {
          setLocalNota("");
          setSelectedNotaId("");
          console.log("No hay nota asociada a esta solicitud");
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setLocalNota("");
          setSelectedNotaId("");
          console.log("No hay nota asociada a esta solicitud (404)");
        } else {
          console.error("Error al cargar la nota:", error);
        }
      } finally {
        setIsLoadingNotaState(false);
      }
    };

    fetchNota();
  }, [solicitudId]);

  const handleNotaPredefinidaChange = async (notaId: string) => {
    setSelectedNotaId(notaId);
    const notaSeleccionada = notasPredefinidas.find((nota: NotaPredefinida) => nota.id === notaId);
    if (notaSeleccionada) {
      setLocalNota(notaSeleccionada.contenido);
      await handleSaveNota(notaSeleccionada.contenido);
    }
  };

  const handleSaveNota = async (contenidoNota: string) => {
    if (!solicitudId) return;

    try {
      // Primero intentamos obtener la nota existente
      const response = await axios.get(`/api/solicitudes/${solicitudId}/nota`);
      
      if (response.data && response.data.id) {
        // Actualizar nota existente
        await axios.put(`/api/solicitudes/${solicitudId}/nota`, {
          contenido: contenidoNota,
          notaId: response.data.id
        });
      } else {
        // Crear nueva nota
        await axios.post(`/api/solicitudes/${solicitudId}/nota`, {
          contenido: contenidoNota
        });
      }
      
      toast.success("Nota guardada correctamente");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Si no existe la nota, la creamos
        try {
          await axios.post(`/api/solicitudes/${solicitudId}/nota`, {
            contenido: contenidoNota
          });
          toast.success("Nota guardada correctamente");
        } catch (postError) {
          console.error("Error al crear la nota:", postError);
          toast.error("Error al guardar la nota");
        }
      } else {
        console.error("Error al guardar la nota:", error);
        toast.error("Error al guardar la nota");
      }
    }
  };

  const handleAbogadoChange = async (abogadoId: string) => {
    setSelectedAbogadoId(abogadoId);
    try {
      await axios.post(`/api/solicitudes/${solicitudId}/asignar-abogado`, {
        abogadoId: abogadoId
      });
      toast.success("Abogado asignado correctamente");
    } catch (error) {
      console.error("Error al asignar el abogado:", error);
      toast.error("Error al asignar el abogado");
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Configuración del abogado admin</h3>
        <p className="text-sm text-muted-foreground">
          En esta sección puedes asignar un abogado a la solicitud, asignar una nota predefinida según el estado actual de la solicitud.
        </p>
      </div>

      {/* Sección de estado */}
      {isLoadingEstado ? (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Estado actual de la solicitud</Label>
            <Select 
              value={estadoActual} 
              onValueChange={onEstadoChange}
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

      {/* Sección de notas */}
      <div>
        {isLoadingNotaState ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Combobox de notas predefinidas */}
            <div className="space-y-2">
              <Label>Asigna una nota a la solicitud según el estado actual</Label>
              <div className="w-full">
                <Combobox
                  options={notasPredefinidas.map((nota: NotaPredefinida) => ({
                    value: nota.id,
                    label: nota.contenido
                  }))}
                  value={selectedNotaId}
                  onChange={handleNotaPredefinidaChange}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sección de asignación de abogado */}
      <div>       
        {isLoadingAbogados ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Asigna un abogado a la solicitud</Label>
              <div className="w-full">
                <Combobox
                  options={abogados.map(abogado => ({
                    value: abogado.id,
                    label: `${abogado.name} - ${abogado.cedula}`
                  }))}
                  value={selectedAbogadoId}
                  onChange={handleAbogadoChange}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 