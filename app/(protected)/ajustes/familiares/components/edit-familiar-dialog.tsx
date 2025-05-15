"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Familiar } from "@prisma/client";

const EditFamiliarSchema = z.object({
  telefono: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  ciPhoto: z.string().optional(),
});

interface EditFamiliarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  familiar: Familiar;
  onUpdate: (updatedFamiliar: Familiar) => void;
}

export const EditFamiliarDialog = ({
  isOpen,
  onClose,
  familiar,
  onUpdate,
}: EditFamiliarDialogProps) => {
  const [isPending, setIsPending] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<any>(null);

  const form = useForm<z.infer<typeof EditFamiliarSchema>>({
    resolver: zodResolver(EditFamiliarSchema),
    defaultValues: {
      telefono: familiar.telefono || "",
      ciPhoto: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof EditFamiliarSchema>) => {
    try {
      setIsPending(true);

      const response = await fetch(`/api/familiares/${familiar.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telefono: values.telefono,
          analyzedData: analyzedData || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar familiar');
      }

      const updatedFamiliar = await response.json();
      onUpdate(updatedFamiliar);
      toast.success('Familiar actualizado exitosamente');
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar familiar');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Familiar</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-none bg-fm-blue-3 rounded-xl text-foreground"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ciPhoto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actualizar cédula</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        className="border-none bg-blue-500 rounded-xl text-foreground"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              const base64Image = reader.result as string;
                              field.onChange(base64Image);

                              try {
                                const response = await fetch('/api/user/onboarding/analyze', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    ciPhoto: base64Image,
                                  }),
                                });

                                if (!response.ok) {
                                  throw new Error('Error al analizar la cédula');
                                }

                                const data = await response.json();
                                setAnalyzedData(data);
                                toast.success('Cédula analizada correctamente');
                              } catch (error) {
                                console.error('Error:', error);
                                toast.error('Error al analizar la cédula');
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Datos actuales (solo lectura) */}
              <div className="space-y-2">
                <h4 className="font-medium">Datos actuales</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Nombre:</span> {familiar.nombre} {familiar.nombre2}</p>
                  <p><span className="font-medium">Apellidos:</span> {familiar.apellido} {familiar.apellido2}</p>
                  <p><span className="font-medium">Cédula:</span> {familiar.cedula}</p>
                  <p><span className="font-medium">Parentesco:</span> {familiar.parentesco}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="form"
                disabled={isPending}
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Guardando...
                  </div>
                ) : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}; 