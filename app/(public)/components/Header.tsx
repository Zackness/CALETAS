"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/marca/Logo";

type NavLink = {
  href: string;
  label: string;
  isButton?: boolean;
};

const NAV_LINKS: NavLink[] = [
  { href: "/caracteristicas", label: "Características" },
  { href: "/testimonios", label: "Testimonios" },
  { href: "/aliados", label: "Aliados" },
  { href: "/blog", label: "Blog", isButton: true },
];

const navLinkClass =
  "whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-[var(--caleta-accent)] xl:px-3";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (toggleButtonRef.current?.contains(e.target as Node)) return;
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isMenuOpen]);

  const goTo = (path: string) => {
    router.push(path);
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 min-w-0 px-3 pt-4 sm:px-6 sm:pt-5 lg:px-8">
      <div className="chalk-container !px-0 min-w-0">
        <nav className="chalk-nav-bar grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 sm:px-5 sm:py-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-6 xl:gap-8">
          <div className="shrink-0 justify-self-start lg:pr-1">
            <Logo width={190} height={27} className="!pl-0 shrink-0" />
          </div>

          <div className="hidden min-w-0 items-center justify-center gap-0.5 lg:flex xl:gap-1">
            {NAV_LINKS.map((link) =>
              link.isButton ? (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => goTo(link.href)}
                  className={navLinkClass}
                >
                  {link.label}
                </button>
              ) : (
                <a key={link.href} href={link.href} className={navLinkClass}>
                  {link.label}
                </a>
              ),
            )}
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <a
              href="/login"
              className="hidden rounded-lg px-2.5 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white lg:inline-flex xl:px-3"
            >
              Iniciar sesión
            </a>
            <a href="/agregar-universidad" className="hidden font-special lg:inline-flex">
              <Button size="sm" className="rounded-xl px-3 text-xs shadow-md xl:px-4 xl:text-sm">
                Agrega institución
              </Button>
            </a>

            <button
              ref={toggleButtonRef}
              className="flex flex-col gap-1.5 p-2 lg:hidden"
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label="Abrir menú"
            >
              <span
                className={`block h-0.5 w-6 bg-white transition-all duration-300 ${isMenuOpen ? "translate-y-2 rotate-45" : ""}`}
              />
              <span
                className={`block h-0.5 w-6 bg-white transition-all duration-300 ${isMenuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-0.5 w-6 bg-white transition-all duration-300 ${isMenuOpen ? "-translate-y-2 -rotate-45" : ""}`}
              />
            </button>
          </div>
        </nav>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/45 backdrop-blur-[2px] lg:hidden">
          <div
            ref={menuRef}
            className="w-full max-h-[85vh] overflow-y-auto border-b border-white/10 bg-[color-mix(in_srgb,var(--mygreen-dark)_94%,black)] animate-fadeInDown"
          >
            <nav className="chalk-container flex flex-col gap-1 py-4">
              {NAV_LINKS.map((link) =>
                link.isButton ? (
                  <button
                    key={link.href}
                    type="button"
                    className="rounded-lg px-3 py-2.5 text-left text-base font-semibold text-white transition-colors hover:bg-white/10"
                    onClick={() => goTo(link.href)}
                  >
                    {link.label}
                  </button>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    className="rounded-lg px-3 py-2.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ),
              )}
              <a
                href="/agregar-universidad"
                className="rounded-lg px-3 py-2.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
                onClick={() => setIsMenuOpen(false)}
              >
                Agregar institución
              </a>
              <a
                href="/login"
                className="mt-2 block px-3 py-2.5 text-base font-semibold text-white/85"
                onClick={() => setIsMenuOpen(false)}
              >
                Iniciar sesión
              </a>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
