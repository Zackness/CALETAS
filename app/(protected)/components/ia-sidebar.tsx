"use client";
import { BookOpen, FileText, Menu } from "lucide-react";
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
              <span className="text-2xl font-special text-[#40C9A9] block">Caletas</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-bold text-[#40C9A9]">Herramientas IA</span>
              <button onClick={() => setOpen(false)} className="text-white hover:text-[#40C9A9] text-2xl">×</button>
            </div>
            <nav className="flex flex-col gap-4">
              <Link href="/ia/fichas" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
                <BookOpen className="h-5 w-5 text-[#40C9A9]" />
                <span>Fichas de estudio</span>
              </Link>
              <Link href="/ia/resumir" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
                <FileText className="h-5 w-5 text-[#40C9A9]" />
                <span>Resumir/Explicar PDF</span>
              </Link>
              {/* Aquí puedes agregar más herramientas IA */}
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
          <span className="text-2xl font-special text-white block">Caletas</span>
        </div>
        <span className="text-lg font-bold text-[#40C9A9] mb-2">Herramientas IA</span>
        <nav className="flex flex-col gap-4">
          <Link href="/ia/fichas" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
            <BookOpen className="h-5 w-5 text-[#40C9A9]" />
            <span>Fichas de estudio</span>
          </Link>
          <Link href="/ia/resumir" className="flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors">
            <FileText className="h-5 w-5 text-[#40C9A9]" />
            <span>Resumir/Explicar PDF</span>
          </Link>
          {/* Aquí puedes agregar más herramientas IA */}
        </nav>
      </aside>
    </>
  );
} 