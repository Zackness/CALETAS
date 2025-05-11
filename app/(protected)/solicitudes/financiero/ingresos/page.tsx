import { Suspense } from 'react';
import { IngresosForm } from './components/IngresosForm';

const Ingresos = () => {
  return (
    <div className="bg-fm-blue-1 w-full h-full sm:bg-opacity-50">
      <div className="flex flex-col items-center content-center justify-center py-20">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          Certificacion de Ingresos
        </h1>
        <p className='text-center px-28'>
          Certificacion de Ingresos.
        </p>
      </div>
      <section className="flex justify-center w-full">
        <Suspense fallback={<div>Loading...</div>}>
          <IngresosForm />
        </Suspense>
      </section>
    </div>
  );
};

export default Ingresos;