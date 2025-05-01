import { auth } from "@/auth";
import { db } from "@/lib/db";
import { OnboardingStatus } from "@prisma/client";
import { Banner } from "@/components/ui/banner";
import { redirect } from "next/navigation";

export default async function SolicitudesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  // Verificar el estado de onboarding
  const user = await db.user.findUnique({
    where: {
      id: session.user.id
    },
    select: {
      onboardingStatus: true
    }
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Banner para usuarios que no han completado el onboarding */}
      {user?.onboardingStatus === "CANCELADO" && (
        <div className="w-full">
          <Banner
            variant="warning"
            label="Para realizar solicitudes, necesitas completar tu perfil primero."
            action={{
              label: "Completar perfil",
              onClick: () => window.location.href = "/ajustes/cuenta"
            }}
          />
        </div>
      )}
      {children}
    </div>
  );
} 