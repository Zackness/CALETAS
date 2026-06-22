import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CourseEnrollmentState } from "@/lib/cursos/course-enrollment";

type Props = {
  enrollment: CourseEnrollmentState;
  layout?: "card" | "detail";
  showInfoLink?: boolean;
  className?: string;
};

export function CursoEnrollmentCta({
  enrollment,
  layout = "card",
  showInfoLink = true,
  className,
}: Props) {
  const primaryClass = cn(
    "aprende-btn aprende-btn-primary inline-flex items-center justify-center gap-2",
    layout === "card" ? "w-full text-sm" : "px-5 py-2.5 text-sm",
  );

  const PrimaryButton = enrollment.openInNewTab ? (
    <a
      href={enrollment.actionUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={primaryClass}
    >
      {enrollment.actionLabel}
      <ExternalLink className="h-4 w-4 shrink-0" />
    </a>
  ) : (
    <Link href={enrollment.actionUrl} className={primaryClass}>
      {enrollment.actionLabel}
      <ArrowRight className="h-4 w-4 shrink-0" />
    </Link>
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {PrimaryButton}
      {showInfoLink && layout === "card" ? (
        <Link
          href={enrollment.detailHref}
          className="text-center text-xs font-medium text-white/55 transition-colors hover:text-[var(--aprende-accent-bright)]"
        >
          Ver información del curso
        </Link>
      ) : null}
    </div>
  );
}
