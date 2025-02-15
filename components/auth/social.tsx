"use client"

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { FaTwitch } from "react-icons/fa";
import { Button } from "../ui/button";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { useSearchParams } from "next/navigation";

export const Social = () => {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl");

    const onClick = (provider: "google" | "twitch") => {
        signIn(provider, {
            callbackUrl: callbackUrl || DEFAULT_LOGIN_REDIRECT,
        });
    }

    return (
        <div className="flex items-center w-full gap-x-2">
            <Button size="lg" className="w-full" variant="outline" onClick={() => onClick("google")}>
                <FcGoogle className="w-5 h-5"/>
            </Button>
            <Button size="lg" className="w-full" variant="outline" onClick={() => onClick("twitch")}>
                <FaTwitch className="w-5 h-5"/>
            </Button>
        </div>
    );
};

