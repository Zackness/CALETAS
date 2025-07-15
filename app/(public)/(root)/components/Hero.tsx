import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="flex flex-col lg:flex-row mx-4 sm:mx-6 lg:mx-8 pt-6 sm:pt-8 lg:pt-[40px] lg:pl-10">
        <div className="flex flex-col lg:w-[50%] w-full">
            <h1 className="text-[2rem] sm:text-[2.5rem] md:text-[3.5rem] lg:text-[4.3rem] font-special pb-4 sm:pb-6 lg:pb-[24px] leading-tight">
                COMPARTE Y APRENDE CON TU COMUNIDAD
            </h1>
            <p className="pb-6 sm:pb-8 lg:pb-[45px] font-semibold text-lg sm:text-xl md:text-2xl lg:text-3xl leading-relaxed sm:leading-relaxed md:leading-relaxed lg:leading-[50px]">
                Accede a material universitario creado por estudiantes
                para estudiantes. Tu "CALETA" ahora es nuestra caleta.
                Juntos somos más.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                <a
                href="/login"
                className="w-full font-special"    
                >
                    <Button
                        size="lg"
                        className="w-full sm:w-auto text-base sm:text-lg"
                    >
                        INICIAR SESIÓN -{'>'}
                    </Button>
                </a>
                <a
                href="/register"
                className="w-full font-special"    
                >
                    <Button
                        size="lg"
                        variant="secondary"
                        className="w-full sm:w-auto text-base sm:text-lg"
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