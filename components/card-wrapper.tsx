"use client";

import { Social } from "@/app/(auth)/components/social";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface CardWrapperProps {
  children: React.ReactNode;
  headerLabel?: string;
  showSocial?: boolean;
}

export const CardWrapper = ({ children, showSocial }: CardWrapperProps) => {
  return (
    <Card className="chalk-card w-full min-w-0 max-w-lg border-white/10 p-6 shadow-none sm:p-8">
      <CardContent className="p-0">{children}</CardContent>
      {showSocial ? (
        <CardFooter className="mt-6 flex-col gap-3 p-0 pt-0">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#354B3A] px-2 text-white/60">O continúa con</span>
            </div>
          </div>
          <Social />
        </CardFooter>
      ) : null}
    </Card>
  );
};
