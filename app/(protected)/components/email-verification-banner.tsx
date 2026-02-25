"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface EmailVerificationBannerProps {
  email: string;
}

export function EmailVerificationBanner({ email }: EmailVerificationBannerProps) {
  const [sending, setSending] = useState(false);

  const handleResend = async () => {
    setSending(true);
    try {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/new-verification?success=1",
      });
      if (error) {
        toast.error(error.message || "No se pudo enviar el correo");
        return;
      }
      toast.success("Correo enviado. Revisa tu bandeja para verificar tu email.");
    } catch {
      toast.error("Error al enviar el correo de verificación");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-center gap-3 px-4 py-3 bg-amber-500/20 border-b border-amber-500/30 text-white"
    >
      <Mail className="h-5 w-5 text-amber-400 flex-shrink-0" />
      <p className="text-sm font-medium text-center">
        Por seguridad, verifica tu correo electrónico para usar todas las funciones de Caletas.
      </p>
      <Button
        type="button"
        size="sm"
        className="bg-amber-500 hover:bg-amber-600 text-white border-0"
        disabled={sending}
        onClick={() => void handleResend()}
      >
        {sending ? "Enviando…" : "Reenviar correo de verificación"}
      </Button>
    </div>
  );
}
