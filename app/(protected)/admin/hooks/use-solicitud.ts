import { useState, useEffect } from "react";
import axios from "axios";

interface SolicitudData {
  id: number;
  documentoId: string;
  usuarioId: string;
  createdAt: string;
  estado: string;
  updatedAt: string;
  familiarId?: string;
  notaId?: string;
  nota?: {
    id: string;
    contenido: string;
  };
  detalle?: {
    id: string;
    solicitudId: number;
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
    solicitud_finalizada?: string;
    pasaporte?: string;
    visa?: string;
    otros_documentos1?: string;
    otros_documentos2?: string;
    otros_documentos3?: string;
  } | null;
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
    telefono?: string;
    cedula?: string;
  };
  familiar?: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    telefono?: string;
    cedula?: string;
  } | null;
}

interface Detalle {
  id: string;
  solicitudId: number;
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
  solicitud_finalizada?: string;
  pasaporte?: string;
  visa?: string;
  otros_documentos1?: string;
  otros_documentos2?: string;
  otros_documentos3?: string;
}

interface Solicitud {
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
    telefono?: string;
    cedula?: string;
  };
  familiar: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    telefono?: string;
    cedula?: string;
  } | null;
  detalle: Detalle | null;
  nota: {
    id: string;
    contenido: string;
    createdAt: string;
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