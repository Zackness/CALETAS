import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/(protected)/components/app-sidebar";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import "@/app/globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { DashboardHeader } from "@/components/header";
import { db } from "@/lib/db";
import { OnboardingBanner } from "@/components/ui/onboarding-banner";

export const metadata: Metadata = {
  title: "Home | Global Legal",
  description: "En Global Legal simplificamos tus trámites",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function ProtectedLayout({
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
    <SessionProvider session={session}>
      <html lang="es">
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider>
              <div className="flex h-screen w-full">
                {/* Sidebar */}
                <AppSidebar session={session} />

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-h-screen bg-background">
                  <DashboardHeader />
                  <OnboardingBanner onboardingStatus={user?.onboardingStatus}/>
                  <div className="flex-1">
                    {children}
                  </div>
                </main>
              </div>
            </SidebarProvider>
          </ThemeProvider>
        </body>
      </html>
    </SessionProvider>
  );
}

