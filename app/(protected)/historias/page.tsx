import { redirect } from "next/navigation";

/** Las historias viven en la home; esta ruta evita enlaces rotos. */
export default function HistoriasRedirectPage() {
  redirect("/home");
}
