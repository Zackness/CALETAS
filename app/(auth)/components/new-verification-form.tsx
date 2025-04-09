"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CardWrapper } from "../../../components/card-wrapper";
import { newVerification } from "@/actions/new-verification";
import { FormError } from "../../../components/form-error";
import { FormSucces } from "../../../components/form-succes";
import { BeatLoader } from "react-spinners";

export const NewVerificationForm = () => {
  const [error, setError] = useState<string | undefined>();
  const [succes, setSucces] = useState<string | undefined>();

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const onSubmit = useCallback(() => {
    if (succes || error) return;

    if (!token) {
      setError("Token perdido!");
      return;
    }

    newVerification(token)
      .then((data) => {
        setSucces(data.succses);
        setError(data.error);
      })
      .catch(() => {
        setError("Algo ha salido mal");
      });
  }, [token, succes, error]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <CardWrapper headerLabel="Verificando tu correo">
      <div className="flex items-baseline flex-col">
        <img src="/images/meme2.png" className="w-full mb-[-100px] mt-[-80px]" alt="Logo" />
        <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">Verificando tu correo</h2>
      </div>
      <div className="flex items-center w-full justify-center">
        {!succes && !error && <BeatLoader color="green" />}
        <FormSucces message={succes} />
        {!succes && <FormError message={error} />}
      </div>
      <div className="flex items-baseline justify-center">
        {succes && !error && (
          <p className="mt-12 text-sm text-white">Es momento de acceder</p>
        )}
        {!succes && error && (
          <p className="mt-12 text-sm text-white">Vuelve al formulario para</p>
        )}
        {succes && !error && (
          <span className="ml-2 hover:underline cursor-pointer font-semibold text-sm text-white">
            <a href="/auth/login">Inicia aquí</a>
          </span>
        )}
        {!succes && error && (
          <span className="ml-2 hover:underline cursor-pointer font-semibold text-sm text-white">
            <a href="/auth/register">Obtener un token</a>
          </span>
        )}
      </div>
    </CardWrapper>
  );
};