interface CardsProps {
    titulo: string;
    contenido: string;
    picture: string;
    alt: string;
}

export default function Cards({ titulo, contenido, picture, alt }: CardsProps) {
    return (
        <div className="border-10 border-[#40C9A9] rounded-4xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 md:mb-10 text-left content-between h-full flex flex-col">
            <div className="justify-items-center items-start mb-3 sm:mb-4 flex-shrink-0">
                <img
                    src={ picture }
                    alt={ alt }
                    height={98}
                    className="w-auto h-auto max-h-[60px] sm:max-h-[80px] md:max-h-[98px]"
                />
            </div>
            <div className="flex-1 flex flex-col">
                <h4 className="font-bold text-sm sm:text-base md:text-[18px] items-end mb-2 sm:mb-3">
                    { titulo }
                </h4>
                <p className="text-xs sm:text-sm md:text-base leading-relaxed flex-1">
                    { contenido }
                </p>
            </div>
        </div>
    );
}  