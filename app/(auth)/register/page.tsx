import { RegisterForm } from "./components/register-form";
import { Suspense } from 'react'; 
import { Logo } from '@/components/marca/Logo';

const Register = () => {
    return (
      <main className="relative h-full bg-gradient-to-t from-mygreen to-mygreen-light min-h-screen w-full m-0 text-white">
        <div className="w-full h-full">
          <nav className="flex items-center justify-center py-10">
            <Logo width={200} height={27} color="white" />
          </nav>
          <section className="flex justify-center w-full">
            <Suspense fallback={<div>Loading...</div>}>
              <RegisterForm/>
            </Suspense>
          </section>
        </div>
      </main>
    );
  }

  export default Register;