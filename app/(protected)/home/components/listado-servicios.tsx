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
  detalle?: {
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
    Acta_de_divorcio?: string;
    Acta_de_defuncion?: string;
  } | null;
  notas?: {
    id: string;
    contenido: string;
    createdAt: string;
  }[];
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
    client: {
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
      bienes_generico1?: string;
      bienes_generico2?: string;
      bienes_generico3?: string;
      bienes_generico4?: string;
      bienes_generico5?: string;
      Acta_de_nacimiento?: string;
      Acta_de_matrimonio?: string;
      Acta_de_divorcio?: string;
      Acta_de_defuncion?: string;
    } | null;
    notas?: {
      id: string;
      contenido: string;
      createdAt: string;
    }[];
  }[];
}

// Mapeo de colores para las categorias de servicios
const colorMap: Record<string, string> = {
  Automovil: "border-blue-500 dark:border-blue-600",
  Vivienda: "border-green-500 dark:border-green-600",
  Viajero: "border-purple-500 dark:border-purple-600",
  Herencia: "border-amber-500 dark:border-amber-600",
  Personal: "border-pink-500 dark:border-pink-600",
  Empresarial: "border-blue-600 dark:border-blue-700",
  Migrante: "border-teal-500 dark:border-teal-600",
  Financiera: "border-emerald-500 dark:border-emerald-600",
};

export const ListadoServicios = ({ servicios, solicitudes }: ListadoServiciosProps) => {
  // Encontrar la primera categoría que tenga solicitudes
  const firstCategoryWithRequests = servicios.find(servicio => 
    solicitudes.some(solicitud => solicitud.documento.servicio.id === servicio.id)
  );

  const [activeCategory, setActiveCategory] = useState(firstCategoryWithRequests?.id || servicios[0]?.id || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState("Todos");
  const [filterPriority, setFilterPriority] = useState("Todas");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Obtener el nombre de la categoría activa
  const activeCategoryName = servicios.find(servicio => servicio.id === activeCategory)?.nombre || "";
  
  // Obtener el color de borde para la categoría activa
  const activeCategoryBorderColor = colorMap[activeCategoryName] || "border-gray-500";

  // Transformar solicitudes en el formato esperado por CategoryTable
  const requestsByCategory = servicios.reduce((acc, servicio) => {
    // Filtrar solicitudes para esta categoría
    const solicitudesCategoria = solicitudes.filter(
      (solicitud) => solicitud.documento.servicio.id === servicio.id
    );
    
    // Transformar a formato CustomRequest
    acc[servicio.id] = solicitudesCategoria.map((solicitud) => ({
      id: solicitud.id,
      client: solicitud.familiar ? {
        avatar: solicitud.familiar.avatar || "/default-avatar.png",
        name: solicitud.familiar.name || "Familiar",
        email: solicitud.familiar.email || "Sin teléfono",
      } : {
        avatar: solicitud.client.avatar || "/default-avatar.png",
        name: solicitud.client.name || "Usuario",
        email: solicitud.client.email || "usuario@example.com",
      },
      documentType: solicitud.documento.nombre,
      status: solicitud.estado,
      date: solicitud.fecha,
      priority: solicitud.prioridad,
      detalle: solicitud.detalle || null,
      notas: solicitud.notas || [],
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

  // Función para obtener el icono de prioridad
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "ALTA":
        return <span className="text-red-500">●</span>;
      case "NORMAL":
        return <span className="text-yellow-500">●</span>;
      case "URGENTE":
        return <span className="text-red-700">●</span>;
      default:
        return <span>●</span>;
    }
  };

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
        {searchTerm !== "" && <span className="ml-2">Búsqueda: &quot;{searchTerm}&quot;</span>}
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
              placeholder="Buscar documentos..."
              className="pl-8 w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterState("Todos")}>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterState("PENDIENTE")}>
                Pendientes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterState("APROBADA")}>
                Aprobadas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterState("EN_PROGRESO")}>
                En proceso
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterState("FINALIZADA")}>
                Finalizadas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterState("RECHAZADA")}>
                Rechazadas
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filtrar por prioridad</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterPriority("Todas")}>
                Todas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("NORMAL")}>
                Normal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("ALTA")}>
                Alta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("URGENTE")}>
                Urgente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Contenido de las pestañas */}
      {servicios.map((servicio) => (
        <TabsContent key={servicio.id} value={servicio.id} className="mt-0">
          <div className={`border-2 rounded-lg p-4 ${activeCategoryBorderColor}`}>
            <CategoryTable 
              categoryId={servicio.id}
              filteredRequests={filteredRequests}
              requestsByCategory={requestsByCategory}
              getPriorityIcon={getPriorityIcon}
            />
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};