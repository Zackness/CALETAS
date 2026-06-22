import type { LucideIcon } from "lucide-react";

type PublicPageHeroProps = {
  label?: string;
  labelIcon?: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function PublicPageHero({
  label,
  labelIcon: LabelIcon,
  title,
  description,
  children,
}: PublicPageHeroProps) {
  return (
    <div className="chalk-container py-10 text-center sm:py-14 md:py-16">
      {label && LabelIcon ? (
        <span className="chalk-section-label justify-center">
          <LabelIcon className="h-4 w-4" />
          {label}
        </span>
      ) : null}
      <h1 className="chalk-title mt-4 font-special text-balance text-[1.85rem] sm:text-[2.35rem] md:text-[2.75rem] lg:text-[3rem]">
        {title}
      </h1>
      {description ? (
        <p className="mx-auto mt-4 max-w-3xl text-base font-semibold leading-relaxed text-white/78 sm:text-lg md:text-xl">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
