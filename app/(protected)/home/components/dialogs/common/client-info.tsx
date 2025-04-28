import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, AlertCircle } from "lucide-react";

interface ClientInfoProps {
  name: string;
  email: string;
  avatar?: string;
  telefono?: string;
  cedula?: string;
  isMainUser?: boolean;
  estado?: string;
  prioridad?: string;
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

export const ClientInfo = ({ 
  name, 
  email, 
  avatar, 
  telefono, 
  cedula, 
  isMainUser = true,
  estado,
  prioridad
}: ClientInfoProps) => {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Información del solicitante</h3>
      <div className="flex items-start gap-4">
        {/* Avatar a la izquierda */}
        <Avatar className="h-12 w-12">
          <AvatarImage 
            src={avatar} 
            alt={name || "Avatar"} 
          />
          <AvatarFallback>
            {(name || "Sin nombre")
              .substring(0, 2)
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {/* Información principal (nombre y cédula) */}
        <div className="flex-1">
          <p className="font-medium">{name || "Sin nombre"}</p>
          <p className="text-sm text-muted-foreground">
            {isMainUser ? "Usuario principal" : "Familiar"}
          </p>
        </div>
        
        {/* Información de contacto (teléfono y correo) */}
        <div className="flex-1">
          <p className="text-sm">
            <span className="font-medium">Teléfono:</span> {telefono || "Sin teléfono"}
          </p>
          <p className="text-sm">
            <span className="font-medium">Correo:</span> {email || "Sin email"}
          </p>
          <p className="text-sm mt-1">
            <span className="font-medium">Cédula:</span> {cedula || "Sin cédula"}
          </p>    
        </div>
      </div>
      
      {/* Sección del badge y prioridad */}
      {(estado || prioridad) && (
        <div className="flex items-center justify-between">
          {estado && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Estado:</span>
              </div>
              {getStatusBadge(estado)}
            </div>
          )}

          {prioridad && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Prioridad:</span>
              </div>
              <div className="flex items-center gap-2">
                {getPriorityIcon(prioridad)}
                <span className="text-sm capitalize">{prioridad}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 