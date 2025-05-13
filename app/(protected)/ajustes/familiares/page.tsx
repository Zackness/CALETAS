"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useTransition, useState, useEffect } from "react";
import { Form, FormField, FormControl, FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormSucces } from "@/components/form-succes";
import { FormError } from "@/components/form-error";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Parentesco } from "@prisma/client";
import { toast } from "react-hot-toast";
import { Card } from "@/components/ui/card";

const FamiliarSchema = z.object({
  ciPhoto: z.string().optional(),
  telefono: z.string().min(10, "El teléfono debe tener al menos 10 dígitos").optional(),
  parentesco: z.nativeEnum(Parentesco),
});

interface Familiar {
  id: string;
  nombre: string;
  nombre2: string | null;
  apellido: string | null;
  apellido2: string | null;
  cedula: string;
  telefono: string | null;
  parentesco: Parentesco;
}

export default function FamiliaresPage() {
  const user = useCurrentUser();
  const [error, setError] = useState<string | undefined>();
  const [succes, setSucces] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const [familiares, setFamiliares] = useState<Familiar[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof FamiliarSchema>>({
    resolver: zodResolver(FamiliarSchema),
    defaultValues: {
      ciPhoto: undefined,
      telefono: undefined,
      parentesco: undefined,
    }
  });

  // Cargar familiares existentes
  useEffect(() => {
    const fetchFamiliares = async () => {
      try {
        const response = await fetch('/api/familiares');
        if (!response.ok) throw new Error('Error al cargar familiares');
        const data = await response.json();
        setFamiliares(data);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al cargar familiares');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFamiliares();
  }, []);

  const onSubmit = async (values: z.infer<typeof FamiliarSchema>) => {
    setError(undefined);
    setSucces(undefined);

    try {
      const response = await fetch('/api/familiares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Error al agregar familiar');
      }

      const data = await response.json();
      setFamiliares(prev => [...prev, data]);
      toast.success('Familiar agregado exitosamente');
      form.reset();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al agregar familiar');
    }
  };

  const handleDeleteFamiliar = async (id: string) => {
    try {
      const response = await fetch(`/api/familiares/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar familiar');
      }

      setFamiliares(prev => prev.filter(f => f.id !== id));
      toast.success('Familiar eliminado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar familiar');
    }
  };

  return (
    <div className="w-full flex flex-col items-center text-foreground py-10">
      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-[#4cac27] to-[#EAD70E] text-white/0 bg-clip-text">
        Gestión de Familiares
      </h1>

      <div className="w-screen px-20 md:px-48 lg:w-[1135px] lg:px-[200px] 2xl:w-[1615px] 2xl:px-[300px] mb-10">
        <Card className="p-6 mb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="parentesco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parentesco</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-blue-500 bg-fm-blue-3 rounded-xl text-foreground">
                          <SelectValue placeholder="Selecciona el parentesco" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(Parentesco).map((parentesco) => (
                          <SelectItem key={parentesco} value={parentesco}>
                            {parentesco.charAt(0) + parentesco.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ciPhoto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subir cédula del familiar</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          className="border-none bg-blue-500 rounded-xl text-foreground"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                field.onChange(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          disabled={isPending}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          disabled={isPending || !field.value}
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/user/onboarding/analyze', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  ciPhoto: field.value,
                                }),
                              });

                              if (!response.ok) {
                                throw new Error('Error al analizar la cédula');
                              }

                              const data = await response.json();
                              toast.success('Cédula analizada correctamente');
                            } catch (error) {
                              console.error('Error:', error);
                              toast.error('Error al analizar la cédula');
                            }
                          }}
                        >
                          Analizar cédula
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Sube una imagen de la cédula del familiar para registrar sus datos
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono del familiar</FormLabel>
                    <FormControl>
                      <Input
                        className="border-none bg-fm-blue-3 rounded-xl text-foreground"
                        {...field}
                        placeholder="Ingrese el número de teléfono"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                variant="form"
                className="w-full"
                disabled={isPending}
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Agregando...
                  </div>
                ) : "Agregar Familiar"}
              </Button>
            </form>
          </Form>
        </Card>

        {/* Lista de familiares */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Familiares Registrados</h2>
          {isLoading ? (
            <div className="text-center">Cargando familiares...</div>
          ) : familiares.length === 0 ? (
            <div className="text-center text-gray-500">No hay familiares registrados</div>
          ) : (
            <div className="grid gap-4">
              {familiares.map((familiar) => (
                <Card key={familiar.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">
                        {familiar.nombre} {familiar.nombre2} {familiar.apellido} {familiar.apellido2}
                      </h3>
                      <p className="text-sm text-gray-500">Cédula: {familiar.cedula}</p>
                      <p className="text-sm text-gray-500">Teléfono: {familiar.telefono || 'No registrado'}</p>
                      <p className="text-sm text-gray-500">
                        Parentesco: {familiar.parentesco.charAt(0) + familiar.parentesco.slice(1).toLowerCase()}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteFamiliar(familiar.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
