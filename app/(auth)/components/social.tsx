"use client"

import { FcGoogle } from "react-icons/fc";
import { FaTwitch } from "react-icons/fa";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export const Social = () => {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl");

    const onClick = (provider: "google" | "twitch") => {
        void authClient.signIn.social({
            provider,
            callbackURL: callbackUrl || "/home",
            errorCallbackURL: "/error",
        });
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

