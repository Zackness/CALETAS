"use client";

import { Sidebar, SidebarInset, SidebarProvider, SidebarRail } from "@/components/ui/sidebar";
import { CaletasSidebarNav } from "./caletas-sidebar-nav";
import { DashboardHeader } from "./app-header";
import { EmailVerificationBanner } from "./email-verification-banner";

type SessionLike = {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
};

export function ProtectedAppShell({
  children,
  session,
  showVerificationBanner,
  userEmail,
}: {
  children: React.ReactNode;
  session: SessionLike;
  showVerificationBanner: boolean;
  userEmail: string;
}) {
  return (
    <SidebarProvider
      defaultOpen
      className="flex min-h-[100dvh] w-full min-w-0 items-stretch overflow-x-hidden bg-gradient-to-t from-mygreen to-mygreen-light"
    >
      <Sidebar
        collapsible="offcanvas"
        className="border-white/10 text-white [&_[data-sidebar=sidebar]]:!bg-[#203324] [&_[data-sidebar=sidebar]]:!bg-none"
      >
        <CaletasSidebarNav userRole={session?.user?.role ?? null} />
        <SidebarRail className="after:bg-white/20 hover:after:bg-[#40C9A9]/50" />
      </Sidebar>
      <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col border-l border-white/10 bg-transparent">
        <DashboardHeader session={session} />
        {showVerificationBanner && userEmail ? (
          <EmailVerificationBanner email={userEmail} />
        ) : null}
        <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
