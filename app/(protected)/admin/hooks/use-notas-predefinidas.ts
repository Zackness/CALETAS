import { useState } from "react";
import { toast } from "sonner";

interface NotaPredefinida {
  id: string;
  contenido: string;
}

export const useNotasPredefinidas = () => {
  const [isLoading, setIsLoading] = useState(false);

  const getNotasPredefinidas = async (): Promise<NotaPredefinida[]> => {
    try {
      setIsLoading(true);
      console.log("Obteniendo notas predefinidas...");
      const response = await fetch("/api/notas-predefinidas");
      
      if (!response.ok) {
        console.error("Error al obtener notas predefinidas:", response.status, response.statusText);
        throw new Error("Error al obtener las notas predefinidas");
      }

      const data = await response.json();
      console.log("Notas predefinidas obtenidas:", data);
      return data;
    } catch (error) {
      console.error("Error en getNotasPredefinidas:", error);
      toast.error("Error al obtener las notas predefinidas");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getNotasPredefinidas,
    isLoading,
  };
}; 