"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar, MoreHorizontal } from "lucide-react";

interface Request {
  id: string;
  client: {
    avatar: string;
    name: string;
    email: string;
  };
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
    default:
      return <span className="border rounded px-2 py-1 text-xs">Desconocido</span>;
  }
};

export const CategoryTable = ({
  categoryId,
  filteredRequests,
  requestsByCategory,
  getPriorityIcon,
}: CategoryTableProps) => {
  return (
    <div className="mt-0">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
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
            {filteredRequests.length > 0 ? (
              filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={request.client.avatar} alt={request.client.name} />
                        <AvatarFallback>
                          {request.client.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{request.client.name}</div>
                        <div className="text-xs text-muted-foreground">{request.client.email}</div>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                        <DropdownMenuItem>Editar solicitud</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Eliminar solicitud
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  {requestsByCategory[categoryId]?.length === 0
                    ? "No hay solicitudes en esta categoría."
                    : "No se encontraron solicitudes que coincidan con la búsqueda."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};