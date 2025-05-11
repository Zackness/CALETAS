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
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <nav className="w-full border-b">
      <div className="w-full px-4 py-3">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-2">
              <img
                src="/images/full-logo.png"
                alt="Global Logo"
                width={126}
                height={31}
              />
            </Link>

          {/* Espacio para botones */}
          <div className="flex items-center gap-6">

          {/* Botones en grande */}
          <div className="flex items-center gap-2">

            <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />

              <Link href="/login">
                <Button variant="ghost" className="flex items-center gap-2">
                  iniciar sesion
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="form" className="flex items-center gap-2">
                  Registrarse
                </Button>
              </Link>
            </div>
          </div>

          {/* Botones en pequeño */}
          <div className="md:hidden">
            <ThemeToggle />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/login">Iniciar sesion</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register">Registrarse</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/contacto">Contacto</Link>
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