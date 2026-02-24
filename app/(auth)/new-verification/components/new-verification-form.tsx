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
  const errorParam = searchParams.get("error");
  const successParam = searchParams.get("success");

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
    <CardWrapper 
      headerLabel="Verificación de correo"
      showSocial
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-mygreen to-mygreen-light rounded-full flex items-center justify-center mb-4 mx-auto">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl mb-4 text-white text-center font-special pb-4">
            Verificando tu correo
          </h2>
        </div>

        {/* Mensaje informativo */}
        <div className="bg-gradient-to-r from-mygreen/20 to-mygreen-light/20 border border-mygreen/30 rounded-xl p-4 mb-6 max-w-md">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-mygreen mt-0.5 flex-shrink-0" />
            <div className="text-sm text-white/90 leading-relaxed">
              <p>Una vez verificado el correo electrónico, podrás acceder a toda la plataforma de Caletas.</p>
            </div>
          </div>
        </div>

        {/* Estados de carga y mensajes */}
        <div className="w-full max-w-md space-y-4">
          {!succes && !error && (
            <div className="flex flex-col items-center gap-3 p-6 bg-white/5 rounded-xl border border-white/10">
              <BeatLoader color="#354B3A" size={8} />
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
                className="text-mygreen hover:text-mygreen-light font-semibold text-sm transition-colors"
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
                className="text-mygreen hover:text-mygreen-light font-semibold text-sm transition-colors"
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