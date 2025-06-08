"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useState } from 'react';

export default function TerminosYCondiciones() {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/terminos-y-condiciones/terminos-y-condiciones.md')
      .then((res) => res.text())
      .then((text) => setContent(text));
  }, []);

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <article className="prose prose-lg prose-blue dark:prose-invert max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({node, ...props}) => <h1 className="text-3xl font-bold mb-6 text-black" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-2xl font-semibold mb-4 text-black" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-xl font-medium mb-3 text-black" {...props} />,
            p: ({node, ...props}) => <p className="mb-4 text-gray-700 dark:text-gray-300" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4" {...props} />,
            li: ({node, ...props}) => <li className="mb-2" {...props} />,
            strong: ({node, ...props}) => <strong className="font-bold text-black" {...props} />,
            em: ({node, ...props}) => <em className="italic text-blue-600" {...props} />,
          }}
        >
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
}