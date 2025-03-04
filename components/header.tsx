"use client";

import Link from "next/link";
import { CalendarDays, Users, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "./mode-toggle";
import { useSession } from "next-auth/react";
import { UserButton } from "./auth/user-button";


export function Header() {

    const { data: session } = useSession();
    
  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2">
              <img
                src="/LaraFest.svg"
                alt="Lara Fest Logo"
                width={126}
                height={31}
              />
            </Link>
            
            <div className="hidden md:flex items-center gap-4">
              <Link href="/admin/events">
                <Button variant="ghost" className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Eventos
                </Button>
              </Link>
              <Link href="/admin/clients">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Clientes
                </Button>
              </Link>
              <Link href="/admin/stands">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Stands
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ModeToggle />
            {session ? (
                        <UserButton/>
                    ) : (
                        <Button asChild variant="outline4" className="px-4 py-2 mt-4 ml-[-10px]">
                        <Link href="/auth/login">Entrar</Link>
                        </Button>
                    )}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/admin/events">Eventos</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/clients">Clientes</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/stands">Stands</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}