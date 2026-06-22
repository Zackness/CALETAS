import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import {
  buildPic18CallbackUrl,
  signPic18Token,
  validatePic18RedirectUri,
} from "@/lib/pic18-connect";

type PageProps = {
  searchParams: Promise<{
    redirect_uri?: string;
    state?: string;
  }>;
};

export default async function AprendePic18ConnectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const redirectUri = params.redirect_uri?.trim() ?? "";
  const state = params.state?.trim() ?? "";

  if (!redirectUri || !validatePic18RedirectUri(redirectUri)) {
    return (
      <main className="landing-home flex min-h-screen items-center justify-center px-6 text-white">
        <div className="chalk-card max-w-md p-8 text-center">
          <h1 className="font-special text-xl font-semibold">Enlace de retorno invalido</h1>
          <p className="mt-3 text-sm text-white/70">
            Vuelve a AprendePIC18 e intenta iniciar sesion otra vez.
          </p>
        </div>
      </main>
    );
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    const callbackPath = `/aprende-pic18/connect?redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  const token = signPic18Token({
    id: session.user.id,
    email: session.user.email,
    role: (session.user as { role?: string }).role,
  });

  const callbackUrl = buildPic18CallbackUrl({
    redirectUri,
    state,
    token,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
  });

  redirect(callbackUrl);
}
