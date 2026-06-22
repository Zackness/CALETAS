"use client";

import { Link } from "@/components/link";
import { UserButton } from "@/app/(auth)/components/user-button";
import { Logo } from "@/components/marca/Logo";
import { ADMIN_PATH } from "@/routes";

export function AdminBlogEditorShell({
  children,
  userName,
  roleLabel,
}: {
  children: React.ReactNode;
  userName: string;
  roleLabel: string;
}) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#203324] text-white">
      <header className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#1C2D20] px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href={`${ADMIN_PATH}/blog`} className="block transition-opacity hover:opacity-80">
            <Logo width={150} height={22} className="!pl-0" />
          </Link>
          <span className="hidden text-sm text-white/65 sm:inline">Editor de artículos</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-white/65 sm:inline">
            {userName} · {roleLabel}
          </span>
          <UserButton />
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
