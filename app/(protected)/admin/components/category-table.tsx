"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { PersonalDialog } from "./dialogs/personal/personal-dialog";

interface Request {
  id: string;
  client: {
    avatar: string;
    name: string;
    email: string;
  };
  familiar?: {
    avatar: string;
    name: string;
    email: string;
  } | null;
  documentType: string;
  status: string;
  date: string;
  priority: string;
}

interface CategoryTableProps {
  categoryId: string;
  filteredRequests: Request[];
  requestsByCategory: Record<string, Request[]>;
  getPriorityIcon: (priority: string) => React.ReactNode;
  onStatusChange?: (requestId: string, newStatus: string) => void;
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

export const CategoryTable = ({
  categoryId,
  filteredRequests,
  requestsByCategory,
  getPriorityIcon,
  onStatusChange,
}: CategoryTableProps) => {
  // Estado para controlar el diálogo de detalles
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [localRequests, setLocalRequests] = useState<Request[]>(filteredRequests);

  // Actualizar solicitudes locales cuando cambien las filtradas
  useEffect(() => {
    setLocalRequests(filteredRequests);
  }, [filteredRequests]);

  // Función para manejar cambios de estado
  const handleStatusChange = (requestId: string, newStatus: string) => {
    setLocalRequests(prevRequests => 
      prevRequests.map(request => 
        request.id === requestId 
          ? { ...request, status: newStatus }
          : request
      )
    );
    onStatusChange?.(requestId, newStatus);
  };

  // Función para abrir el diálogo con los detalles de la solicitud
  const handleViewDetails = (request: Request) => {
    console.log("Abriendo solicitud:", request.id);
    setSelectedRequestId(request.id);
    setDialogOpen(true);
  };

  // Función para cerrar el diálogo
  const handleCloseDialog = () => {
    console.log("Cerrando diálogo");
    setDialogOpen(false);
  };

  // Log para depuración
  console.log(`Categoría ${categoryId}:`, {
    total: requestsByCategory[categoryId]?.length || 0,
    filtradas: localRequests.length,
    ids: localRequests.map(r => r.id)
  });

  return (
    <div className="h-[400px] flex flex-col">
      <div className="rounded-md border flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo de documento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localRequests.length > 0 ? (
              localRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={request.familiar ? request.familiar.avatar : request.client.avatar} 
                          alt={request.familiar ? request.familiar.name : request.client.name} 
                        />
                        <AvatarFallback>
                          {(request.familiar ? request.familiar.name : request.client.name)
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {request.familiar ? request.familiar.name : request.client.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {request.familiar ? request.familiar.email : request.client.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{request.documentType}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(request.date).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(request.priority)}
                      <span className="capitalize">{request.priority}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleViewDetails(request)}
                      title="Ver detalles"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Ver detalles</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-[300px] text-center py-6 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center h-full">
                    <p className="text-lg font-medium mb-2">
                      {requestsByCategory[categoryId]?.length === 0
                        ? "No hay solicitudes en este servicio."
                        : "No se encontraron solicitudes que coincidan con la búsqueda."}
                    </p>
                    <p className="text-sm">
                      {requestsByCategory[categoryId]?.length === 0
                        ? "Las solicitudes aparecerán aquí cuando las crees."
                        : "Intenta con otros filtros o términos de búsqueda."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de detalles de la solicitud */}
      {selectedRequestId && (
        <PersonalDialog 
          solicitudId={selectedRequestId} 
          isOpen={dialogOpen} 
          onClose={handleCloseDialog}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};