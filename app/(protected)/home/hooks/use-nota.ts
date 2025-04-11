import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UseNotaProps {
  solicitudId: string;
}

export const useNota = ({ solicitudId }: UseNotaProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const getNota = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/solicitudes/${solicitudId}/nota`);
      
      if (!response.ok) {
        throw new Error("Error al obtener la nota");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      toast.error("Error al obtener la nota");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createNota = async (contenido: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/solicitudes/${solicitudId}/nota`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contenido }),
      });

      if (!response.ok) {
        throw new Error("Error al crear la nota");
      }

      toast.success("Nota creada exitosamente");
      router.refresh();
    } catch (error) {
      toast.error("Error al crear la nota");
    } finally {
      setIsLoading(false);
    }
  };

  const updateNota = async (contenido: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/solicitudes/${solicitudId}/nota`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contenido }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar la nota");
      }

      toast.success("Nota actualizada exitosamente");
      router.refresh();
    } catch (error) {
      toast.error("Error al actualizar la nota");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNota = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/solicitudes/${solicitudId}/nota`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar la nota");
      }

      toast.success("Nota eliminada exitosamente");
      router.refresh();
    } catch (error) {
      toast.error("Error al eliminar la nota");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    getNota,
    createNota,
    updateNota,
    deleteNota,
  };
}; 