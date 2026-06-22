import type { Metadata } from "next";
import { RegisterForm } from "./components/register-form";
import { AuthPageShell } from "@/app/(auth)/components/auth-page-shell";

export const metadata: Metadata = {
  title: "Registrarse",
  description: "Crea tu cuenta en CALETAS.",
};

export default function RegisterPage() {
  return (
    <AuthPageShell
      title="CREAR CUENTA"
      description="Únete a la comunidad estudiantil y empieza a caletear con tus compañeros."
    >
      <RegisterForm />
    </AuthPageShell>
  );
}
