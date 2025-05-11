import { SolteriaForm } from '@/app/(protected)/solicitudes/personal/solteria/components/SolteriaForm';
import { Suspense } from 'react';

const Solteria = () => {
  return (
    <div className="bg-fm-blue-1 w-full h-full sm:bg-opacity-50">
      <div className="flex flex-col items-center content-center justify-center pb-20">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          Solicitud de Carta de Soltería
        </h1>
        <p>
          Solicitud de Carta de Soltería
        </p>
      </div>
      <section className="flex justify-center w-full">
        <Suspense fallback={<div>Loading...</div>}>
          <SolteriaForm />
        </Suspense>
      </section>
    </div>
  );
};

export default Solteria;