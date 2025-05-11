"use client";

import { Banner } from "@/components/ui/banner";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface OnboardingBannerProps {
  onboardingStatus: string | null | undefined;
}

export const OnboardingBanner = ({ onboardingStatus }: OnboardingBannerProps) => {
  if (onboardingStatus !== "CANCELADO") {
    return null;
  }

  return (
    <div className="w-full mt-5 mx-5">
      <Banner
        variant="warning"
        label="Para realizar solicitudes, necesitas completar tu perfil primero."
        action={{
          label: "Completar perfil",
          href: "/ajustes/cuenta"
        }}
      />
    </div>
  );
}; 