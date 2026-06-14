import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="mx-4 mt-6 flex flex-col px-5 pt-7 pb-8 sm:mx-6 sm:px-8 sm:pt-10 lg:mx-8 lg:flex-row lg:px-10 lg:pt-12">
        <div className="flex flex-col lg:w-[50%] w-full">
            <h1 className="chalk-title text-[2rem] sm:text-[2.5rem] md:text-[3.5rem] lg:text-[4.3rem] font-special pb-4 sm:pb-6 lg:pb-[24px] leading-tight">
                <span className="text-[var(--accent-hex)]">COMPARTE</span> Y APRENDE CON TU COMUNIDAD
            </h1>
            <p className="pb-6 sm:pb-8 lg:pb-[45px] font-semibold text-lg sm:text-xl md:text-2xl lg:text-3xl leading-relaxed sm:leading-relaxed md:leading-relaxed lg:leading-[50px]">
                Accede a material universitario creado por estudiantes
                para estudiantes. Tu &quot;CALETA&quot; ahora es nuestra caleta.
                Juntos somos más.
            </p>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:gap-4">
                <a
                href="/login"
                className="w-full font-special sm:w-auto"    
                >
                    <Button
                        size="lg"
                        className="!h-14 !w-full sm:!w-[320px] !rounded-2xl !px-6 !text-sm sm:!text-base md:!text-lg !leading-none"
                    >
                        INICIAR SESIÓN -{'>'}
                    </Button>
                </a>
                <a
                href="/register"
                className="w-full font-special sm:w-auto"    
                >
                    <Button
                        size="lg"
                        variant="secondary"
                        className="!h-14 !w-full sm:!w-[380px] !rounded-2xl !px-6 !text-sm sm:!text-base md:!text-lg !leading-none"
                    >
                        REGISTRARME AHORA -{'>'}
                    </Button>
                </a>
            </div>
        </div>
         <div className="hidden lg:block lg:w-[50%] pl-12 mt-8 lg:mt-0">
             <img className="w-[90%]" src="/Group-209.webp" alt="Ilustracion que ilustra nuestro apoyo a todas las carreras tanto tecnicas como de humanidades"/>
         </div>
        {/* Imagen para tablets y móviles */}
        <div className="lg:hidden w-full mt-6 sm:mt-8">
            <img className="w-full max-w-sm sm:max-w-md mx-auto" src="/Group-209.webp" alt="Ilustracion que ilustra nuestro apoyo a todas las carreras tanto tecnicas como de humanidades"/>
        </div>
    </section>
  );
} 
