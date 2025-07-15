"use client"

import { FcGoogle } from "react-icons/fc";
import { FaTwitch } from "react-icons/fa";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export const Social = () => {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl");

    const onClick = (provider: "google" | "twitch") => {
        // TODO: Implementar con Better Auth
        console.log(`Sign in with ${provider}`);
        window.location.href = `/api/auth/signin/${provider}?callbackUrl=${callbackUrl || "/home"}`;
    }

    return (
        <div className="flex items-center w-full gap-x-2">
            <Button 
                size="lg" 
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-200" 
                variant="outline" 
                onClick={() => onClick("google")}
            >
                <FcGoogle className="w-5 h-5"/>
            </Button>
            <Button 
                size="lg" 
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-200" 
                variant="outline" 
                onClick={() => onClick("twitch")}
            >
                <FaTwitch className="w-5 h-5"/>
            </Button>
        </div>
    );
};

