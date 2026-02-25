/**
 * Orígenes permitidos para CORS (app Expo, Expo Go, etc.).
 * Usado por middleware y por el route de auth para enviar Access-Control-Allow-Origin correcto.
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

export function getCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin") || "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept",
  };
  if (allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}
