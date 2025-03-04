"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState, useTransition, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { CardWrapper } from "@/components/auth/card-wrapper";
import { Button } from "@/components/ui/button";
import { FormSucces } from "@/components/form-succes";
import { FormError } from "@/components/form-error";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { Combobox } from "@/components/ui/combobox"; // Asegúrate de que la ruta sea correcta

const SolicitudSchema = z.object({
  persona: z.string().nonempty("Debe seleccionar una persona"),
  cedula: z.string().nonempty("Debe seleccionar una persona"),
  testigo1: z.string().nonempty("Debe subir el archivo del primer testigo"),
  testigo2: z.string().nonempty("Debe subir el archivo del segundo testigo"),
});

interface User {
  cedula: string;
  name: string;
  id: string;
  email: string;
  telefono: string | null;
  codigoEmpresa: string | null;
  emailVerified: Date | null;
  image: string | null;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Familiar {
  cedula: string;
  id: string;
  telefono: string | null;
  nombre: string;
  parentesco: string;
  usuarioId: string;
}

export const SolteriaForm = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const urlError = searchParams.get("error") === "OAuthAccountNotLinked"
    ? "El correo ya está en uso con un proveedor diferente"
    : "";

  const [error, setError] = useState<string | undefined>("");
  const [succes, setSucces] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [familiares, setFamiliares] = useState<Familiar[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<string>("");

  const form = useForm<z.infer<typeof SolicitudSchema>>({
    resolver: zodResolver(SolicitudSchema),
    defaultValues: {
      persona: "",
      cedula: "",
      testigo1: "",
      testigo2: "",
    },
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get('/api/user');
        const { user, familiares } = response.data;
        setUser(user);
        setFamiliares(familiares);
        setSelectedPersona(user.id); // Seleccionar el usuario por defecto
        form.setValue("cedula", user.cedula); // Establecer la cédula del usuario por defecto
      } catch (error) {
        console.error("Error al obtener los datos de los familiares:", error);
        setError("Error al obtener los datos de los familiares");
      }
    }
    fetchData();
  }, [form]);

  const onSubmit = async (values: z.infer<typeof SolicitudSchema>) => {
    setError("");
    setSucces("");

    const solicitudData = {
      usuarioId: user!.id,
      familiarId: selectedPersona !== user!.id ? selectedPersona : null,
      testigo1: values.testigo1,
      testigo2: values.testigo2,
    };

    startTransition(() => {
      axios.post('/api/solicitudes/personal/solteria', solicitudData)
        .then((response) => {
          const data = response.data;
          if (data.error) {
            form.reset();
            setError(data.error);
          }

          if (data.succes) {
            form.reset();
            setSucces(data.succes);
          }
        })
        .catch(() => setError("Algo ha salido mal!"));
    });
  };

  const handlePersonaChange = (value: string) => {
    setSelectedPersona(value);
    const persona = value === user?.id ? user : familiares.find((f) => f.id === value);
    if (persona) {
      form.setValue("cedula", persona.cedula);
    } else {
      form.setValue("cedula", ""); // Dejar en blanco si no se selecciona ningún familiar
    }
  };

  return (
    <CardWrapper headerLabel="Solicitud de Documento">
      <div className="flex flex-col gap-4">
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4 text-white">
              <FormField
                control={form.control}
                name="persona"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quien solicita</FormLabel>
                    <FormControl>
                      <Combobox
                        {...field}
                        value={selectedPersona}
                        onChange={handlePersonaChange}
                        options={[
                          { value: user?.id || "", label: user?.name || "Usuario" }, // Opción para el usuario logueado
                          ...familiares.map((familiar) => ({
                            value: familiar.id,
                            label: familiar.nombre,
                          })),
                        ]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cedula"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} disabled={true} id="cedula" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="testigo1"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} type="file" id="testigo1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="testigo2"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} type="file" id="testigo2" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormError message={error || urlError} />
            <FormSucces message={succes} />
            <Button disabled={isPending} className="w-full mt-4 text-white" size="lg" variant="form" type="submit">
              Enviar Solicitud
            </Button>
          </form>
        </Form>
      </div>
    </CardWrapper>
  );
};