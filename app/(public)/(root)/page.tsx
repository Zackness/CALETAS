import { Header } from "@/app/(public)/(root)/components/Header";
import { Hero } from "@/app/(public)/(root)/components/Hero";
import { Whyus } from "@/app/(public)/(root)/components/Whyus";
import { Universities } from "@/app/(public)/(root)/components/Universities";
import { CTA } from "@/app/(public)/(root)/components/CTA";
import { Footer } from "@/app/(public)/components/Footer";

export default function Home() {
  return (
    <>
      <Header/>
      <Hero/>
      <Whyus/>
      <Universities/>
      <CTA/>
      <Footer/>
    </>
  );
}
