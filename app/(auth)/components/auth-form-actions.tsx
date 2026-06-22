import type { ReactNode } from "react";

export function AuthFormActions({ children }: { children: ReactNode }) {
  return (
    <div className="auth-form-actions mx-auto flex w-full min-w-0 max-w-md flex-col items-stretch gap-3 pt-1">
      {children}
    </div>
  );
}
