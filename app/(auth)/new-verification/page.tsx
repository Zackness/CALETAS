import type { Metadata } from "next";
import { NewVerificationForm } from "./components/new-verification-form";
import { AuthPageShell } from "@/app/(auth)/components/auth-page-shell";

export const metadata: Metadata = {
  title: "Verificar correo",
  description: "Verifica tu correo electrónico en CALETAS.",
};

export default function NewVerificationPage() {
  return (
    <AuthPageShell
      title="VERIFICA TU CORREO"
      description="Confirma tu dirección de correo para activar tu cuenta."
    >
      <NewVerificationForm />
    </AuthPageShell>
  );
}
