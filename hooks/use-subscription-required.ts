import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type SubscriptionStatus =
  | { isActive: true; canUseChat?: boolean; subscription: any }
  | { isActive: false; canUseChat?: boolean; subscription: null };

type UseSubscriptionRequiredOptions = {
  requireChat?: boolean;
  noChatMessage?: string;
};

export function useSubscriptionRequired(options: UseSubscriptionRequiredOptions = {}) {
  const { requireChat = false, noChatMessage = "Tu plan actual no incluye Chat IA" } = options;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [canUseChat, setCanUseChat] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/subscription/status");
        if (!res.ok) {
          // Si no está logueado o falla, dejamos que el resto maneje auth
          if (!cancelled) {
            setIsActive(false);
            setLoading(false);
          }
          return;
        }
        const data = (await res.json()) as SubscriptionStatus;
        if (cancelled) return;
        const active = !!data.isActive;
        const chatEnabled = active ? data.canUseChat !== false : false;
        setIsActive(active);
        setCanUseChat(chatEnabled);
        setLoading(false);

        if (!active) {
          toast.error("Necesitas una suscripción para usar IA");
          router.replace("/suscripcion");
          return;
        }

        if (requireChat && !chatEnabled) {
          toast.error(noChatMessage);
          router.replace("/suscripcion");
        }
      } catch {
        if (!cancelled) {
          setIsActive(false);
          setCanUseChat(false);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, requireChat, noChatMessage]);

  return { loading, isActive, canUseChat };
}

