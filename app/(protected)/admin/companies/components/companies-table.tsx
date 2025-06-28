"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Building2,
} from "lucide-react";
import { TipoEmpresa } from "@prisma/client";

interface Company {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  RIF: string;
  persona_de_contacto: string;
  email: string;
  tipo: TipoEmpresa;
  createdAt: Date;
  updatedAt: Date;
}

interface CompaniesTableProps {
  companies: Company[];
  onEdit: (company: Company) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export const CompaniesTable = ({
  companies,
  onEdit,
  onDelete,
  isLoading,
}: CompaniesTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("Todos");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filtrar empresas según el término de búsqueda y el filtro de tipo
  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = 
      company.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.RIF.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.persona_de_contacto.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "Todos" || company.tipo === filterType;

    return matchesSearch && matchesType;
  });

  // Verificar si hay filtros activos
  const hasActiveFilters = filterType !== "Todos" || searchTerm !== "";

  const getTipoBadgeColor = (tipo: TipoEmpresa) => {
    switch (tipo) {
      case "SEGURO":
        return "bg-blue-100 text-blue-800";
      case "TELECOMUNICACIONES":
        return "bg-green-100 text-green-800";
      case "BANCO":
        return "bg-purple-100 text-purple-800";
      case "INDUSTRIAL":
        return "bg-orange-100 text-orange-800";
      case "NINGUNO":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span>Cargando empresas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nombre, RIF, email o contacto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="h-4 w-4 mr-2" />
              Tipo: {filterType}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filtrar por tipo</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setFilterType("Todos")}>
              Todos los tipos
            </DropdownMenuItem>
            {Object.values(TipoEmpresa).map((tipo) => (
              <DropdownMenuItem
                key={tipo}
                onClick={() => setFilterType(tipo)}
              >
                {tipo.replace(/_/g, " ")}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filtros activos */}
      {hasActiveFilters && (
        <div className="px-4 py-2 bg-muted/30 rounded-md text-sm">
          <span className="font-medium">Filtros activos:</span>
          {filterType !== "Todos" && <span className="ml-2">Tipo: {filterType.replace(/_/g, " ")}</span>}
          {searchTerm !== "" && <span className="ml-2">Búsqueda: &quot;{searchTerm}&quot;</span>}
        </div>
      )}

      {/* Tabla */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>RIF</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Fecha de registro</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="h-8 w-8 text-gray-400" />
                    <p className="text-gray-500">
                      {companies.length === 0 
                        ? "No hay empresas registradas" 
                        : "No se encontraron empresas con los filtros aplicados"
                      }
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{company.nombre}</div>
                      <div className="text-sm text-gray-500">{company.direccion}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{company.RIF}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{company.persona_de_contacto}</div>
                      <div className="text-sm text-gray-500">{company.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTipoBadgeColor(company.tipo)}>
                      {company.tipo.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{company.telefono}</TableCell>
                  <TableCell>{formatDate(company.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEdit(company)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete(company.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}; 