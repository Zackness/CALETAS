"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CategoriaServicio } from "./categoria-servicio";
import { CategoryTable } from "./category-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

// Definir un tipo personalizado para las solicitudes
interface CustomRequest {
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

interface ListadoServiciosProps {
  servicios: {
    id: string;
    nombre: string;
    documentos: {
      id: string;
      nombre: string;
    }[];
  }[];
  solicitudes: {
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
      image: string;
    };
  }[];
}

export const ListadoServicios = ({ servicios, solicitudes }: ListadoServiciosProps) => {
  const [activeCategory, setActiveCategory] = useState(servicios[0]?.id || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState("Todos");
  const [filterPriority, setFilterPriority] = useState("Todas");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Transformar solicitudes en el formato esperado por CategoryTable
  const requestsByCategory = servicios.reduce((acc, servicio) => {
    // Filtrar solicitudes para esta categoría
    const solicitudesCategoria = solicitudes.filter(
      (solicitud) => solicitud.documento.servicio.id === servicio.id
    );
    
    // Transformar a formato CustomRequest
    acc[servicio.id] = solicitudesCategoria.map((solicitud) => ({
      id: solicitud.id,
      client: {
        avatar: solicitud.usuario.image || "/default-avatar.png",
        name: solicitud.usuario.name || "Usuario",
        email: solicitud.usuario.email || "usuario@example.com",
      },
      documentType: solicitud.documento.nombre,
      status: solicitud.estado,
      date: solicitud.fecha,
      priority: solicitud.prioridad,
    }));
    return acc;
  }, {} as Record<string, CustomRequest[]>);

  // Filtrar solicitudes según el término de búsqueda y los filtros seleccionados
  const filteredRequests = requestsByCategory[activeCategory]?.filter((request) => {
    const matchesSearch = request.documentType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = filterState === "Todos" || request.status === filterState;
    const matchesPriority = filterPriority === "Todas" || request.priority === filterPriority;

    return matchesSearch && matchesState && matchesPriority;
  }) || [];

  // Verificar si hay filtros activos
  const hasActiveFilters = filterState !== "Todos" || filterPriority !== "Todas" || searchTerm !== "";

  return (
    <Tabs
      defaultValue={activeCategory}
      value={activeCategory}
      onValueChange={setActiveCategory}
      className="w-full"
    >
      {/* Sección de filtros activos - siempre visible */}
      <div className="mb-4 p-2 bg-muted/30 rounded-md text-sm">
        <span className="font-medium">Filtros activos:</span>
        {filterState !== "Todos" && <span className="ml-2">Estado: {filterState}</span>}
        {filterPriority !== "Todas" && <span className="ml-2">Prioridad: {filterPriority}</span>}
        {searchTerm !== "" && <span className="ml-2">Búsqueda: "{searchTerm}"</span>}
        {!hasActiveFilters && <span className="ml-2 text-muted-foreground">Ningún filtro activo</span>}
      </div>

      <div className="flex items-center justify-between mb-6 gap-2">
        {/* Componente CategoriasServicios */}
        <CategoriaServicio
          categories={servicios.map((servicio) => ({
            id: servicio.id,
            nombre: servicio.nombre,
          }))}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* Campo de búsqueda y filtrado */}
        <div className="flex items-center gap-2 pt-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar servicios..."
              className="pl-8 h-9 md:w-[200px] lg:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className={`h-9 w-9 ${hasActiveFilters ? "bg-foreground text-background" : ""}`}
              >
                <Filter className="h-4 w-4" />
                <span className="sr-only">Filtrar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-background" align="end">
              <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilterState("Todos")}>Todos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterState("FINALIZADA")}>Finalizadas</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterState("EN_PROGRESO")}>En progreso</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterState("PENDIENTE")}>Pendientes</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filtrar por prioridad</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilterPriority("Todas")}>Todas</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("ALTA")}>Alta</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("NORMAL")}>Normal</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("BAJA")}>Baja</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Contenido de las categorías */}
      <div className="min-h-[400px]">
        {servicios.map((servicio) => (
          <TabsContent key={servicio.id} value={servicio.id} className="mt-0">
            <CategoryTable
              categoryId={servicio.id}
              filteredRequests={filteredRequests}
              requestsByCategory={requestsByCategory}
              getPriorityIcon={(priority) => {
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
              }}
            />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
};