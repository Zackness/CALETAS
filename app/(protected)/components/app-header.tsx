"use client";

import { Bell, LogOut, Heart, Upload, Search as SearchIcon, BarChart3, Menu, X, FileText, BookOpen, GraduationCap, Calendar, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface AppHeaderProps {
  session: any;
}

export function DashboardHeader({ session }: AppHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // Obtener notificaciones reales
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data);
        setLoading(false);
      });
  }, []);

  // Bloquear scroll de fondo cuando el menú está abierto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isMenuOpen]);

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
    <header className="border-b border-white/10 w-full h-16 py-4 bg-[#203324]">
      <div className="flex h-full items-center justify-between px-2 md:px-4 gap-2 md:gap-4">
        {/* Izquierda: Botón de menú móvil */}
        <button
          className="md:hidden flex flex-col space-y-1 p-2 focus:outline-none z-[110]"
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
        </button>
        
        {/* Centro: Buscador centrado */}
        <form className="relative flex-1 max-w-lg mx-auto flex justify-center">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 h-4 w-4 md:h-5 md:w-5" />
          <input
            type="text"
            placeholder="Buscar caletas, materias, universidades..."
            className="w-full pl-8 md:pl-10 pr-2 md:pr-4 py-2 rounded-lg bg-white/10 text-white placeholder:text-white/60 border border-white/10 focus:outline-none focus:border-[#40C9A9] text-sm md:text-base"
          />
        </form>
        {/* Derecha: Favoritos, subir, notificaciones, avatar */}
        <div className="flex items-center gap-1 md:gap-2">
          <Link href="/caletas/favoritos">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8 md:h-10 md:w-10 cursor-pointer">
              <Heart className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </Link>
          <Link href="/caletas/crear">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8 md:h-10 md:w-10 cursor-pointer">
              <Upload className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 relative h-8 w-8 md:h-10 md:w-10 cursor-pointer">
                <Bell className="h-4 w-4 md:h-5 md:w-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#40C9A9] text-xs text-white rounded-full px-1.5 py-0.5 font-bold border-2 border-[#203324]">{notifications.length}</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-[#203324] border-white/10 text-white">
              <div className="p-2 font-bold text-[#40C9A9]">Notificaciones</div>
              {loading ? (
                <div className="p-4 text-center text-white/70">Cargando...</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-white/70">Sin notificaciones</div>
              ) : (
                notifications.map((n) => (
                  <DropdownMenuItem key={n.id} className="flex justify-between items-center gap-2 hover:bg-white/10">
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
              <Button variant="ghost" size="icon" className="rounded-full p-0 w-8 h-8 md:w-10 md:h-10 bg-[#40C9A9] text-white hover:bg-[#40C9A9]/80 cursor-pointer">
                <Avatar className="h-6 w-6 md:h-8 md:w-8">
                  <AvatarImage src={session?.user?.image || "/globe.svg"} alt={session?.user?.name || "Usuario"} />
                  <AvatarFallback className="bg-[#40C9A9] text-white text-xs md:text-sm font-semibold">
                    {session?.user?.name ? getUserInitials(session.user.name) : "US"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#203324] border-white/10 text-white">
              <DropdownMenuItem asChild className="gap-2 hover:bg-white/10 cursor-pointer">
                <Link href="/caletas/estadisticas">
                  <BarChart3 className="h-4 w-4 text-[#40C9A9]" />
                  <span>Estadísticas de mis caletas</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-red-400 hover:bg-red-500/10 cursor-pointer" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                <span>Salir</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Menú móvil tipo dropdown */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex flex-col items-stretch bg-black/40" style={{backdropFilter: 'blur(2px)'}}>
          <div ref={menuRef} className="w-full bg-gradient-to-t from-mygreen to-mygreen-light border-b border-white/10 shadow-lg animate-fadeInDown">
            <nav className="flex flex-col gap-1 py-2 px-4">
              {/* Sección: Caletas */}
              <div className="text-[#40C9A9] font-semibold text-sm px-2 py-1 mt-2">Caletas</div>
              <Link
                href="/caletas"
                className="text-white font-special text-base py-2 px-2 rounded-md hover:bg-white/10 transition-colors text-left flex items-center gap-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <FileText className="h-4 w-4" />
                Explorar Caletas
              </Link>
              <Link
                href="/caletas/crear"
                className="text-white font-special text-base py-2 px-2 rounded-md hover:bg-white/10 transition-colors text-left flex items-center gap-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <Upload className="h-4 w-4" />
                Subir Caleta
              </Link>
              <Link
                href="/caletas/favoritos"
                className="text-white font-special text-base py-2 px-2 rounded-md hover:bg-white/10 transition-colors text-left flex items-center gap-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <Heart className="h-4 w-4" />
                Mis Favoritos
              </Link>
              <Link
                href="/caletas/mis-recursos"
                className="text-white font-special text-base py-2 px-2 rounded-md hover:bg-white/10 transition-colors text-left flex items-center gap-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <BookOpen className="h-4 w-4" />
                Mis Recursos
              </Link>
              
              {/* Sección: Académico */}
              <div className="text-[#40C9A9] font-semibold text-sm px-2 py-1 mt-4">Académico</div>
              <Link
                href="/academico"
                className="text-white font-special text-base py-2 px-2 rounded-md hover:bg-white/10 transition-colors text-left flex items-center gap-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <GraduationCap className="h-4 w-4" />
                Panel de Control
              </Link>
              <Link
                href="/academico/historial"
                className="text-white font-special text-base py-2 px-2 rounded-md hover:bg-white/10 transition-colors text-left flex items-center gap-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <Calendar className="h-4 w-4" />
                Historial Académico
              </Link>
              <Link
                href="/academico/metas"
                className="text-white font-special text-base py-2 px-2 rounded-md hover:bg-white/10 transition-colors text-left flex items-center gap-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <BarChart3 className="h-4 w-4" />
                Metas Académicas
              </Link>
              
              {/* Sección: IA */}
              <div className="text-[#40C9A9] font-semibold text-sm px-2 py-1 mt-4">Herramientas IA</div>
              <Link
                href="/ia/fichas"
                className="text-white font-special text-base py-2 px-2 rounded-md hover:bg-white/10 transition-colors text-left flex items-center gap-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <FileText className="h-4 w-4" />
                Fichas de Estudio
              </Link>
              <Link
                href="/ia/cuestionario"
                className="text-white font-special text-base py-2 px-2 rounded-md hover:bg-white/10 transition-colors text-left flex items-center gap-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <BookOpen className="h-4 w-4" />
                Cuestionarios
              </Link>
              <Link
                href="/ia/resumir"
                className="text-white font-special text-base py-2 px-2 rounded-md hover:bg-white/10 transition-colors text-left flex items-center gap-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <FileText className="h-4 w-4" />
                Resúmenes
              </Link>
              
              {/* Sección: Configuración */}
              <div className="text-[#40C9A9] font-semibold text-sm px-2 py-1 mt-4">Configuración</div>
              <Link
                href="/ajustes"
                className="text-white font-special text-base py-2 px-2 rounded-md hover:bg-white/10 transition-colors text-left flex items-center gap-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="h-4 w-4" />
                Ajustes
              </Link>
              
              {/* Botón de cerrar sesión */}
              <div className="mt-4 pt-2 border-t border-white/10">
                <button
                  className="w-full text-left text-red-400 font-special text-base py-2 px-2 rounded-md hover:bg-red-500/10 transition-colors flex items-center gap-3"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleSignOut();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesión
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
} 