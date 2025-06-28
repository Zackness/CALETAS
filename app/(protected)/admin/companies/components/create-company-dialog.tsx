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
import { TipoEmpresa } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Copy, Check } from "lucide-react";

// Función para generar contraseña segura
const generateSecurePassword = (): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let password = '';
  
  // Asegurar al menos un carácter de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Completar hasta 12 caracteres
  const allChars = uppercase + lowercase + numbers + symbols;
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mezclar la contraseña
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

const CreateCompanySchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  direccion: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  telefono: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  RIF: z.string().min(8, "El RIF debe tener al menos 8 caracteres"),
  persona_de_contacto: z.string().min(2, "El nombre del contacto debe tener al menos 2 caracteres"),
  email: z.string().email("Debe ser un email válido"),
  tipo: z.nativeEnum(TipoEmpresa),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

interface CreateCompanyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (company: any) => void;
}

export const CreateCompanyDialog = ({
  isOpen,
  onClose,
  onSuccess,
}: CreateCompanyDialogProps) => {
  const [isPending, setIsPending] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  const form = useForm<z.infer<typeof CreateCompanySchema>>({
    resolver: zodResolver(CreateCompanySchema),
    defaultValues: {
      nombre: "",
      direccion: "",
      telefono: "",
      RIF: "",
      persona_de_contacto: "",
      email: "",
      tipo: undefined,
      password: "",
    },
  });

  const generatePassword = () => {
    const newPassword = generateSecurePassword();
    form.setValue('password', newPassword);
    toast.success('Contraseña generada exitosamente');
  };

  const copyPassword = async () => {
    const password = form.getValues('password');
    if (password) {
      try {
        await navigator.clipboard.writeText(password);
        setShowCopied(true);
        toast.success('Contraseña copiada al portapapeles');
        setTimeout(() => setShowCopied(false), 2000);
      } catch (error) {
        toast.error('Error al copiar la contraseña');
      }
    }
  };

  const onSubmit = async (values: z.infer<typeof CreateCompanySchema>) => {
    try {
      setIsPending(true);

      console.log("Enviando datos:", values);

      const response = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error de la API:', response.status, errorText);
        throw new Error(`Error al crear empresa: ${errorText}`);
      }

      const data = await response.json();
      onSuccess(data);
      toast.success('Empresa creada exitosamente');
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear empresa';
      toast.error(errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Empresa</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la empresa</FormLabel>
                  <FormControl>
                    <Input
                      className="border-blue-500 bg-fm-blue-3 rounded-xl text-foreground"
                      {...field}
                      placeholder="Ingrese el nombre de la empresa"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="RIF"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RIF</FormLabel>
                  <FormControl>
                    <Input
                      className="border-blue-500 bg-fm-blue-3 rounded-xl text-foreground"
                      {...field}
                      placeholder="Ej: J-123456789"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de empresa</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="border-blue-500 bg-fm-blue-3 rounded-xl text-foreground">
                        <SelectValue placeholder="Selecciona el tipo de empresa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(TipoEmpresa).map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo.replace(/_/g, " ")}
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
              name="direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input
                      className="border-blue-500 bg-fm-blue-3 rounded-xl text-foreground"
                      {...field}
                      placeholder="Ingrese la dirección de la empresa"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input
                      className="border-blue-500 bg-fm-blue-3 rounded-xl text-foreground"
                      {...field}
                      placeholder="Ej: 0212-555-1234"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="persona_de_contacto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Persona de contacto</FormLabel>
                  <FormControl>
                    <Input
                      className="border-blue-500 bg-fm-blue-3 rounded-xl text-foreground"
                      {...field}
                      placeholder="Ingrese el nombre de la persona de contacto"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      className="border-blue-500 bg-fm-blue-3 rounded-xl text-foreground"
                      {...field}
                      placeholder="contacto@empresa.com"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        type="password"
                        className="border-blue-500 bg-fm-blue-3 rounded-xl text-foreground flex-1"
                        {...field}
                        placeholder="Ingrese la contraseña de la empresa"
                        disabled={isPending}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={generatePassword}
                      disabled={isPending}
                      className="border-blue-500 hover:bg-blue-50"
                      title="Generar contraseña segura"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={copyPassword}
                      disabled={isPending || !field.value}
                      className="border-blue-500 hover:bg-blue-50"
                      title="Copiar contraseña"
                    >
                      {showCopied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
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
                disabled={isPending}
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creando...
                  </div>
                ) : "Crear Empresa"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}; 