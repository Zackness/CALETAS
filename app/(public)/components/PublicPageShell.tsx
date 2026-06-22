import { Header } from "@/app/(public)/components/Header";
import { Footer } from "@/app/(public)/components/Footer";

type PublicPageShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function PublicPageShell({ children, className = "" }: PublicPageShellProps) {
  return (
    <main
      className={`landing-home relative min-w-0 overflow-x-clip pb-4 ${className}`.trim()}
    >
      <Header />
      {children}
      <Footer />
    </main>
  );
}
