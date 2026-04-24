"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ExternalLink } from "lucide-react";

const GALLERY_SLOTS = 6;

export function SocialProfileEditor({
  publicProfileHref,
  initialBio,
  initialBanner,
  initialGallery,
}: {
  publicProfileHref: string;
  initialBio: string | null;
  initialBanner: string | null;
  initialGallery: string[];
}) {
  const [bio, setBio] = useState(initialBio ?? "");
  const [banner, setBanner] = useState(initialBanner ?? "");
  const [gallery, setGallery] = useState<string[]>(() => {
    const g = [...initialGallery];
    while (g.length < GALLERY_SLOTS) g.push("");
    return g.slice(0, GALLERY_SLOTS);
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const urls = gallery.map((s) => s.trim()).filter(Boolean);
      const res = await fetch("/api/user/social-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileBio: bio.trim() || null,
          profileBannerUrl: banner.trim() || null,
          profileGalleryUrls: urls,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        profileGalleryUrls?: unknown;
      };
      if (!res.ok) {
        setMessage(data.error ?? "No se pudo guardar");
        return;
      }
      setMessage("Guardado");
      if (data.profileGalleryUrls && Array.isArray(data.profileGalleryUrls)) {
        const next = data.profileGalleryUrls.filter((x): x is string => typeof x === "string");
        while (next.length < GALLERY_SLOTS) next.push("");
        setGallery(next.slice(0, GALLERY_SLOTS));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mb-6 border-white/10 bg-[#354B3A]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-special text-white">
          <Sparkles className="h-5 w-5 text-[var(--accent-hex)]" />
          Perfil social
        </CardTitle>
        <CardDescription className="text-white/70">
          Bio, banner y fotos (URLs https). Solo las caletas no anónimas aparecen en tu perfil público.
        </CardDescription>
        <Link
          href={publicProfileHref}
          className="inline-flex items-center gap-1 text-sm text-[var(--accent-hex)] hover:underline"
        >
          Ver cómo te ven otros
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-white/60">Biografía</label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Cuéntale a la comunidad quién eres…"
            className="border-white/10 bg-[#1C2D20] text-white placeholder:text-white/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/60">URL del banner (ancho completo)</label>
          <Input
            value={banner}
            onChange={(e) => setBanner(e.target.value)}
            placeholder="https://…"
            className="border-white/10 bg-[#1C2D20] text-white placeholder:text-white/40"
          />
        </div>
        <div className="space-y-2">
          <span className="text-xs text-white/60">Galería (hasta {GALLERY_SLOTS} imágenes, URL https)</span>
          {gallery.map((url, i) => (
            <Input
              key={i}
              value={url}
              onChange={(e) => {
                const v = e.target.value;
                setGallery((prev) => {
                  const copy = [...prev];
                  copy[i] = v;
                  return copy;
                });
              }}
              placeholder={`Foto ${i + 1}`}
              className="border-white/10 bg-[#1C2D20] text-white placeholder:text-white/40"
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="bg-[color-mix(in_oklab,var(--accent-hex)_85%,#0d1510)] text-white hover:opacity-95"
          >
            {saving ? "Guardando…" : "Guardar perfil social"}
          </Button>
          {message ? <span className="text-sm text-white/80">{message}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}
