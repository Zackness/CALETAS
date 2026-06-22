"use client";

import Link from "next/link";
import { CardWrapper } from "@/components/card-wrapper";

export const ErrorCard = () => {
  return (
    <CardWrapper>
      <h2 className="mb-4 text-center font-special text-2xl text-white sm:text-3xl">
        Algo salió mal
      </h2>
      <div className="rounded-xl border border-white/10 bg-[#1C2D20] p-4 text-sm leading-relaxed text-white/80">
        <p>
          No pudimos completar el inicio de sesión. Intenta de nuevo con el mismo método que usaste
          al registrarte (correo, Google o Twitch).
        </p>
      </div>
      <div className="mt-6 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-center">
        <p className="text-sm text-white/70">¿Ya tienes cuenta?</p>
        <Link
          href="/login"
          className="text-sm font-semibold text-[var(--caleta-accent)] transition-colors hover:text-white"
        >
          Iniciar sesión
        </Link>
      </div>
    </CardWrapper>
  );
};
