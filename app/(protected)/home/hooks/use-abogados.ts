import { useState, useEffect } from "react";
import axios from "axios";

interface Abogado {
  id: string;
  name: string;
  email: string;
  cedula: string;
  telefono: string | null;
}

export const useAbogados = () => {
  const [abogados, setAbogados] = useState<Abogado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAbogados = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/abogados');
      setAbogados(response.data);
      setError(null);
    } catch (error) {
      console.error('Error al obtener abogados:', error);
      setError('Error al cargar la lista de abogados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAbogados();
  }, []);

  return {
    abogados,
    isLoading,
    error,
    refetch: getAbogados
  };
}; 