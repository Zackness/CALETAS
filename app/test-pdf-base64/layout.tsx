import type { Metadata } from "next";
import '@fontsource-variable/montserrat';
import "../globals.css";
import { ProtectedAppShell } from "../(protected)/components/protected-app-shell";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard - Caletas",
  description: "Tu dashboard personal para gestionar y explorar caletas universitarias.",
  icons: {
    icon: '/favicon.svg',
  },
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

  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ProtectedAppShell
          session={session}
          showVerificationBanner={false}
          userEmail=""
        >
          {children}
        </ProtectedAppShell>
      </body>
    </html>
  );
}
