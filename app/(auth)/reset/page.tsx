import { ResetForm } from "./components/reset-form";
import { Suspense } from 'react';

const Reset = () => {
  return (
    <main className="relative h-full w-full min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="bg-fm-blue-1 w-full h-full sm:bg-opacity-50">
        <nav className="flex items-center content-center justify-center py-20">
          <img src="/images/full-logo.png" className="w-4/5 sm:w-3/4 md:w-8/12 lg:w-2/5 xl:w-4/12" alt="Logo" />
        </nav>
        <section className="flex justify-center w-full">
          <Suspense fallback={<div>Loading...</div>}>
            <ResetForm />
          </Suspense>
        </section>
      </div>
    </main>
  );
}

export default Reset;