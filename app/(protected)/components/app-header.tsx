"use client";

import { Bell, LogOut, Heart, BarChart3, User, ShieldCheck, CreditCard, Sparkles } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HeaderSearch } from "./header-search";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  NotificationBellPanel,
  type NotificationRecord,
} from "@/components/notifications/notification-bell-panel";

interface AppHeaderProps {
  session: any;
  isAprendeZone?: boolean;
}

export function DashboardHeader({ session, isAprendeZone = false }: AppHeaderProps) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [bellOpen, setBellOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => session?.user?.role === "ADMIN");

  const loadNotifications = useCallback(() => {
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setNotifications(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!bellOpen) return;
    loadNotifications();
  }, [bellOpen, loadNotifications]);

  useEffect(() => {
    if (session?.user?.role) {
      setIsAdmin(session.user.role === "ADMIN");
      return;
    }

    fetch("/api/user")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setIsAdmin(data?.user?.role === "ADMIN");
      })
      .catch(() => {
        // ignore
      });
  }, [session?.user?.role]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

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

  const handleMarkRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDismiss = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <header className="sticky top-0 z-[100] w-full shrink-0 px-3 pt-2 pb-2 sm:px-4 md:px-8 md:pt-3 md:pb-3">
      <div className="mx-auto w-full max-w-7xl min-w-0">
        <nav
          aria-label="Barra superior del panel"
          className={cn(
            "chalk-nav-bar flex min-h-0 flex-wrap items-center gap-2 px-2.5 py-2 sm:gap-3 sm:px-4 sm:py-2.5 md:h-14 md:flex-nowrap md:gap-4",
            isAprendeZone && "chalk-nav-bar-aprende",
          )}
        >
          <SidebarTrigger
            className={cn(
              "order-1 shrink-0 text-white hover:bg-white/10",
              isAprendeZone && "hover:bg-[color-mix(in_oklab,var(--aprende-accent)_18%,transparent)]",
            )}
            aria-label="Mostrar u ocultar menú lateral"
          />

          {isAprendeZone ? (
            <div className="order-2 flex min-w-0 items-center gap-2 md:order-2 md:mr-auto">
              <span className="aprende-header-badge hidden sm:inline-flex">
                <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
                Aprende
              </span>
              <span className="truncate text-xs text-white/45 sm:text-sm">Zona de cursos en CALETAS</span>
            </div>
          ) : null}

          <div
            className={cn(
              "order-3 w-full min-w-0 md:flex md:w-auto md:flex-1 md:justify-center",
              isAprendeZone ? "md:order-3" : "md:order-2",
            )}
          >
            <HeaderSearch />
          </div>

          <div className={cn("order-2 ml-auto flex items-center gap-1 md:ml-0 md:gap-2", isAprendeZone ? "md:order-4" : "md:order-3")}>
          <Link href="/caletas/favoritos" className="hidden sm:block">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8 md:h-10 md:w-10 cursor-pointer">
              <Heart className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </Link>
          <DropdownMenu open={bellOpen} onOpenChange={setBellOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 relative h-8 w-8 md:h-10 md:w-10 cursor-pointer">
                <Bell className="h-4 w-4 md:h-5 md:w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[var(--accent-hex)] text-xs text-white rounded-full px-1.5 py-0.5 font-bold border-2 border-[var(--mygreen)]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="border-0 bg-transparent p-0 shadow-none"
            >
              <NotificationBellPanel
                items={notifications}
                loading={loading}
                onMarkRead={handleMarkRead}
                onDismiss={handleDismiss}
                onMarkAllRead={handleMarkAllRead}
                onClose={() => setBellOpen(false)}
              />
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
        </nav>
      </div>
    </header>
  );
} 