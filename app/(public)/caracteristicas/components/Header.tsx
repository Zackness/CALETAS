"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { Logo } from "@/components/marca/Logo";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className="relative w-full shadow z-50">
      <nav className="flex flex-row w-full max-w-[1400px] mx-auto justify-between items-center px-4 sm:px-8 lg:px-12 font-semibold text-[16px] sm:text-[18px] py-3 sm:py-4 relative">
        <Logo />
        {/* Menú de escritorio */}
        <div className="hidden md:flex md:flex-row md:gap-4 lg:gap-6 items-center">
          <a href="/caracteristicas" className="hover:text-[#40C9A9] transition-colors cursor-pointer text-white text-base px-2 py-1 rounded-md hover:bg-white/10">
            Características
          </a>
          <a href="/testimonios" className="hover:text-[#40C9A9] transition-colors text-white text-base px-2 py-1 rounded-md hover:bg-white/10">
            Testimonios
          </a>
          <a href="/aliados" className="hover:text-[#40C9A9] transition-colors text-white text-base px-2 py-1 rounded-md hover:bg-white/10">
            Aliados
          </a>
          <a href="/blog" className="hover:text-[#40C9A9] transition-colors text-white text-base px-2 py-1 rounded-md hover:bg-white/10">
            Blog
          </a>
        </div>
        {/* Botón de menú móvil */}
        <button
          className="md:hidden flex flex-col space-y-1 p-2 focus:outline-none z-[110]"
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
        </button>
        {/* Botón Iniciar Sesión para escritorio */}
        <a
          href="/auth/login"
          className="font-special hidden md:block ml-2"
        >
          <Button
            size="sm"
            className="text-sm sm:text-base font-special text-white rounded-xl px-4 py-2 shadow"
          >
            Iniciar Sesión
          </Button>
        </a>
      </nav>
      {/* Menú móvil tipo dropdown */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex flex-col items-stretch bg-black/40" style={{backdropFilter: 'blur(2px)'}}>
          <div ref={menuRef} className="w-full bg-gradient-to-t from-mygreen to-mygreen-light border-b border-white/10 shadow-lg animate-fadeInDown">
            <nav className="flex flex-col gap-1 py-2 px-4">
              <a
                href="/caracteristicas"
                className="text-white font-special text-base py-2 px-2 rounded-md hover:bg-white/10 transition-colors text-left"
                onClick={() => setIsMenuOpen(false)}
              >
                Características
              </a>
              <a
                href="/testimonios"
                className="text-white font-special text-base py-2 px-2 rounded-md hover:bg-white/10 transition-colors text-left"
                onClick={() => setIsMenuOpen(false)}
              >
                Testimonios
              </a>
              <a
                href="/aliados"
                className="text-white font-special text-base py-2 px-2 rounded-md hover:bg-white/10 transition-colors text-left"
                onClick={() => setIsMenuOpen(false)}
              >
                Aliados
              </a>
              <a
                href="/blog"
                className="text-white font-special text-base py-2 px-2 rounded-md hover:bg-white/10 transition-colors text-left"
                onClick={() => setIsMenuOpen(false)}
              >
                Blog
              </a>
              <a href="/auth/login" className="mt-2 mb-1 block">
                <Button
                  size="sm"
                  className="w-full text-sm font-special text-white rounded-xl px-4 py-2 shadow"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Iniciar Sesión
                </Button>
              </a>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
} 