import { Suspense } from 'react';
import { PoderForm } from './components/PoderForm';

const Solteria = () => {
  return (
      <div className="bg-fm-blue-1 w-full h-full sm:bg-opacity-50">
        <div className="flex flex-col items-center content-center justify-center py-20">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Carta de Poder general o especial
          </h1>
          <p>
            Carta de Poder general o especial
          </p>
        </div>
        <section className="flex justify-center w-full">
          <Suspense fallback={<div>Loading...</div>}>
            <PoderForm />
          </Suspense>
        </section>
      </div>
  );
};

export default Solteria;