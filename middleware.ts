import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { authRoutes, publicRoutes, apiAuthPrefix } from "@/routes";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Verificar si es una ruta de API de autenticación
  if (pathname.startsWith(apiAuthPrefix)) {
    return null;
  }

  // Verificar si es una ruta pública
  if (publicRoutes.some(route => {
    if (route.includes(".*")) {
      const regex = new RegExp(route);
      return regex.test(pathname);
    }
    return pathname === route;
  })) {
    return null;
  }

  // Verificar si es una ruta de autenticación
  if (authRoutes.includes(pathname)) {
    return null;
  }

  // Para rutas protegidas, verificar autenticación
  const token = await getToken({ 
    req,
    secret: process.env.AUTH_SECRET
  });
  const isAuth = !!token;

  if (!isAuth) {
    let from = pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }

    return NextResponse.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
    );
  }

  // Verificar si la sesión ha expirado
  if (token && token.exp) {
    const now = Math.floor(Date.now() / 1000);
    if (now > token.exp) {
      return NextResponse.redirect(
        new URL(`/login?expired=true`, req.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/solicitudes/:path*",
    "/login",
    "/register",
    "/error",
    "/reset",
    "/new-password",
    "/nosotros",
    "/blog/:path*",
    "/api/webhook",
    "/api/stripe-url",
    "/new-verification",
  ],
};

