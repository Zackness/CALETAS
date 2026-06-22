"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BLOG_CATEGORIES, type BlogCategoryMeta } from "@/lib/blog/categories";
import type { BlogCategory } from "@prisma/client";
import {
  checkBlogSubscribeEmail,
  getSessionBlogSubscriptions,
  subscribeToBlogCategories,
} from "@/lib/actions/blog-subscriptions";
import { stvn } from "@/lib/public-ui";
import { cn } from "@/lib/utils";

export function BlogSubscribeForm({
  defaultCategory,
  sessionEmail,
  className,
}: {
  defaultCategory?: BlogCategory;
  sessionEmail?: string | null;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loggedIn = !!sessionEmail;
  const [email, setEmail] = useState(sessionEmail ?? "");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [needsAccount, setNeedsAccount] = useState(false);
  const [selected, setSelected] = useState<Set<BlogCategory>>(() => {
    const s = new Set<BlogCategory>();
    if (defaultCategory) s.add(defaultCategory);
    return s;
  });
  const [alreadySubscribed, setAlreadySubscribed] = useState<BlogCategory[]>([]);

  useEffect(() => {
    if (!loggedIn) return;
    startTransition(async () => {
      try {
        const subs = await getSessionBlogSubscriptions();
        setAlreadySubscribed(subs);
        setSelected((prev) => {
          const next = new Set(prev);
          for (const c of subs) next.add(c);
          return next;
        });
      } catch {
        /* ignore */
      }
    });
  }, [loggedIn]);

  function toggleCategory(id: BlogCategory) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onEmailBlur() {
    if (loggedIn || !email.trim()) return;
    startTransition(async () => {
      const res = await checkBlogSubscribeEmail(email);
      if (res.ok && "needsAccount" in res) {
        setNeedsAccount(res.needsAccount);
      }
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const categories = [...selected];
    if (categories.length === 0) {
      setError("Elige al menos un pilar.");
      return;
    }

    startTransition(async () => {
      try {
        await subscribeToBlogCategories({
          email: loggedIn ? sessionEmail! : email,
          categories,
          name: needsAccount ? name : undefined,
          password: needsAccount ? password : undefined,
        });
        setSuccess(
          loggedIn || !needsAccount
            ? "Listo. Te avisaremos por correo cuando publiquemos en esos pilares."
            : "Cuenta creada y suscripción activa. Revisa tu correo cuando publiquemos."
        );
        setNeedsAccount(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo completar la suscripción.");
      }
    });
  }

  return (
    <div className={cn(`${stvn.card} p-6 sm:p-8`, className)}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#40C9A9]/15">
          <Bell className="h-5 w-5 text-[#40C9A9]" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Recibe nuevos artículos</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Suscríbete por pilar y te notificamos cuando publiquemos en esas categorías.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-5">
        {!loggedIn ? (
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Correo</span>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={onEmailBlur}
              placeholder="tu@empresa.com"
              className={stvn.input}
            />
          </label>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">
            Sesión: <strong className="text-[var(--foreground)]">{sessionEmail}</strong>
          </p>
        )}

        {needsAccount && !loggedIn ? (
          <div className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              Este correo no tiene cuenta. Crea una contraseña para recibir avisos y acceder al escritorio.
            </p>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Nombre</span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={stvn.input}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Contraseña</span>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={stvn.input}
              />
            </label>
          </div>
        ) : null}

        <fieldset>
          <legend className="mb-3 text-sm font-medium text-[var(--foreground)]">Pilares de interés</legend>
          <div className="flex flex-wrap gap-2">
            {BLOG_CATEGORIES.map((c: BlogCategoryMeta) => {
              const on = selected.has(c.id);
              const was = alreadySubscribed.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCategory(c.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    on
                      ? "border-[#40C9A9]/50 bg-[#40C9A9]/15 text-[var(--foreground)]"
                      : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[#40C9A9]/30"
                  )}
                >
                  {c.label}
                  {was && on ? " ✓" : ""}
                </button>
              );
            })}
          </div>
        </fieldset>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p> : null}

        <Button type="submit" disabled={pending} className={stvn.btnPrimary}>
          {pending ? "Guardando…" : "Suscribirme"}
        </Button>
      </form>
    </div>
  );
}
