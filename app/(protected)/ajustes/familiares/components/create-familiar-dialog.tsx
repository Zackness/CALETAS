"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Parentesco } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CreateFamiliarSchema = z.object({
  telefono: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  parentesco: z.nativeEnum(Parentesco),
  ciPhoto: z.string().optional(),
});

interface CreateFamiliarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (familiar: any) => void;
}

export const CreateFamiliarDialog = ({
  isOpen,
  onClose,
  onSuccess,
}: CreateFamiliarDialogProps) => {
  const [isPending, setIsPending] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<any>(null);

  const form = useForm<z.infer<typeof CreateFamiliarSchema>>({
    resolver: zodResolver(CreateFamiliarSchema),
    defaultValues: {
      telefono: "",
      parentesco: undefined,
      ciPhoto: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof CreateFamiliarSchema>) => {
    if (!analyzedData) {
      toast.error('Por favor, sube una cédula para analizar');
      return;
    }

    try {
      setIsPending(true);

      const response = await fetch('/api/familiares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telefono: values.telefono,
          parentesco: values.parentesco,
          analyzedData,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al agregar familiar');
      }

      const data = await response.json();
      onSuccess(data);
      toast.success('Familiar agregado exitosamente');
      form.reset();
      setAnalyzedData(null);
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al agregar familiar');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Familiar</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <Input
                      type="file"
                      accept=".jpg,.jpeg"
                      className="border-none bg-blue-500 rounded-xl text-foreground"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (!file.type.match('image/jpeg')) {
                            toast.error('Solo se aceptan archivos JPG o JPEG');
                            e.target.value = '';
                            return;
                          }
                          
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
                  <FormDescription>
                    Sube una imagen de la cédula del familiar en formato JPG o JPEG. Otros formatos no serán aceptados.
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
                disabled={isPending || !analyzedData}
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
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}; 