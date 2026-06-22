import type { Components } from "react-markdown";

/** Componentes ReactMarkdown para tablas GFM con estilo Caletas. */
export const blogMarkdownTableComponents: Components = {
  table: ({ children }) => (
    <div className="my-5 overflow-x-auto rounded-xl border border-white/10 bg-[#1C2D20]/40">
      <table className="w-full min-w-[480px] border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-white/5">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-white/10 last:border-b-0">{children}</tr>,
  th: ({ children }) => (
    <th className="border border-white/10 px-3 py-2.5 text-left font-semibold text-white">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-white/10 px-3 py-2.5 align-top text-white/85">{children}</td>
  ),
};
