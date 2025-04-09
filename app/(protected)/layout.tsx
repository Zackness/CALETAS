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
              <div className="flex h-screen w-full">
                {/* Sidebar */}
                <AppSidebar />

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-h-screen bg-background overflow-hidden">
                  <DashboardHeader />
                  <div className="flex-1 overflow-auto">
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

