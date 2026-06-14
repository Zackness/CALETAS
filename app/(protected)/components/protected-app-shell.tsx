"use client";

import { Sidebar, SidebarInset, SidebarProvider, SidebarRail } from "@/components/ui/sidebar";
import { CaletasSidebarNav } from "./caletas-sidebar-nav";
import { DashboardHeader } from "./app-header";
import { EmailVerificationBanner } from "./email-verification-banner";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { StudentComposeFab } from "@/components/caletas/caleta-share-fab";

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
  dbConnectionMessage,
}: {
  children: React.ReactNode;
  session: SessionLike;
  showVerificationBanner: boolean;
  userEmail: string;
  /** Aviso cuando el layout no pudo consultar la BD (p. ej. Neon dormido o red). */
  dbConnectionMessage?: string | null;
}) {
  return (
    <SidebarProvider
      defaultOpen
      className="flex min-h-[100dvh] w-full min-w-0 items-stretch overflow-x-hidden bg-gradient-to-t from-mygreen to-mygreen-light"
    >
      <Sidebar
        collapsible="offcanvas"
        className="border-white/10 text-white [&_[data-sidebar=sidebar]]:!bg-[var(--mygreen)] [&_[data-sidebar=sidebar]]:!bg-none"
      >
        <CaletasSidebarNav userRole={session?.user?.role ?? null} />
        <SidebarRail className="after:bg-white/20 hover:after:bg-[color-mix(in_oklab,var(--accent-hex)_50%,transparent)]" />
      </Sidebar>
      <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col border-l border-white/10 bg-transparent">
        <DashboardHeader session={session} />
        {dbConnectionMessage ? (
          <div
            role="alert"
            className="border-b border-amber-500/40 bg-amber-950/90 px-3 py-2 text-center text-sm text-amber-100 sm:px-4"
          >
            {dbConnectionMessage}
          </div>
        ) : null}
        {showVerificationBanner && userEmail ? (
          <EmailVerificationBanner email={userEmail} />
        ) : null}
        <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-3 py-4 pb-24 sm:px-4 sm:py-6 md:px-8 md:py-6 md:pb-6">
          {children}
        </main>
      </SidebarInset>
      <MobileBottomNav />
      <StudentComposeFab />
    </SidebarProvider>
  );
}
