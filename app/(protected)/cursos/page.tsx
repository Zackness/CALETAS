"use client";

import { Library, Sparkles } from "lucide-react";

export default function CursosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full text-center space-y-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#354B3A] border border-white/10 mb-4">
          <Library className="w-10 h-10 text-[#40C9A9]" />
        </div>
        <h1 className="text-4xl md:text-5xl font-special text-white">
          Cursos y tutoriales
        </h1>
        <p className="text-white/70 text-lg">
          Material de apoyo y tutoriales sobre temas de interés para tu formación.
        </p>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#354B3A] border border-white/10 px-5 py-2.5 text-[#40C9A9] font-medium">
          <Sparkles className="w-4 h-4" />
          Próximamente
        </div>
        <p className="text-white/50 text-sm max-w-md mx-auto">
          Estamos preparando contenido exclusivo para que puedas profundizar en lo que más te interesa. Muy pronto podrás acceder desde aquí.
        </p>
      </div>
    </div>
  );
}
