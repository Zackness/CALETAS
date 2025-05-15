import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { DEFAULT_LOGIN_REDIRECT, apiAuthPrefix, authRoutes, publicRoutes } from "@/routes";
import type { NextRequest } from 'next/server';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Permitir acceso sin autenticación a la ruta del webhook
  if (nextUrl.pathname.startsWith('/api/uploadthing')) {
    return;
  }

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.some(route => {
    if (route.includes(".*")) {
      const regex = new RegExp(route);
      return regex.test(nextUrl.pathname);
    }
    return nextUrl.pathname === route;
  });
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

export function middleware(request: NextRequest) {
  // Obtener el origen de la petición
  const origin = request.headers.get('origin') || '';
  
  // Lista de orígenes permitidos
  const allowedOrigins = [
    'http://localhost:8081',     // Expo web local
    'http://localhost:19006',    // Expo web alternativo
    'exp://localhost:19000',     // Expo Go local
    'exp://192.168.137.1:19000',  // Expo Go en red local (reemplaza X con tu IP)
    'http://localhost:19000',    // Expo web en red local
    'http://192.168.137.1:19000',  // Expo web en red local (reemplaza X con tu IP)
  ];

  // Verificar si el origen está permitido
  const isAllowedOrigin = allowedOrigins.includes(origin);

  // Crear los headers de respuesta
  const headers = new Headers(request.headers);
  
  if (isAllowedOrigin) {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Allow-Credentials', 'true');

  // Manejar preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers,
    });
  }

  // Continuar con la petición normal
  const response = NextResponse.next();
  
  // Agregar los headers CORS a la respuesta
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Configurar en qué rutas se ejecutará el middleware
export const configCors = {
  matcher: '/api/:path*',
};

