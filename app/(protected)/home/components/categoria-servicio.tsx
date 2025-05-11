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

// Mapeo de colores para las categorias de servicios
const colorMap: Record<string, string> = {
    Automovil: "from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600",
    Vivienda: "from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600",
    Viajero: "from-purple-500 to-indigo-500 dark:from-purple-600 dark:to-indigo-600",
    Herencia: "from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600",
    Personal: "from-pink-500 to-rose-500 dark:from-pink-600 dark:to-rose-600",
    Empresarial: "from-blue-600 to-violet-600 dark:from-blue-700 dark:to-violet-700",
    Migrante: "from-teal-500 to-cyan-500 dark:from-teal-600 dark:to-cyan-600",
    Financiera: "from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700",
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
        <TabsList className="flex
        justify-start overflow-x-auto overflow-y-clip bg-background py-8 px-1 rounded-lg gap-x-2 ">
            {categories.map((category) => {
                const Icon = iconMap[category.nombre]; //Obtener el icono correspondiente
                const isActive = category.id === activeCategory;
                const gradientColor = colorMap[category.nombre] || "from-gray-500 to-gray-600";
                
                return (
                    <TabsTrigger
                        key={category.id}
                        value={category.id}
                        className={`flex items-center space-x-2 rounded-lg p-2 border-2 ${
                            isActive 
                                ? `bg-gradient-to-r ${gradientColor} text-white` 
                                : "bg-muted/50 hover:bg-muted"
                        }`}
                    >
                        {Icon && <Icon className="h-4 w-4" />} {/* Renderizar el icono si existe */}
                        <span className="text-sm font-medium">{category.nombre}</span>
                    </TabsTrigger>
                );
            })}
        </TabsList>
    );
};