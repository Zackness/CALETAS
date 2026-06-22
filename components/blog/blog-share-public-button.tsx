"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { absoluteUrl } from "@/lib/seo/metadata";

export function BlogSharePublicButton({ slug, label = "Compartir enlace público" }: { slug: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const url = absoluteUrl(`/blog/${slug}`);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copia este enlace:", url);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy} className="gap-2">
      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Link2 className="h-4 w-4" />}
      {copied ? "Copiado" : label}
    </Button>
  );
}
