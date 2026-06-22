"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CardWrapper } from "@/components/card-wrapper";
import { FormError } from "@/components/form-error";
import { FormSucces } from "@/components/form-succes";
import { BeatLoader } from "react-spinners";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export const NewVerificationForm = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [succes, setSucces] = useState<string | undefined>();

  const searchParams = useSearchParams();
  const errorParam = searchParams?.get("error");
  const successParam = searchParams?.get("success");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (errorParam) {
      setError("El enlace de verificación es inválido o expiró.");
      return;
    }

    if (successParam) {
      setSucces("¡Correo verificado!");
      return;
    }

    setSucces("Si abriste el enlace de verificación, tu correo ya quedó verificado.");
  }, [isMounted, errorParam, successParam]);

  if (!isMounted) {
    return null;
  }

  return (
    <CardWrapper showSocial>
      <div className="flex flex-col items-center text-center">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-[color-mix(in_oklab,var(--caleta-accent)_15%,transparent)]">
            <Mail className="h-8 w-8 text-[var(--caleta-accent)]" />
          </div>
        </div>

        <div className="mb-6 max-w-md rounded-xl border border-white/10 bg-[#1C2D20] p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--caleta-accent)]" />
            <div className="text-sm leading-relaxed text-white/85">
              <p>Una vez verificado el correo electrónico, podrás acceder a toda la plataforma de CALETAS.</p>
            </div>
          </div>
        </div>

        {/* Estados de carga y mensajes */}
        <div className="w-full max-w-md space-y-4">
          {!succes && !error && (
            <div className="flex flex-col items-center gap-3 p-6 bg-white/5 rounded-xl border border-white/10">
              <BeatLoader color="#40C9A9" size={8} />
              <p className="text-sm text-white/70">Verificando tu correo...</p>
            </div>
          )}
          
          <FormSucces message={succes} />
          {!succes && <FormError message={error} />}
        </div>

        {/* Enlaces de acción */}
        <div className="flex flex-col items-center gap-4 mt-8">
          {succes && !error && (
            <div className="flex items-center gap-2">
              <p className="text-sm text-white">¡Es momento de acceder!</p>
              <Link 
                href="/login" 
                className="text-sm font-semibold text-[var(--caleta-accent)] transition-colors hover:text-white"
              >
                Inicia aquí
              </Link>
            </div>
          )}
          
          {!succes && error && (
            <div className="flex items-center gap-2">
              <p className="text-sm text-white">Vuelve al formulario para</p>
              <Link 
                href="/register" 
                className="text-sm font-semibold text-[var(--caleta-accent)] transition-colors hover:text-white"
              >
                obtener un token
              </Link>
            </div>
          )}
        </div>
      </div>
    </CardWrapper>
  );
};