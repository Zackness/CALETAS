"use client";

import { CardWrapper } from "@/components/card-wrapper";

export const ErrorCard = () => {
  return (
    <CardWrapper headerLabel="Error">
      <div className="flex items-baseline flex-col">
        <img src="/images/error.png" className="w-full mb-[-100px] mt-[-80px]" alt="Error" />
        <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">Ha ocurrido un error</h2>
      </div>
      <div className="flex items-center w-full justify-center">
        <p className="text-white">Por favor, inténtalo de nuevo más tarde.</p>
      </div>
      <div className="flex items-baseline justify-center">
        <p className="mt-12 text-sm text-white">¿Necesitas ayuda?</p>
        <span className="ml-2 hover:underline cursor-pointer font-semibold text-sm text-white">
          <a href="/support">Contacta con soporte</a>
        </span>
      </div>
    </CardWrapper>
  );
};