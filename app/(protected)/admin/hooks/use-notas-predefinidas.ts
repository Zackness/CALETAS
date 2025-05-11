import { useState, useCallback } from "react";
import { toast } from "sonner";

interface NotaPredefinida {
  id: string;
  contenido: string;
}

export const useNotasPredefinidas = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [notasCache, setNotasCache] = useState<NotaPredefinida[] | null>(null);

  const getNotasPredefinidas = useCallback(async (): Promise<NotaPredefinida[]> => {
    // Si ya tenemos las notas en caché, las devolvemos
    if (notasCache) {
      return notasCache;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/notas-predefinidas");
      
      if (!response.ok) {
        throw new Error("Error al obtener las notas predefinidas");
      }

      const data = await response.json();
      // Guardamos las notas en caché
      setNotasCache(data);
      return data;
    } catch (error) {
      console.error("Error en getNotasPredefinidas:", error);
      toast.error("Error al obtener las notas predefinidas");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [notasCache]);

  return {
    getNotasPredefinidas,
    isLoading,
  };
}; 