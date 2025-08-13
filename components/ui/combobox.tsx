"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ComboboxOption {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
    semestre?: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    variant?: 'default' | 'academic';
};

export const Combobox = ({
    options,
    value,
    onChange,
    placeholder,
    className,
    disabled = false,
    variant = 'default',
}: ComboboxProps) => {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()
  const isAdminRoute = pathname?.includes('/admin')
  const isAcademicVariant = variant === 'academic'

  // Agrupar opciones por semestre si es variante académica
  const groupedOptions = isAcademicVariant ? options.reduce((acc, option) => {
    const semestre = option.semestre || "Sin semestre";
    if (!acc[semestre]) {
      acc[semestre] = [];
    }
    acc[semestre].push(option);
    return acc;
  }, {} as Record<string, ComboboxOption[]>) : null;

  // Ordenar semestres si es variante académica
  const sortedSemestres = isAcademicVariant && groupedOptions ? Object.keys(groupedOptions).sort((a, b) => {
    if (a === "Sin semestre") return 1;
    if (b === "Sin semestre") return -1;
    return a.localeCompare(b);
  }) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between",
            isAcademicVariant 
              ? "bg-[#1C2D20] border-white/10 text-white hover:bg-white/10" 
              : "text-foreground hover:text-foreground/50",
            className
          )}
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder || (isAdminRoute 
              ? "¿Qué abogado trabajará en este documento?"
              : "¿Quien solicita el documento?")}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn(
        "w-[var(--radix-popover-trigger-width)] p-0 m-0 border-none",
        isAcademicVariant ? "bg-[#1C2D20] border-white/10" : "text-foreground"
      )}>
        <Command className={cn(
          "w-full p-0 m-0 border-none rounded-xl",
          isAcademicVariant ? "bg-[#1C2D20]" : "text-black"
        )}>
          <CommandInput 
            className={cn(
              "p-5",
              isAcademicVariant ? "border-none bg-transparent text-white placeholder:text-white/50 focus:ring-0" : ""
            )} 
            placeholder={isAcademicVariant ? "Buscar materia..." : (isAdminRoute ? "Buscar abogado..." : "Buscar miembro de la familia...")} 
          />
          <CommandList>
            <CommandEmpty className={cn(
              "p-3",
              isAcademicVariant ? "text-white/70" : ""
            )}>
              {isAcademicVariant ? "No se encontraron materias." : "No se han encontrado resultados."}
            </CommandEmpty>
            {isAcademicVariant && sortedSemestres ? (
              sortedSemestres.map((semestre) => (
                <CommandGroup key={semestre} heading={semestre} className="text-white/70">
                  {groupedOptions![semestre].map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <CommandItem
                        className="text-white hover:bg-white/10 cursor-pointer"
                        key={option.value}
                        value={option.value}
                        onSelect={(currentValue) => {
                          onChange(option.value === value ? "" : option.value)
                          setOpen(false)
                        }}
                      >
                        <div className="flex items-center gap-2 w-full">
                          {IconComponent && (
                            <IconComponent className="h-4 w-4 text-white/70" />
                          )}
                          <span>{option.label}</span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))
            ) : (
              <CommandGroup className="p-0">
                {options.map((option) => (
                  <CommandItem
                    className={cn(
                      "cursor-pointer text-foreground",
                      value === option.value ? "opacity-100" : ""
                    )}
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      onChange(option.value === value ? "" : option.value)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-foreground",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

