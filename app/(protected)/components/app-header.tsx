"use client";

import { Bell, LogOut, Heart, BarChart3, User, ShieldCheck, CreditCard } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { HeaderSearch } from "./header-search";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface AppHeaderProps {
  session: any;
}

export function DashboardHeader({ session }: AppHeaderProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(() => session?.user?.role === "ADMIN");

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Preferir rol desde sesión para no depender de /api/user.
    if (session?.user?.role) {
      setIsAdmin(session.user.role === "ADMIN");
      return;
    }

    // Fallback: cargar rol
    fetch("/api/user")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setIsAdmin(data?.user?.role === "ADMIN");
      })
      .catch(() => {
        // ignore
      });
  }, [session?.user?.role]);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    });
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDeleteNotification = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <header className="sticky top-0 z-[100] w-full shrink-0 border-b border-white/10 bg-[var(--mygreen)] py-2 md:h-16 md:py-4">
      <div className="flex min-w-0 flex-wrap items-center gap-2 px-2 md:h-full md:flex-nowrap md:justify-between md:gap-4 md:px-4">
        <SidebarTrigger
          className="order-1 shrink-0 text-white hover:bg-white/10"
          aria-label="Mostrar u ocultar menú lateral"
        />
        
        {/* Centro: Buscador con sugerencias tipo YouTube */}
        <div className="order-3 w-full min-w-0 md:order-2 md:w-auto md:flex-1 md:min-w-0">
          <HeaderSearch />
        </div>
        {/* Derecha: Favoritos, subir, notificaciones, avatar */}
        <div className="order-2 ml-auto md:order-3 md:ml-0 flex items-center gap-1 md:gap-2">
          <Link href="/caletas/favoritos" className="hidden sm:block">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8 md:h-10 md:w-10 cursor-pointer">
              <Heart className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 relative h-8 w-8 md:h-10 md:w-10 cursor-pointer">
                <Bell className="h-4 w-4 md:h-5 md:w-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[var(--accent-hex)] text-xs text-white rounded-full px-1.5 py-0.5 font-bold border-2 border-[var(--mygreen)]">{notifications.length}</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-80 max-w-[calc(100vw-1rem)]">
              <div className="p-2 font-bold text-[var(--accent-hex)]">Notificaciones</div>
              {loading ? (
                <div className="p-4 text-center text-white/70">Cargando...</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-white/70">Sin notificaciones</div>
              ) : (
                notifications.map((n) => (
                  <DropdownMenuItem key={n.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{n.message}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:bg-red-500/10"
                      onClick={() => handleDeleteNotification(n.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full p-0 w-8 h-8 md:w-10 md:h-10 bg-[var(--accent-hex)] text-white hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)] cursor-pointer">
                <Avatar className="h-6 w-6 md:h-8 md:w-8">
                  <AvatarImage src={session?.user?.image || "/globe.svg"} alt={session?.user?.name || "Usuario"} />
                  <AvatarFallback className="bg-[var(--accent-hex)] text-white text-xs md:text-sm font-semibold">
                    {session?.user?.name ? getUserInitials(session.user.name) : "US"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-56 min-w-[12rem] max-w-[calc(100vw-1rem)]">
              <DropdownMenuItem asChild className="cursor-pointer gap-2">
                <Link href="/perfil">
                  <User className="h-4 w-4 text-[var(--accent-hex)]" />
                  <span>Ir a mi perfil</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="cursor-pointer gap-2">
                <Link href="/suscripcion">
                  <CreditCard className="h-4 w-4 text-[var(--accent-hex)]" />
                  <span>Suscripción</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="cursor-pointer gap-2">
                <Link href="/caletas/estadisticas">
                  <BarChart3 className="h-4 w-4 text-[var(--accent-hex)]" />
                  <span>Estadísticas de mis caletas</span>
                </Link>
              </DropdownMenuItem>

              {isAdmin ? (
                <DropdownMenuItem asChild className="cursor-pointer gap-2">
                  <Link href="/admin/estadisticas">
                    <ShieldCheck className="h-4 w-4 text-[var(--accent-hex)]" />
                    <span>Panel admin</span>
                  </Link>
                </DropdownMenuItem>
              ) : null}

              <DropdownMenuItem asChild className="cursor-pointer gap-2">
                <Link href="/ajustes">
                  <User className="h-4 w-4 text-[var(--accent-hex)]" />
                  <span>Ajustes</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-red-300 focus:bg-red-500/20 focus:text-red-200 data-[highlighted]:bg-red-500/20 data-[highlighted]:text-red-200"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                <span>Salir</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 