"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Familiar } from "@prisma/client";

interface FamiliaresTableProps {
  familiares: Familiar[];
  onEdit: (familiar: Familiar) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export const FamiliaresTable = ({
  familiares,
  onEdit,
  onDelete,
  isLoading
}: FamiliaresTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead>Nombre Completo</TableHead>
            <TableHead>Cédula</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Parentesco</TableHead>
            <TableHead className="w-[120px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-[300px] text-center">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </TableCell>
            </TableRow>
          ) : familiares.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-[300px] text-center py-6 text-muted-foreground">
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-lg font-medium mb-2">No hay familiares registrados</p>
                  <p className="text-sm">Los familiares aparecerán aquí cuando los agregues.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            familiares.map((familiar) => (
              <TableRow key={familiar.id} className="hover:bg-muted/50">
                <TableCell>
                  {familiar.nombre} {familiar.nombre2} {familiar.apellido} {familiar.apellido2}
                </TableCell>
                <TableCell>{familiar.cedula}</TableCell>
                <TableCell>{familiar.telefono || 'No registrado'}</TableCell>
                <TableCell>
                  {familiar.parentesco.charAt(0) + familiar.parentesco.slice(1).toLowerCase()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(familiar)}
                      title="Editar familiar"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar familiar</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => onDelete(familiar.id)}
                      title="Eliminar familiar"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar familiar</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}; 