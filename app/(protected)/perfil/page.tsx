import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CreatePublicProfileForm } from "@/components/perfil/create-public-profile-form";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const session = await getSession();
  if (!session?.user?.id) return redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      username: true,
    },
  });

  if (user?.username) {
    return redirect(`/u/${user.username}`);
  }

  return (
    <div className="min-h-[calc(100dvh-6rem)]">
      <div className="mb-6">
        <h1 className="text-3xl font-special text-white">Mi perfil</h1>
        <p className="text-white/70">
          Para que otros te encuentren, primero crea tu username público.
        </p>
      </div>

      <CreatePublicProfileForm initialName={user?.name ?? null} />
    </div>
  );
}

