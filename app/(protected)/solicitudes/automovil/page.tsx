import { AutoForm } from '@/app/(protected)/solicitudes/automovil/components/AutoForm';
import { Suspense } from 'react';

const Automovil = () => {
  return (
      <div className="bg-fm-blue-1 w-full h-full sm:bg-opacity-50">
        <div className="flex flex-col items-center content-center justify-center pb-20">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Solicitud de Automovil
          </h1>
          <p>
            Solicitud de automovil
          </p>
        </div>
        <section className="flex justify-center w-full">
          <Suspense fallback={<div>Loading...</div>}>
            <AutoForm />
          </Suspense>
        </section>
      </div>
  );
};

export default Automovil;