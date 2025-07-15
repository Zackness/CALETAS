import { NewVerificationForm } from "./components/new-verification-form";
import { Suspense } from 'react';

const NewVerificationPage = () => {
  return (
    <main className="relative h-full w-full min-h-screen bg-gradient-to-br from-mygreen-dark via-mygreen to-mygreen-light text-white">
      <div className="w-full h-full bg-black/20">
        <nav className="flex items-center content-center justify-center py-20">
          <h2 className="text-3xl font-special bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
            CALETAS
          </h2>          
        </nav>
        <section className="flex justify-center w-full px-4">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-white text-lg">Cargando...</div>
            </div>
          }>
            <NewVerificationForm />
          </Suspense>
        </section>
      </div>
    </main>
  );
}

export default NewVerificationPage;