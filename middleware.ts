import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { DEFAULT_LOGIN_REDIRECT, apiAuthPrefix, authRoutes, publicRoutes } from "@/routes";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Permitir acceso sin autenticación a la ruta del webhook
  if (nextUrl.pathname.startsWith('/api/uploadthing')) {
    return;
  }

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.some(route => new RegExp(`^${route}$`).test(nextUrl.pathname));
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isOnboardingRoute = nextUrl.pathname === '/onboarding';

  if (isApiAuthRoute) {
    return;
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return;
  }

  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl);

    return Response.redirect(new URL(
      `/login?callbackUrl=${encodedCallbackUrl}`, 
      nextUrl
    ));
  }

  // No verificamos el estado del onboarding en el middleware para evitar problemas con Prisma en Edge Runtime
  // En su lugar, lo manejaremos en el componente de página

  return;
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

