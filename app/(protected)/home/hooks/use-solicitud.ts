import { useState, useEffect } from "react";
import axios from "axios";

interface SolicitudData {
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
  usuario: {
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
  } | null;
}

export const useSolicitud = (solicitudId: string) => {
  const [solicitud, setSolicitud] = useState<SolicitudData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSolicitud = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/solicitudes/${solicitudId}`);
        console.log("Respuesta de la API:", response.data);
        setSolicitud(response.data);
        setError(null);
      } catch (err) {
        console.error("Error al obtener la solicitud:", err);
        setError("Error al cargar los datos de la solicitud");
      } finally {
        setLoading(false);
      }
    };

    if (solicitudId) {
      fetchSolicitud();
    }
  }, [solicitudId]);

  return { solicitud, loading, error };
}; 