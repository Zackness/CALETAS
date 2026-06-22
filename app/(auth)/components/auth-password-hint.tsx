import { Info } from "lucide-react";

export function AuthPasswordHint() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-[#1C2D20] p-3">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--caleta-accent)]" />
      <p className="text-xs leading-relaxed text-white/70">
        <span className="font-semibold text-white/85">Requisitos:</span> mínimo 6 caracteres, una
        mayúscula, una minúscula y un número.
      </p>
    </div>
  );
}
