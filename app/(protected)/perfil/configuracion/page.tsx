import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { parseProfileGalleryUrls } from "@/lib/profile-gallery";
import { SocialProfileEditor } from "@/components/perfil/social-profile-editor";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PerfilConfiguracionPage() {
  const session = await getSession();
  if (!session?.user?.id) return redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      profileBio: true,
      profileBannerUrl: true,
      profileGalleryUrls: true,
    },
  });

  const gallery = user ? parseProfileGalleryUrls(user.profileGalleryUrls) : [];
  const publicHref = user?.username ? `/u/${user.username}` : "/perfil";

  return (
    <div className="min-h-[calc(100dvh-6rem)]">
      <div className="mb-4">
        <h1 className="text-3xl font-special text-white">Configuración de perfil</h1>
        <p className="text-white/70">Edita tu perfil público (bio, banner y galería).</p>
      </div>

      {!user?.username ? (
        <div className="rounded-xl border border-white/10 bg-[#354B3A] p-4 text-white/80">
          Aún no tienes username. Primero crea tu perfil público.
          <div className="mt-3">
            <Link
              href="/perfil"
              className="inline-flex rounded-lg bg-[var(--accent-hex)] px-4 py-2 text-sm font-medium text-white hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]"
            >
              Crear perfil
            </Link>
          </div>
        </div>
      ) : (
        <SocialProfileEditor
          publicProfileHref={publicHref}
          initialBio={user.profileBio ?? null}
          initialBanner={user.profileBannerUrl ?? null}
          initialGallery={gallery}
        />
      )}

      <div className="mt-4 text-sm text-white/70">
        Para ajustes de cuenta (2FA, email, universidad, etc.) ve a{" "}
        <Link href="/ajustes" className="text-[var(--accent-hex)] hover:underline">
          Ajustes
        </Link>
        .
      </div>
    </div>
  );
}

