import type { Metadata } from "next";
import { LoginForm } from "./components/login-form";
import { AuthPageShell } from "@/app/(auth)/components/auth-page-shell";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Inicia sesión en tu cuenta de CALETAS.",
};

export default function LoginPage() {
  return (
    <AuthPageShell
      title="INICIAR SESIÓN"
      description="Accede a tu cuenta para compartir caletas, usar la IA y seguir tu progreso académico."
    >
      <LoginForm />
    </AuthPageShell>
  );
}
