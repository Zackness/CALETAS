import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";

const allowedOrigins = [
  "http://localhost:8081", // Expo web local
  "http://localhost:19006", // Expo web alternativo
  "exp://localhost:19000", // Expo Go local
  "exp://192.168.137.1:19000", // Expo Go en red local
  "http://localhost:19000", // Expo web en red local
  "http://192.168.137.1:19000", // Expo web en red local
];

const isPublicRoute = (pathname: string) => {
  return publicRoutes.some((route) => {
    if (route.includes(".*")) {
      return new RegExp(route).test(pathname);
    }
    return pathname === route;
  });
};

const withCors = (request: NextRequest, response: NextResponse) => {
  const origin = request.headers.get("origin") || "";
  const isAllowedOrigin = allowedOrigins.includes(origin);

  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");

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

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isPublic = isPublicRoute(nextUrl.pathname);

  // Dejar pasar endpoints de auth de Better Auth
  if (isApiAuthRoute) {
    const res = NextResponse.next();
    return nextUrl.pathname.startsWith("/api") ? withCors(request, res) : res;
  }

  // Si ya está logueado, no permitir entrar a /login o /register, etc.
  if (isAuthRoute && isLoggedIn) {
    const res = NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    return nextUrl.pathname.startsWith("/api") ? withCors(request, res) : res;
  }

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

