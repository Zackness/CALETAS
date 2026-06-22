import type { Metadata } from "next";
import { ResetForm } from "./components/reset-form";
import { AuthPageShell } from "@/app/(auth)/components/auth-page-shell";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  description: "Recupera el acceso a tu cuenta de CALETAS.",
};

export default function ResetPage() {
  return (
    <AuthPageShell
      title="RECUPERAR CONTRASEÑA"
      description="Te enviaremos un enlace a tu correo para restablecer tu contraseña de forma segura."
    >
      <ResetForm />
    </AuthPageShell>
  );
}
