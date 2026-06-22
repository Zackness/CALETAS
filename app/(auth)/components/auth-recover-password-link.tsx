import Link from "next/link";

export function AuthRecoverPasswordLink({ className = "" }: { className?: string }) {
  return (
    <div className={`text-center ${className}`.trim()}>
      <Link
        href="/reset"
        className="text-sm font-semibold text-[var(--caleta-accent)] transition-colors hover:text-white"
      >
        ¿Olvidaste tu contraseña?
      </Link>
    </div>
  );
}
