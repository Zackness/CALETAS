import type { Metadata } from "next";
import "@fontsource-variable/montserrat";
import "../globals.css";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Editor - Caletas",
  description: "Editor tipo Overleaf (Markdown + LaTeX).",
  icons: { icon: "/favicon.svg" },
};

export default async function EditorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  if (!session?.user?.id) return redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!user) return redirect("/login");

  return (
    <html lang="es">
      <body>
        <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">{children}</div>
      </body>
    </html>
  );
}

