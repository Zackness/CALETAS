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
    <header className="border-b border-border w-full h-16">
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <h1 className="text-xl font-bold">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Avatar>
            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Usuario" />
            <AvatarFallback>US</AvatarFallback>
          </Avatar>
          <Button onClick={onClick} className="w-full text-foreground" type="submit" size="default" variant="outline">
              <ExitIcon className="h-4 w-4 mr-2"/>
                salir
          </Button>
        </div>
      </div>
    </header>
  )
}