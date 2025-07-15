import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="px-4 sm:px-6 md:px-12 lg:px-24 py-8 sm:py-12 md:py-[100px] flex flex-col items-center">
        <h3 className="font-special text-center text-[1.75rem] sm:text-[2rem] md:text-[3rem] lg:text-[54px] pb-4 sm:pb-6 md:pb-[18px] leading-tight">
            ¿LISTO PARA COMPARTIR
            TU CONOCIMIENTO?
        </h3>
        <p className="font-semibold text-center text-sm sm:text-lg md:text-xl lg:text-[28px] pb-6 sm:pb-8 md:pb-[31px] pr-0 md:pr-[53px] max-w-4xl leading-relaxed px-2 sm:px-4">
            Únete a tu comunidad estudiantil o crea la tuya junto a tus compañeros y comienza
            a compartir tus CALETAS. Es momento de aprovechar el conocimiento colectivo
        </p>
        <div className="flex justify-center w-full px-4 sm:px-0">
            <a 
                href="/register"
                className="font-special w-full sm:w-auto"
            >
                <Button 
                    size="lg"
                    variant="secondary"
                    className="w-full sm:w-auto text-base sm:text-lg"
                >
                    COMIENZA A CALETEAR
                </Button>
            </a>
        </div>
    </section>
  );
} 