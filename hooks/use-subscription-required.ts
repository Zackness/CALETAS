import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type SubscriptionStatus =
  | { isActive: true; canUseChat?: boolean; subscription: any }
  | { isActive: false; canUseChat?: boolean; subscription: null };

type UseSubscriptionRequiredOptions = {
  requireChat?: boolean;
  noChatMessage?: string;
  requireBiblioteca?: boolean;
  noBibliotecaMessage?: string;
};

export function useSubscriptionRequired(options: UseSubscriptionRequiredOptions = {}) {
  const {
    requireChat = false,
    noChatMessage = "Tu plan actual no incluye Chat IA",
    requireBiblioteca = false,
    noBibliotecaMessage = "La biblioteca requiere un plan de $3/mes o superior",
  } = options;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [canUseChat, setCanUseChat] = useState<boolean>(false);
  const [canUseBiblioteca, setCanUseBiblioteca] = useState<boolean>(false);

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
        const data = (await res.json()) as SubscriptionStatus & {
          canUseBiblioteca?: boolean;
          hasFullCaletasPlan?: boolean;
        };
        if (cancelled) return;
        const active = !!data.isActive;
        const chatEnabled = active ? data.canUseChat !== false : false;
        const bibliotecaOk = active ? !!data.canUseBiblioteca : false;
        setIsActive(active);
        setCanUseChat(chatEnabled);
        setCanUseBiblioteca(bibliotecaOk);
        setLoading(false);

        if (!active) {
          toast.error("Necesitas una suscripción para usar IA");
          router.replace("/suscripcion");
          return;
        }

        if (requireChat && !chatEnabled) {
          toast.error(noChatMessage);
          router.replace("/suscripcion");
          return;
        }

        if (requireBiblioteca && !bibliotecaOk) {
          toast.error(noBibliotecaMessage);
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
  }, [router, requireChat, noChatMessage, requireBiblioteca, noBibliotecaMessage]);

  return { loading, isActive, canUseChat, canUseBiblioteca };
}

