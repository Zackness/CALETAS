"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useState } from 'react';
import { Header } from "../components/Header";

export default function TerminosYCondiciones() {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/terminos-y-condiciones/terminos-y-condiciones.md')
      .then((res) => res.text())
      .then((text) => setContent(text));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <Header />
      <div className="container mx-auto px-4 py-10 sm:py-14 md:py-16 max-w-4xl">
      <article className="prose prose-lg prose-invert max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({node, ...props}) => <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-white" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-white" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-xl sm:text-2xl font-medium mb-3 text-white" {...props} />,
            p: ({node, ...props}) => <p className="mb-4 text-white/80" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4" {...props} />,
            li: ({node, ...props}) => <li className="mb-2" {...props} />,
            strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
            em: ({node, ...props}) => <em className="italic text-[var(--accent-hex)]" {...props} />,
          }}
        >
          {content}
        </ReactMarkdown>
      </article>
      </div>
    </div>
  );
}