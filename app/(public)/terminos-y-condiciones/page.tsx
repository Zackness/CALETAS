"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useState } from "react";
import { Scale } from "lucide-react";
import { PublicPageShell } from "@/app/(public)/components/PublicPageShell";
import { PublicPageHero } from "@/app/(public)/components/PublicPageHero";

export default function TerminosYCondiciones() {
  const [content, setContent] = useState("");

  useEffect(() => {
    fetch("/terminos-y-condiciones/terminos-y-condiciones.md")
      .then((res) => res.text())
      .then((text) => setContent(text));
  }, []);

  return (
    <PublicPageShell>
      <PublicPageHero
        label="Legal"
        labelIcon={Scale}
        title="TÉRMINOS Y CONDICIONES"
        description="Condiciones de uso de la plataforma CALETAS."
      />

      <div className="chalk-container min-w-0 max-w-4xl pb-14 sm:pb-16 md:pb-20">
        <article className="chalk-card p-6 sm:p-8 md:p-10">
          <div className="prose prose-lg prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ ...props }) => (
                  <h1
                    className="mb-6 font-special text-3xl text-white sm:text-4xl"
                    {...props}
                  />
                ),
                h2: ({ ...props }) => (
                  <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl" {...props} />
                ),
                h3: ({ ...props }) => (
                  <h3 className="mb-3 text-xl font-bold text-white sm:text-2xl" {...props} />
                ),
                p: ({ ...props }) => <p className="mb-4 text-white/78" {...props} />,
                ul: ({ ...props }) => <ul className="mb-4 list-disc pl-6" {...props} />,
                ol: ({ ...props }) => <ol className="mb-4 list-decimal pl-6" {...props} />,
                li: ({ ...props }) => <li className="mb-2 text-white/78" {...props} />,
                strong: ({ ...props }) => <strong className="font-bold text-white" {...props} />,
                em: ({ ...props }) => (
                  <em className="text-[var(--caleta-accent)] not-italic" {...props} />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </article>
      </div>
    </PublicPageShell>
  );
}
