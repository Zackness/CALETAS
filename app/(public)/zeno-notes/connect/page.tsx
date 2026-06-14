import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import {
  buildZenoConnectCallbackUrl,
  signMobileToken,
  validateZenoRedirectUri,
} from "@/lib/zeno-connect";

type PageProps = {
  searchParams: Promise<{
    redirect_uri?: string;
    state?: string;
  }>;
};

export default async function ZenoNotesConnectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const redirectUri = params.redirect_uri?.trim() ?? "";
  const state = params.state?.trim() ?? "";

  if (!redirectUri || !validateZenoRedirectUri(redirectUri)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-t from-mygreen to-mygreen-light px-6 text-white">
        <div className="max-w-md rounded-xl border border-white/10 bg-[#354B3A] p-8 text-center">
          <h1 className="font-special text-xl font-semibold">Enlace de retorno invalido</h1>
          <p className="mt-3 text-sm text-white/70">
            Vuelve a Zeno Notes e intenta iniciar sesion otra vez.
          </p>
        </div>
      </main>
    );
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    const callbackPath = `/zeno-notes/connect?redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  const token = signMobileToken({
    id: session.user.id,
    email: session.user.email,
    role: (session.user as { role?: string }).role,
  });

  const callbackUrl = buildZenoConnectCallbackUrl({
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
