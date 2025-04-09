"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Building, Plane, HeartHandshake, User, Briefcase, Globe, CreditCard } from "lucide-react";
import { string } from "zod";

// Mapeo de iconos para las categorias de servicios

const iconMap: Record<string, React.ElementType> = {
    Automovil: Car,
    Vivienda: Building,
    Viajero: Plane,
    Herencia: HeartHandshake,
    Personal: User,
    Empresarial: Briefcase,
    Migrante: Globe,
    Financiera: CreditCard,
};

interface CategoriaServicioProps {
    categories: {
        id: string;
        nombre: string;
    }[];
    activeCategory: string;
    onCategoryChange: (category: string) => void;
}

export const CategoriaServicio = ({
    categories,
    activeCategory,
    onCategoryChange,
}: CategoriaServicioProps) => {
    return (
        <TabsList className="bg-muted/50 p-1 rounded-lg">
            {categories.map((category) => {
                const Icon = iconMap[category.nombre]; //Obtener el icono correspondiente
                return (
                    <TabsTrigger
                        key={category.id}
                        value={category.nombre}
                        onClick={() => onCategoryChange(category.id)}
                        className="flex items-center space-x-2 rounded-lg p-2"
                    >
                        {Icon && <Icon className="h-4 w-4" />} {/* Renderizar el icono si existe */}
                        <span className="text-sm font-medium">{category.nombre}</span>
                    </TabsTrigger>
                );
            })}
        </TabsList>
    );
};