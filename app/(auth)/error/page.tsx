import type { Metadata } from "next";
import { ErrorCard } from "./components/error-card";
import { AuthPageShell } from "@/app/(auth)/components/auth-page-shell";

export const metadata: Metadata = {
  title: "Error de acceso",
  description: "Hubo un problema al iniciar sesión en CALETAS.",
};

export default function AuthErrorPage() {
  return (
    <AuthPageShell
      title="ERROR DE ACCESO"
      description="No pudimos completar el inicio de sesión con el proveedor seleccionado."
    >
      <ErrorCard />
    </AuthPageShell>
  );
}
