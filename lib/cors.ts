/**
 * Orígenes permitidos para CORS (app Expo, Expo Go, etc.).
 * Con credentials: 'include' NUNCA usar Access-Control-Allow-Origin: *.
 */
export const allowedOrigins = [
  "http://localhost:8081",
  "http://localhost:19006",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:19006",
  "exp://localhost:19000",
  "exp://192.168.137.1:19000",
  "http://localhost:19000",
  "http://192.168.137.1:19000",
];

/** Permite localhost/127.0.0.1 con cualquier puerto (dev). */
export function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (allowedOrigins.includes(origin)) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

export function getCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin") || "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept",
  };
  if (isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}
