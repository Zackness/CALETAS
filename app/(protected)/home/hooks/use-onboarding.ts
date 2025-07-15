"use client";

import { useState, useEffect } from "react";
import { OnboardingStatus } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export const useOnboarding = () => {
  const { data: session } = useSession();
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      if (session?.user) {
        try {
          const response = await fetch("/api/user/onboarding");
          if (response.ok) {
            const data = await response.json();
            setOnboardingStatus(data.onboardingStatus);
            // Si el estado es pendiente, redirigir a la página de onboarding
            if (data.onboardingStatus === OnboardingStatus.PENDIENTE) {
              router.push("/onboarding");
            }
          } else {
            console.error("Error al obtener el estado del onboarding");
          }
        } catch (error) {
          console.error("Error al obtener el estado del onboarding:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    fetchOnboardingStatus();
  }, [session, router]);

  return {
    onboardingStatus,
    isLoading
  };
}; 