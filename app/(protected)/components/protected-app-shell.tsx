"use client";

import { usePathname } from "next/navigation";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CaletasSidebarNav } from "./caletas-sidebar-nav";
import { DashboardHeader } from "./app-header";
import { CalendarReminderHeartbeat } from "./calendar-reminder-heartbeat";
import { EmailVerificationBanner } from "./email-verification-banner";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { StudentComposeFab } from "@/components/caletas/caleta-share-fab";
import { AdminBlogEditorShell } from "@/app/(protected)/admin/_components/admin-blog-editor-shell";
import { cn } from "@/lib/utils";

type SessionLike = {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
};

function isBlogEditorRoute(pathname: string) {
  if (pathname === "/admin/blog/nuevo") return true;
  return /^\/admin\/blog\/[^/]+\/editar$/.test(pathname);
}

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
  const pathname = usePathname();
  const isAprendeZone = pathname?.startsWith("/cursos") ?? false;

  if (isBlogEditorRoute(pathname)) {
    return (
      <AdminBlogEditorShell
        userName={session?.user?.name ?? "Usuario"}
        roleLabel={session?.user?.role === "ADMIN" ? "Admin" : "Usuario"}
      >
        {children}
      </AdminBlogEditorShell>
    );
  }

  return (
    <SidebarProvider
      defaultOpen
      data-zone={isAprendeZone ? "aprende" : undefined}
      className={cn(
        "chalkboard-shell protected-app flex min-h-[100dvh] w-full min-w-0 items-stretch overflow-x-hidden text-white",
        isAprendeZone && "aprende-shell-active",
      )}
    >
      <Sidebar
        collapsible="offcanvas"
        className={cn(
          "!border-r-0 bg-[var(--mygreen-dark)] text-white [&_[data-sidebar=sidebar]]:!bg-none",
          isAprendeZone && "aprende-sidebar-shell",
        )}
      >
        <CaletasSidebarNav userRole={session?.user?.role ?? null} />
      </Sidebar>
      <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col bg-transparent">
        <CalendarReminderHeartbeat />
        <DashboardHeader session={session} isAprendeZone={isAprendeZone} />
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
        <main
          className={cn(
            "relative z-[1] mx-auto w-full min-w-0 max-w-7xl flex-1 px-3 py-4 pb-24 sm:px-4 sm:py-6 md:px-8 md:py-6 md:pb-6",
            isAprendeZone && "aprende-main-inset",
          )}
        >
          {children}
        </main>
      </SidebarInset>
      <MobileBottomNav />
      <StudentComposeFab />
    </SidebarProvider>
  );
}
