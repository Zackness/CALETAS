import { Suspense } from 'react';
import { BalanceForm } from './components/BalanceForm';

const Balance = () => {
  return (
    <div className="bg-fm-blue-1 w-full h-full sm:bg-opacity-50">
      <div className="flex flex-col items-center content-center justify-center py-20">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          Balance Personal
        </h1>
        <p className='text-center px-28'>
          La finalizar la consignacion de esta solicitud requiere el envio de 
          ciertos datos por correo elecctronico una vez sea contactado por uno 
          de nuestros abogados, por favor, realice la operacion del formulario, 
          para poder contactarnos con usted.
        </p>
      </div>
      <section className="flex justify-center w-full">
        <Suspense fallback={<div>Loading...</div>}>
          <BalanceForm />
        </Suspense>
      </section>
    </div>
  );
};

export default Balance;
