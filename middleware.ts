import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

import { getCorsHeaders } from "@/lib/cors";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";

const isPublicRoute = (pathname: string) => {
  return publicRoutes.some((route) => {
    if (route.includes(".*")) {
      return new RegExp(route).test(pathname);
    }
    return pathname === route;
  });
};

const withCors = (request: NextRequest, response: NextResponse) => {
  const cors = getCorsHeaders(request);
  Object.entries(cors).forEach(([k, v]) => response.headers.set(k, v));
  // Cachea preflight para mejorar rendimiento en Expo/dev.
  response.headers.set("Access-Control-Max-Age", "86400");
  const origin = request.headers.get("origin");
  if (origin) {
    response.headers.set("Vary", "Origin");
  }
  return response;
};

export function middleware(request: NextRequest) {
  const { nextUrl } = request;

  // CORS (solo API)
  if (nextUrl.pathname.startsWith("/api")) {
    if (request.method === "OPTIONS") {
      return withCors(request, new NextResponse(null, { status: 204 }));
    }
  }

  const sessionCookie = getSessionCookie(request);
  const isLoggedIn = !!sessionCookie;

  // Permitir UploadThing sin autenticación (webhook/endpoints internos)
  if (nextUrl.pathname.startsWith("/api/uploadthing")) {
    const res = NextResponse.next();
    return nextUrl.pathname.startsWith("/api") ? withCors(request, res) : res;
  }

  // Cron jobs (Bearer CRON_SECRET en la ruta; no hay cookie de usuario)
  if (nextUrl.pathname.startsWith("/api/cron/")) {
    const res = NextResponse.next();
    return nextUrl.pathname.startsWith("/api") ? withCors(request, res) : res;
  }

  // AprendePIC18 (pic18.caleta.top): auth con JWT Bearer en cada ruta, no cookie de sesión
  if (nextUrl.pathname.startsWith("/api/aprende-pic18/")) {
    const res = NextResponse.next();
    return withCors(request, res);
  }

  // AprendeC++ POO (cpp.caleta.top): APIs publicas con CORS propio en cada ruta
  if (nextUrl.pathname.startsWith("/api/aprende-cpp-poo/")) {
    const res = NextResponse.next();
    return withCors(request, res);
  }

  // Zeno Notes (app Flutter): JWT Bearer en cada ruta API, no cookie de sesion web
  if (
    nextUrl.pathname.startsWith("/api/zeno-notes/caletas/") ||
    nextUrl.pathname.startsWith("/api/caletas/recursos") ||
    nextUrl.pathname.startsWith("/api/caletas/upload-cpanel") ||
    nextUrl.pathname.startsWith("/api/user/academico/") ||
    nextUrl.pathname.startsWith("/api/notifications")
  ) {
    const res = NextResponse.next();
    return withCors(request, res);
  }

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isPublic = isPublicRoute(nextUrl.pathname);

  // Dejar pasar endpoints de auth de Better Auth
  if (isApiAuthRoute) {
    const res = NextResponse.next();
    return nextUrl.pathname.startsWith("/api") ? withCors(request, res) : res;
  }

  // Importante: NO redirigir automáticamente desde rutas de auth cuando hay cookie.
  // Puede existir una cookie stale/inválida y generar bucles /home <-> /login (307).
  // Dejamos que la página/layout valide la sesión real en servidor.

  // Si NO está logueado y la ruta no es pública, mandar a /login con callback
  if (!isLoggedIn && !isPublic && !isAuthRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) callbackUrl += nextUrl.search;
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);

    const res = NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl),
    );
    return nextUrl.pathname.startsWith("/api") ? withCors(request, res) : res;
  }

  const res = NextResponse.next();
  return nextUrl.pathname.startsWith("/api") ? withCors(request, res) : res;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

