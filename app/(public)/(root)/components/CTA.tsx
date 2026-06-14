import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="px-4 sm:px-6 md:px-12 lg:px-24 py-10 sm:py-14 md:py-20 flex flex-col items-center">
      <div className="w-full max-w-4xl px-2 sm:px-4">
        <h3 className="chalk-title font-special text-center text-[1.8rem] sm:text-[2.2rem] md:text-[3rem] lg:text-[3.4rem] pb-4 sm:pb-6 leading-[1.08]">
            ¿LISTO PARA COMPARTIR
            TU CONOCIMIENTO?
        </h3>
        <p className="mx-auto font-semibold text-center text-[1.05rem] sm:text-xl md:text-2xl pb-6 sm:pb-8 max-w-3xl leading-[1.55] px-2 sm:px-4">
            Únete a tu comunidad estudiantil o crea la tuya junto a tus compañeros y comienza
            a compartir tus CALETAS. Es momento de aprovechar el conocimiento colectivo
        </p>
        <div className="flex justify-center w-full pt-1">
            <a 
                href="/register"
                className="font-special w-full sm:w-auto"
            >
                <Button 
                    size="lg"
                    variant="secondary"
                    className="!h-14 !w-full sm:!w-[420px] !rounded-2xl !px-6 !text-sm sm:!text-base md:!text-lg !leading-none"
                >
                    COMIENZA A CALETEAR
                </Button>
            </a>
        </div>
      </div>
    </section>
  );
} 
