import type { Metadata } from "next";
import '@fontsource-variable/montserrat';
import "../globals.css";
import { ProtectedAppShell } from "./components/protected-app-shell";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Dashboard - Caletas",
  description: "Tu dashboard personal para gestionar y explorar caletas universitarias.",
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!session?.user?.id) {
    return redirect("/login");
  }

  let showVerificationBanner = false;
  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { isEmailVerified: true },
    });
    showVerificationBanner = !user?.isEmailVerified;
  } catch (error) {
    console.error("[protected-layout] user lookup failed:", error);
    showVerificationBanner = false;
  }
  const userEmail = session.user.email ?? "";

  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ProtectedAppShell
            session={session}
            showVerificationBanner={showVerificationBanner}
            userEmail={userEmail}
          >
            {children}
          </ProtectedAppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}