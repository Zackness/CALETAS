"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { logout } from "@/actions/logout";
import { Button } from "./ui/button";
import { ExitIcon } from "@radix-ui/react-icons";

export function DashboardHeader() {

  const onClick = () => {
    logout();
};
  
  return (
    <header className="border-b border-border w-full h-16 py-4 bg-gradient-to-t from-mygreen to-mygreen-light text-white overflow-x-hidden">
      <div className="flex h-full items-center justify-between px-4 max-w-full">
        <div className="flex items-center gap-2 min-w-0">
          <SidebarTrigger />
          <h1 className="text-xl font-bold truncate">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src="/globe.svg" alt="Usuario" />
            <AvatarFallback>US</AvatarFallback>
          </Avatar>
          <Button onClick={onClick} className="w-full text-white border-white" type="submit" size="default" variant="outline">
              <ExitIcon className="h-4 w-4 mr-2"/>
                salir
          </Button>
        </div>
      </div>
    </header>
  )
}