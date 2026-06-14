import { Header } from "@/app/(public)/(root)/components/Header";
import { Hero } from "@/app/(public)/(root)/components/Hero";
import { Whyus } from "@/app/(public)/(root)/components/Whyus";
import { Universities } from "@/app/(public)/(root)/components/Universities";
import { CTA } from "@/app/(public)/(root)/components/CTA";
import { Footer } from "@/app/(public)/components/Footer";

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <span className="chalk-doodle -left-14 top-24 hidden lg:block" aria-hidden="true" />
      <span className="chalk-doodle -right-10 top-[34rem] hidden lg:block" aria-hidden="true" />
      <span className="chalk-doodle left-[48%] top-[58rem] hidden xl:block" aria-hidden="true" />
      <span className="chalk-formula top-[18rem] left-[3%] hidden xl:block" aria-hidden="true">x^2 + y^2</span>
      <span className="chalk-formula top-[44rem] right-[4%] hidden xl:block" aria-hidden="true">sin(theta)</span>
      <span className="chalk-formula top-[78rem] left-[6%] hidden 2xl:block" aria-hidden="true">1/2 pi r</span>
      <div className="w-full pb-12">
        <Header />
        <Hero />
        <Whyus />
        <Universities />
        <CTA />
      </div>
      <Footer />
    </main>
  );
}
