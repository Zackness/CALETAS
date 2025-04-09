import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import "@/app/globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { DashboardHeader } from "@/components/header";

export const metadata: Metadata = {
  title: "Home | Global Legal",
  description: "En Global Legal simplificamos tus trámites",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

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
              <div className="flex">
                {/* Sidebar */}
                <AppSidebar />

                {/* Main Content */}
                <main className="relative h-full w-full min-h-screen bg-background">
                  <DashboardHeader />
                  <div className="container mx-auto px-4">{children}</div>
                </main>
              </div>
            </SidebarProvider>
          </ThemeProvider>
        </body>
      </html>
    </SessionProvider>
  );
}

