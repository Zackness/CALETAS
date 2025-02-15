import { Suspense } from 'react';
import { NewPasswordForm } from "@/components/auth/new-password-form";

const NewPasswordPage = () => {
    return (
        <main className="relative h-full w-full bg-[url('/images/hero.jpg')] bg-center bg-fixed bg-cover text-white">
        <div className="bg-fm-blue-1 w-full h-full sm:bg-opacity-50">
          <nav className="flex items-center content-center justify-center py-20">
          </nav>
          <section className="flex justify-center w-full">
            <Suspense fallback={<div>Loading...</div>}>
              <NewPasswordForm />
            </Suspense>
          </section>
        </div>
      </main>
    );
}

export default NewPasswordPage;