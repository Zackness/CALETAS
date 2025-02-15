import { CardWrapper } from "./card-wrapper";

export const ErrorCard = () => {
    return (
        <CardWrapper 
            headerLabel="Bienvenido" 
            showSocial
            >       <div className="flex items-baseline flex-col">
                    <img src="/images/meme1.png" className="w-full mb-[-100px] mt-[-80px]" alt="Logo" />
                    <h2 className="text-4xl mb-8 font-semibold text-white">Oops! Algo ha salido mal</h2>
                    </div>
                    <div className="flex flex-col gap-4 bg-fm-red-2 p-4 rounded-xl text-white">
                    <p>Para confirmar tu identidad, debes iniciar sesion con la cuenta que usaste originalmente (Franky, Google, o Twitch)</p>
                    </div>
                    <div className="flex items-baseline">
                    <p className="mt-12 text-sm text-white">
                        Iniciar sesion con
                    </p>
                    <span className="ml-2 hover:underline cursor-pointer font-semibold text-sm text-white">
                        <a href="/auth/register">Franky Account</a>
                    </span>
                    </div>
                    
        </CardWrapper>
    );
};