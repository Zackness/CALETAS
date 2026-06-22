import type { Metadata } from "next";
import { NewPasswordForm } from "./components/new-password-form";
import { AuthPageShell } from "@/app/(auth)/components/auth-page-shell";

export const metadata: Metadata = {
  title: "Nueva contraseña",
  description: "Establece una nueva contraseña para tu cuenta de CALETAS.",
};

export default function NewPasswordPage() {
  return (
    <AuthPageShell
      title="NUEVA CONTRASEÑA"
      description="Elige una contraseña segura para tu cuenta."
    >
      <NewPasswordForm />
    </AuthPageShell>
  );
}
