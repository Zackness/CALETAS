import { PublicPageShell } from "@/app/(public)/components/PublicPageShell";
import { Hero } from "@/app/(public)/(root)/components/Hero";
import { Whyus } from "@/app/(public)/(root)/components/Whyus";
import { AprendeHub } from "@/app/(public)/(root)/components/AprendeHub";
import { Universities } from "@/app/(public)/(root)/components/Universities";
import { CTA } from "@/app/(public)/(root)/components/CTA";

export default function Home() {
  return (
    <PublicPageShell>
      <span className="chalk-doodle left-2 top-32 hidden opacity-20 lg:block" aria-hidden />
      <span className="chalk-doodle right-2 top-[42rem] hidden opacity-20 lg:block" aria-hidden />
      <span className="chalk-formula chalk-formula-float top-[20rem] left-[2%] hidden opacity-15 xl:block" aria-hidden>
        x² + y²
      </span>
      <span className="chalk-formula top-[48rem] right-[2%] hidden opacity-15 xl:block" aria-hidden>
        sin(θ)
      </span>
      <span className="chalk-formula top-[88rem] left-[3%] hidden opacity-15 2xl:block" aria-hidden>
        ∫ f(x) dx
      </span>

      <Hero />
      <Whyus />
      <AprendeHub />
      <Universities />
      <CTA />
    </PublicPageShell>
  );
}
