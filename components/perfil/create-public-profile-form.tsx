"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AtSign, User as UserIcon } from "lucide-react";

function slugifyUsername(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .slice(0, 24);
}

export function CreatePublicProfileForm({
  initialName,
}: {
  initialName?: string | null;
}) {
  const router = useRouter();
  const suggested = useMemo(() => (initialName ? slugifyUsername(initialName) : ""), [initialName]);
  const [username, setUsername] = useState(suggested);
  const [bio, setBio] = useState("");
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      const res = await fetch("/api/user/public-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          profileBio: bio.trim() || null,
          image: image.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; user?: { username?: string } };
      if (!res.ok) {
        toast.error(data.error || "No se pudo crear tu perfil");
        return;
      }
      const u = data.user?.username || username.trim().toLowerCase();
      toast.success("Perfil creado");
      router.push(`/u/${encodeURIComponent(u)}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-white/10 bg-[#354B3A]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-special text-white">
          <UserIcon className="h-5 w-5 text-[var(--accent-hex)]" />
          Crea tu perfil público
        </CardTitle>
        <CardDescription className="text-white/70">
          Elige tu username (como YouTube/Instagram). Luego cualquiera podrá ver tu perfil en{" "}
          <span className="text-[var(--accent-hex)]">/u/tu_username</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-white/60">Username</label>
          <div className="relative">
            <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="tu_username"
              className="border-white/10 bg-[#1C2D20] pl-10 text-white placeholder:text-white/40"
              maxLength={24}
              disabled={saving}
            />
          </div>
          <p className="mt-1 text-xs text-white/50">3-24 caracteres. Letras, números o _</p>
        </div>

        <div>
          <label className="mb-1 block text-xs text-white/60">Descripción</label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Cuéntale a la comunidad quién eres…"
            className="border-white/10 bg-[#1C2D20] text-white placeholder:text-white/40"
            rows={4}
            maxLength={500}
            disabled={saving}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-white/60">Foto de perfil (URL https)</label>
          <Input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://…"
            className="border-white/10 bg-[#1C2D20] text-white placeholder:text-white/40"
            disabled={saving}
          />
        </div>

        <Button
          type="button"
          onClick={() => void submit()}
          disabled={saving || !username.trim()}
          className="w-full bg-[var(--accent-hex)] text-white hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]"
        >
          {saving ? "Creando…" : "Crear perfil"}
        </Button>
      </CardContent>
    </Card>
  );
}

