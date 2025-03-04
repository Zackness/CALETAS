"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ComboboxProps {
    options: { label: string; value: string }[];
    value?: string;
    onChange: (value: string) => void;
};

export const Combobox = ({
    options,
    value,
    onChange,
}: ComboboxProps) => {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-foreground hover:text-foreground/50"
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : "¿Quien solicita el documento?"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 m-0 border-none text-foreground">
        <Command className="w-full p-0 m-0 border-none text-black rounded-xl">
          <CommandInput className="p-5" placeholder="Buscar miembro de la familia..." />
          <CommandList>
            <CommandEmpty className="p-3">No se han encontrado resultados.</CommandEmpty>
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

