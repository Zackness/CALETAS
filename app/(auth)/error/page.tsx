import { ErrorCard } from "@/app/(auth)/error/components/error-card";
import { Suspense } from 'react';

const AuthErrorPage = () => {
  return (
    <main className="relative h-full w-full bg-[url('/images/hero.jpg')] bg-center bg-fixed bg-cover text-white">
      <div className="bg-fm-blue-1 w-full h-full sm:bg-opacity-50">
        <nav className="flex items-center content-center justify-center py-20">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Global Legal
          </h2>          
        </nav>
        <section className="flex justify-center w-full">
          <Suspense fallback={<div>Loading...</div>}>
            <ErrorCard />
          </Suspense>
        </section>
      </div>
    </main>
  );
};

export default AuthErrorPage;