"use client";
import { BookOpen, FileText, Menu, Home, GraduationCap, Target, History, Search, Upload, Settings, BarChart3, Lightbulb, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function IASidebar() {
  const [open, setOpen] = useState(false);

  // Sidebar fijo en escritorio, Drawer en móvil
  return (
    <>
      {/* Botón flotante para móvil */}
      <button
        className="fixed bottom-4 left-4 z-40 md:hidden bg-[#354B3A] text-white rounded-full p-3 shadow-lg hover:bg-[#203324] transition-colors"
        onClick={() => setOpen(true)}
        aria-label="Abrir herramientas IA"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Drawer para móvil */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex">
          <aside className="w-64 bg-[#203324] h-full p-6 flex flex-col gap-6 shadow-xl animate-slide-in-left">
            {/* Logo/NOMBRE APP */}
            <div className="mb-4">
              <Link href="/home" className="block">
                <span className="text-2xl font-special text-[#40C9A9] block hover:text-[#40C9A9]/80 transition-colors cursor-pointer">Caletas</span>
              </Link>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-bold text-[#40C9A9]">Herramientas IA</span>
              <button onClick={() => setOpen(false)} className="text-white hover:text-[#40C9A9] text-2xl">×</button>
            </div>
            <nav className="flex flex-col gap-2">
              {/* Navegación Principal */}
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-white/70 mb-2 px-2">Navegación</h3>
                <Link href="/home" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
                  <Home className="h-5 w-5 text-[#40C9A9]" />
                  <span>Dashboard</span>
                </Link>
                <Link href="/caletas" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
                  <Search className="h-5 w-5 text-[#40C9A9]" />
                  <span>Recursos Colaborativos</span>
                </Link>
                <Link href="/caletas/mis-recursos" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
                  <Upload className="h-5 w-5 text-[#40C9A9]" />
                  <span>Mis Recursos</span>
                </Link>
              </div>

              {/* Académico */}
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-white/70 mb-2 px-2">Académico</h3>
                <Link href="/academico" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
                  <BarChart3 className="h-5 w-5 text-[#40C9A9]" />
                  <span>Panel de Control</span>
                </Link>
                <Link href="/academico/metas" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
                  <Target className="h-5 w-5 text-[#40C9A9]" />
                  <span>Metas Académicas</span>
                </Link>
                <Link href="/academico/historial" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
                  <History className="h-5 w-5 text-[#40C9A9]" />
                  <span>Historial Académico</span>
                </Link>
              </div>

              {/* Herramientas IA */}
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-white/70 mb-2 px-2">Herramientas IA</h3>
              <Link href="/ia/fichas" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
                <BookOpen className="h-5 w-5 text-[#40C9A9]" />
                  <span>Fichas de Estudio</span>
              </Link>
              <Link href="/ia/resumir" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
                <FileText className="h-5 w-5 text-[#40C9A9]" />
                <span>Resumir/Explicar PDF</span>
              </Link>
                <Link href="/ia/cuestionario" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
                  <HelpCircle className="h-5 w-5 text-[#40C9A9]" />
                  <span>Cuestionarios</span>
                </Link>
              </div>

              {/* Configuración */}
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-white/70 mb-2 px-2">Configuración</h3>
                <Link href="/ajustes" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
                  <Settings className="h-5 w-5 text-[#40C9A9]" />
                  <span>Ajustes</span>
                </Link>
              </div>
            </nav>
          </aside>
          {/* Clic fuera cierra el Drawer */}
          <div className="flex-1" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Sidebar fijo en escritorio */}
      <aside className="hidden md:flex flex-col gap-6 bg-[#203324] border-r border-white/10 w-64 min-h-screen p-6 sticky top-0 left-0 z-30">
        {/* Logo/NOMBRE APP */}
        <div className="mb-4">
          <Link href="/home" className="block">
            <span className="text-2xl font-special text-white block hover:text-[#40C9A9] transition-colors cursor-pointer">Caleta</span>
          </Link>
        </div>
        <nav className="flex flex-col gap-2">
          {/* Navegación Principal */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white/70 mb-2 px-2">Navegación</h3>
            <Link href="/home" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
              <Home className="h-5 w-5 text-[#40C9A9]" />
              <span>Dashboard</span>
            </Link>
            <Link href="/caletas" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
              <Search className="h-5 w-5 text-[#40C9A9]" />
              <span>Recursos Colaborativos</span>
            </Link>
            <Link href="/caletas/mis-recursos" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
              <Upload className="h-5 w-5 text-[#40C9A9]" />
              <span>Mis Recursos</span>
            </Link>
          </div>

          {/* Académico */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white/70 mb-2 px-2">Académico</h3>
            <Link href="/academico" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
              <BarChart3 className="h-5 w-5 text-[#40C9A9]" />
              <span>Panel de Control</span>
            </Link>
            <Link href="/academico/metas" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
              <Target className="h-5 w-5 text-[#40C9A9]" />
              <span>Metas Académicas</span>
            </Link>
            <Link href="/academico/historial" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
              <History className="h-5 w-5 text-[#40C9A9]" />
              <span>Historial Académico</span>
            </Link>
          </div>

          {/* Herramientas IA */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white/70 mb-2 px-2">Herramientas IA</h3>
          <Link href="/ia/fichas" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
            <BookOpen className="h-5 w-5 text-[#40C9A9]" />
              <span>Fichas de Estudio</span>
          </Link>
          <Link href="/ia/resumir" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
            <FileText className="h-5 w-5 text-[#40C9A9]" />
            <span>Resumir/Explicar PDF</span>
          </Link>
            <Link href="/ia/cuestionario" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
              <HelpCircle className="h-5 w-5 text-[#40C9A9]" />
              <span>Cuestionarios</span>
            </Link>
          </div>

          {/* Configuración */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white/70 mb-2 px-2">Configuración</h3>
            <Link href="/ajustes" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
              <Settings className="h-5 w-5 text-[#40C9A9]" />
              <span>Ajustes</span>
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
} 