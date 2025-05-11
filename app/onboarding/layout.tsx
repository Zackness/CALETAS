import type { Metadata } from "next";
import "@/app/globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
export const metadata: Metadata = {
  title: "Onboarding",
  description: "Onboarding de Global Legal",
};

type Props = {
  children: React.ReactNode;
};

export default async function OnboardingLayout ({ 
  children
 }: {
  children: React.ReactNode
 }) {
    const session = await auth();

  return (
    <SessionProvider session={session}>
      <html lang="en">
        <body className="flex flex-col h-full">
            <main className="flex flex-col h-full w-full text-foreground">
              {children}
            </main>
          </body>
      </html>
    </SessionProvider>
  );
}