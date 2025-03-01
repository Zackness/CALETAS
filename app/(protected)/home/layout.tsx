import { Header } from "@/components/header";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import "@/app/globals.css";
import type { Metadata } from "next";

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
          <SidebarProvider>
            <AppSidebar/>
            
            <main className="relative h-full w-full min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
              <div className="flex flex-row items-center pl-4 bg-gray-900 text-white">
                <SidebarTrigger />
                <Header/>
              </div>

              {children}
            </main>
          </SidebarProvider>
        </body>
      </html>
    </SessionProvider>
  );
}

