"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { FaUser } from "react-icons/fa";
import { useCurrentUser } from "@/hooks/use-current-user";
import { authClient } from "@/lib/auth-client";
import { ExitIcon } from "@radix-ui/react-icons";
const onClick = () => {
    authClient.signOut({
        fetchOptions: {
            onSuccess: () => {
                window.location.href = "/login";
            },
        },
    });
};

export const UserButton = () => {
    const user = useCurrentUser();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="border-none w-8 h-8 mr-4 outline-none">
                <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.image || "/globe.svg"}/>
                    <AvatarFallback className="bg-fm-green">
                        <FaUser className="text-foreground/90"/>
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem] rounded-xl">
                <DropdownMenuItem
                    onClick={onClick}
                    className="cursor-pointer gap-2 text-white focus:text-white"
                >
                    <ExitIcon className="h-4 w-4 text-[#40C9A9]" />
                    Salir
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};