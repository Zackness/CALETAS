"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { FaUser } from "react-icons/fa";
import { useCurrentUser } from "@/hooks/use-current-user";
import { authClient } from "@/lib/auth-client";
import { ExitIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";

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
            <DropdownMenuContent className="w-40 border-none bg-fm-blue-1 rounded-xl p-4 shadow-fm-blue-2 shadow-lg" align="end">
                <Button onClick={onClick} className="w-full" type="submit" size="default" variant="outline">
                    <DropdownMenuItem>
                        <ExitIcon className="h-4 w-4 mr-2"/>
                        salir
                    </DropdownMenuItem>    
                </Button>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};