import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/cors";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

async function withCorsResponse(
  request: NextRequest,
  handlerFn: (req: NextRequest) => Promise<Response>,
) {
  const res = await handlerFn(request);
  const cors = getCorsHeaders(request);
  const newHeaders = new Headers(res.headers);
  Object.entries(cors).forEach(([k, v]) => newHeaders.set(k, v));
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: newHeaders,
  });
}

export async function GET(req: NextRequest) {
  return withCorsResponse(req, (r) => handler.GET(r));
}

export async function POST(req: NextRequest) {
  return withCorsResponse(req, (r) => handler.POST(r));
}

