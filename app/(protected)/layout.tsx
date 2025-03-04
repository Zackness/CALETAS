import { Header } from "@/components/header";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import "@/app/globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from 'next-themes';

export const metadata: Metadata = {
  title: "Home | Franky",
  description: "En Franky creamos industria",
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function DashboardLayout ({ 
  children
 }: {
  children: React.ReactNode
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
            <AppSidebar/>
            
            <main className="relative h-full w-full min-h-screen bg-background">
              <div className="flex flex-row items-center pl-4 text-foreground h-16 bg-background">
                <SidebarTrigger />
                <Header/>
              </div>

              {children}
            </main>
          </SidebarProvider>
          </ThemeProvider>
        </body>
      </html>
    </SessionProvider>
  );
}

