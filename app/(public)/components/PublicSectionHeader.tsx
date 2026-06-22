import type { LucideIcon } from "lucide-react";

type PublicSectionHeaderProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
};

export function PublicSectionHeader({
  icon: Icon,
  title,
  description,
  className = "mb-12",
}: PublicSectionHeaderProps) {
  return (
    <div className={`text-center ${className}`}>
      <span className="chalk-section-label justify-center">
        <Icon className="h-4 w-4" />
        {title}
      </span>
      {description ? (
        <p className="mx-auto mt-4 max-w-2xl text-base font-semibold text-white/72 sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
