import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type SubscriptionStatus =
  | { isActive: true; subscription: any }
  | { isActive: false; subscription: null };

export function useSubscriptionRequired() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState<boolean>(false);

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
        setIsActive(active);
        setLoading(false);

        if (!active) {
          toast.error("Necesitas una suscripción para usar IA");
          router.replace("/suscripcion");
        }
      } catch {
        if (!cancelled) {
          setIsActive(false);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return { loading, isActive };
}

