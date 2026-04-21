import { redirect } from "next/navigation";

export default async function BibliotecaAdminEditorRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/editor/admin/biblioteca/${encodeURIComponent(id)}`);
}

