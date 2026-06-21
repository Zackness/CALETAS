export default function IaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ia-layout -mx-3 -mt-2 flex min-h-0 flex-1 flex-col md:-mx-8 md:-mt-4">{children}</div>
  );
}
