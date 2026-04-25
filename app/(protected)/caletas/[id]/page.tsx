import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { recursoToExploreHref } from "@/lib/recurso-view-href";
import { canViewerAccessRecurso } from "@/lib/caletas-visibility";
import { getActiveSubscriptionForUser } from "@/lib/subscription";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function CaletaDetallePorIdPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  const recurso = await db.recurso.findUnique({
    where: { id },
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      tipo: true,
      archivoUrl: true,
      autorId: true,
      universidadId: true,
      materia: {
        select: {
          nombre: true,
          codigo: true,
          carrera: { select: { universidadId: true } },
        },
      },
    },
  });

  if (!recurso) notFound();

  const viewer = await db.user.findUnique({
    where: { id: session.user.id },
    select: { universidadId: true },
  });
  const sub = await getActiveSubscriptionForUser(session.user.id);
  const allowed = canViewerAccessRecurso(session.user.id, viewer?.universidadId, sub, {
    autorId: recurso.autorId,
    universidadId: recurso.universidadId,
    materia: recurso.materia,
  });

  if (!allowed) {
    return (
      <div className="min-h-[50vh] bg-gradient-to-t from-mygreen to-mygreen-light px-4 py-16 text-center text-white">
        <p className="text-lg font-medium">No tienes acceso a esta caleta</p>
        <Button asChild variant="outline" className="mt-6 border-white/20 text-white">
          <Link href="/caletas">Volver a Caletas</Link>
        </Button>
      </div>
    );
  }

  const href = recursoToExploreHref(recurso);
  if (href.startsWith("/view-file/")) {
    redirect(href);
  }

  const isOwner = recurso.autorId === session.user.id;

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-gradient-to-t from-mygreen to-mygreen-light px-4 py-10">
      <div className="mx-auto max-w-lg">
        <Link
          href="/caletas"
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-white shadow-xl backdrop-blur-sm">
          <div className="mb-4 flex justify-center">
            <FileQuestion className="h-14 w-14 text-[var(--accent-hex)] opacity-90" />
          </div>
          <h1 className="text-center font-special text-2xl">{recurso.titulo}</h1>
          {recurso.materia ? (
            <p className="mt-2 text-center text-sm text-white/65">
              {recurso.materia.codigo} — {recurso.materia.nombre}
            </p>
          ) : null}
          {recurso.descripcion ? (
            <p className="mt-4 text-center text-sm text-white/75">{recurso.descripcion}</p>
          ) : null}
          <p className="mt-6 text-center text-sm text-white/60">
            Esta caleta no tiene un archivo asociado para vista previa. Si es tuya, puedes editarla y subir un documento.
          </p>
          {isOwner ? (
            <div className="mt-8 flex justify-center">
              <Button asChild className="bg-mygreen hover:bg-mygreen-light text-white">
                <Link href={`/caletas/editar/${recurso.id}`}>Editar caleta</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
