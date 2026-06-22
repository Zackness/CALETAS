"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { NotificationAction } from "@/lib/notifications/actions";

type Props = {
  actions: NotificationAction[];
  onNavigate?: () => void;
  onMarkRead?: () => void;
};

export function NotificationInlineActions({ actions, onNavigate, onMarkRead }: Props) {
  const router = useRouter();
  const [followState, setFollowState] = useState<Record<string, boolean | "loading">>({});

  if (actions.length === 0) return null;

  async function handleFollow(userId: string) {
    setFollowState((s) => ({ ...s, [userId]: "loading" }));
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}/follow`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
      if (!res.ok) {
        if (data.code === "PROFILE_REQUIRED") {
          toast.error("Crea tu perfil público para seguir a otros");
          router.push("/perfil");
          return;
        }
        throw new Error(data.error || "No se pudo seguir");
      }
      setFollowState((s) => ({ ...s, [userId]: true }));
      onMarkRead?.();
      toast.success("Ahora sigues a esta persona");
    } catch (e) {
      setFollowState((s) => ({ ...s, [userId]: false }));
      toast.error(e instanceof Error ? e.message : "Error al seguir");
    }
  }

  return (
    <div className="mt-2.5 flex flex-wrap gap-2">
      {actions.map((action) => {
        if (action.followUserId) {
          const uid = action.followUserId;
          const state = followState[uid];
          if (state === true) {
            return (
              <span
                key={action.id}
                className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/55"
              >
                Siguiendo
              </span>
            );
          }
          return (
            <button
              key={action.id}
              type="button"
              disabled={state === "loading"}
              onClick={(e) => {
                e.stopPropagation();
                void handleFollow(uid);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors",
                "bg-[var(--accent-hex)] text-[#1C2D20] hover:bg-[color-mix(in_oklab,var(--accent-hex)_85%,white)]",
              )}
            >
              {state === "loading" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {action.label}
            </button>
          );
        }

        if (!action.href) return null;

        const isAprende = action.variant === "aprende";
        const isPrimary = action.variant === "primary";

        return (
          <button
            key={action.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead?.();
              onNavigate?.();
              router.push(action.href!);
            }}
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold transition-colors",
              isAprende &&
                "border border-[color-mix(in_oklab,var(--aprende-accent)_40%,transparent)] bg-[color-mix(in_oklab,var(--aprende-accent)_18%,#1C2D20)] text-[var(--aprende-accent-bright)] hover:bg-[color-mix(in_oklab,var(--aprende-accent)_28%,#1C2D20)]",
              isPrimary &&
                !isAprende &&
                "bg-[var(--accent-hex)] text-[#1C2D20] hover:bg-[color-mix(in_oklab,var(--accent-hex)_85%,white)]",
              !isPrimary &&
                !isAprende &&
                "border border-white/15 bg-white/5 text-white/80 hover:bg-white/10",
            )}
          >
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
