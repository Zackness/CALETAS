import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Universities() {
  return (
    <section className="pt-8 sm:pt-12 md:pt-24 px-4 sm:px-6 md:px-20">
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-end pt-6 sm:pt-[30px] pb-6 sm:pb-[30px] gap-4">
            <h2 className="text-[1.75rem] sm:text-[2rem] md:text-[3rem] lg:text-[40px] font-special">
                UNIVERSIDADES
            </h2>
            <a 
                href=""
                className="text-sm sm:text-base md:text-[18px] font-bold pb-3 self-start md:self-end hover:text-[#40C9A9] transition-colors"
            >
                Ver mas universidades -{'>'}
            </a>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 auto-rows-auto gap-4 sm:gap-6 w-full">

            {/* UNEXPO - Card principal */}
            <div className="lg:col-span-2 lg:row-span-2 border-10 border-[#40C9A9] rounded-4xl pt-6 sm:pt-8 md:pt-[59px] px-4 sm:px-6 md:px-[39px]">
                {/* Layout para móviles y tablets */}
                <div className="lg:hidden flex flex-row items-center">
                    <img src="/universities/unexpo.webp" alt="Logo UNEXPO" className="h-24 sm:h-32 flex-shrink-0 pr-4 sm:pr-6"/>
                    <div className="flex flex-col flex-1">
                        <h3 className="font-special text-[1.5rem] sm:text-[2rem] pt-2 sm:pt-4 pb-2 sm:pb-4">
                            UNEXPO
                        </h3>
                        <p className="font-semibold text-sm sm:text-lg pb-4 sm:pb-6 leading-relaxed">
                            - Ing. Mecatrónica <br/>
                            - Ing. Rural <br/>
                            - TSU. Electricidad <br/>
                            - TSU. Mecanica <br/>
                            - Ing. Química
                        </p>
                    </div>
                </div>
                
                {/* Layout para desktop */}
                <div className="hidden lg:block">
                <div className="justify-items-center">
                        <img src="/universities/unexpo.webp" alt="Logo UNEXPO" className="w-full max-w-[484px] mx-auto"/>
                </div>
                <h3 className="font-special text-[54px] pt-[44px] pb-[18px]">
                    UNEXPO
                </h3>
                    <p className="font-semibold text-[28px] pb-[31px] pr-[53px] leading-relaxed">
                    - Ing. Mecatrónica <br/>
                    - Ing. Rural <br/>
                    - TSU. Electricidad <br/>
                    - TSU. Mecanica <br/>
                    - Ing. Química
                </p>
                </div>
            </div>

            {/* UCV */}
            <div className="lg:col-span-3 lg:col-start-3 border-10 border-[#40C9A9] rounded-4xl flex flex-row items-center self-center py-6 sm:py-8 md:py-24 pl-4 sm:pl-6">
                    <img src="/universities/ucv.webp" alt="Logo UCV" className="h-24 sm:h-32 md:h-[284px] pr-4 sm:pr-6 md:pr-[48px] flex-shrink-0"/>
                    <div className="flex flex-col flex-1">
                        <h3 className="font-special text-[1.5rem] sm:text-[2rem] md:text-[3rem] lg:text-[54px] pt-2 sm:pt-4 md:pt-[44px] pb-2 sm:pb-4 md:pb-[18px]">
                            UCV
                        </h3>
                        <p className="font-semibold text-sm sm:text-lg md:text-xl lg:text-[28px] pb-4 sm:pb-6 md:pb-[31px] pr-0 md:pr-[53px] leading-relaxed">
                            - Lic. Música <br/>
                            - Lic. Psicología
                        </p>
                    </div>
            </div>

            {/* UCLA */}
            <div className="lg:col-span-3 lg:col-start-3 lg:row-start-2 border-10 border-[#40C9A9] rounded-4xl flex flex-row items-center self-center py-6 sm:py-8 md:py-24 pl-4 sm:pl-6">
                    <img src="/universities/ucla.webp" alt="Logo UCLA" className="h-24 sm:h-32 md:h-[284px] pr-4 sm:pr-6 md:pr-[48px] flex-shrink-0"/>
                    <div className="flex flex-col flex-1">
                        <h3 className="font-special text-[1.5rem] sm:text-[2rem] md:text-[3rem] lg:text-[54px] pt-2 sm:pt-4 md:pt-[44px] pb-2 sm:pb-4 md:pb-[18px]">
                            UCLA
                        </h3>
                        <p className="font-semibold text-sm sm:text-lg md:text-xl lg:text-[28px] pb-4 sm:pb-6 md:pb-[31px] pr-0 md:pr-[53px] leading-relaxed">
                            - Lic. Música <br/>
                            - Lic. Psicología
                        </p>
                    </div>
            </div>

            {/* AGREGA TU UNI */}
            <div className="lg:col-span-5 lg:row-start-3 border-10 border-[#40C9A9] rounded-4xl px-4 sm:px-6 md:px-[32px]">
                <h3 className="font-special text-[1.5rem] sm:text-[2rem] md:text-[3rem] lg:text-[54px] pt-4 sm:pt-6 md:pt-[44px] pb-3 sm:pb-4 md:pb-[18px]">
                    AGREGA TU UNI
                </h3>
                <p className="font-semibold text-sm sm:text-lg md:text-xl lg:text-[28px] pr-0 md:pr-[53px] pb-6 sm:pb-8 md:pb-[44px] leading-relaxed">
                    ¿No aparece tu universidad o carrera? No te preocupes, puedes agregar la misma en este
                    formulario, solo necesitas que al menos a 10 personas de tu carrera con carnet para certificar
                    la autenticidad de tu carrera o universidad
                </p>
            </div>

        </div>

    </section>
  );
} 