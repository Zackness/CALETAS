"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CategoriaServicio } from "./categoria-servicio"; // Importar el componente CategoriasServicios
import { CategoryTable } from "./category-table"; // Importar el nuevo componente
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
}

export const ListadoServicios = ({ servicios }: ListadoServiciosProps) => {
  const [activeCategory, setActiveCategory] = useState(servicios[0]?.id || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState("Todos");
  const [filterPriority, setFilterPriority] = useState("Todas");

  // Transformar servicios en solicitudes (CustomRequest[])
  const requestsByCategory = servicios.reduce((acc, servicio) => {
    acc[servicio.id] = servicio.documentos.map((documento) => ({
      id: documento.id,
      client: {
        avatar: "/default-avatar.png", // Placeholder para avatar
        name: "Cliente genérico", // Placeholder para nombre del cliente
        email: "cliente@example.com", // Placeholder para email del cliente
      },
      documentType: documento.nombre,
      status: "Pendiente", // Placeholder para estado
      date: new Date().toISOString(), // Placeholder para fecha
      priority: "Normal", // Placeholder para prioridad
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

  return (
    <Tabs
      defaultValue={activeCategory}
      value={activeCategory}
      onValueChange={setActiveCategory}
      className="w-full"
    >
      <div className="flex items-center justify-between mb-6">
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
        {/* Campo de búsqueda y filtrado */}
        <div className="flex items-center gap-2">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Filter className="h-4 w-4" />
                <span className="sr-only">Filtrar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilterState("Todos")}>Todos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterState("Completados")}>Completados</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterState("En progreso")}>En progreso</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterState("Pendientes")}>Pendientes</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filtrar por prioridad</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilterPriority("Todas")}>Todas</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("Alta")}>Alta</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("Normal")}>Normal</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("Baja")}>Baja</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Contenido de las categorías */}
      {servicios.map((servicio) => (
        <TabsContent key={servicio.id} value={servicio.id} className="mt-0">
          <CategoryTable
            categoryId={servicio.id}
            filteredRequests={filteredRequests}
            requestsByCategory={requestsByCategory}
            getPriorityIcon={(priority) => <span>{priority}</span>} // Placeholder para getPriorityIcon
          />
        </TabsContent>
      ))}
    </Tabs>
  );
};