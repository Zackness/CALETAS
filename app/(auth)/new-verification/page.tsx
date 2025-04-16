import { NewVerificationForm } from "./components/new-verification-form";
import { Suspense } from 'react';

const NewVerificationPage = () => {
  return (
    <main className="relative h-full w-full min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="bg-fm-blue-1 w-full h-full sm:bg-opacity-50">
        <nav className="flex items-center content-center justify-center py-20">
        </nav>
        <section className="flex justify-center w-full">
          <Suspense fallback={<div>Loading...</div>}>
            <NewVerificationForm />
          </Suspense>
        </section>
      </div>
    </main>
  );
}

export default NewVerificationPage;