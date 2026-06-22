import jwt from "jsonwebtoken";

import type { MobileJwtPayload } from "@/lib/zeno-mobile-auth";

function jwtSecret() {
  return (
    process.env.JWT_SECRET?.trim() ||
    process.env.BETTER_AUTH_SECRET?.trim() ||
    "your-secret-key"
  );
}

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

const CPP_POO_HOSTS = new Set(["cpp.caleta.top", "localhost", "127.0.0.1"]);

export function validateCppPooRedirectUri(redirectUri: string): boolean {
  try {
    const url = new URL(redirectUri);

    if (url.protocol === "http:" || url.protocol === "https:") {
      if (!CPP_POO_HOSTS.has(url.hostname) && !LOOPBACK_HOSTS.has(url.hostname)) {
        return false;
      }
      return url.pathname === "/auth/callback" || url.pathname === "/auth/callback/";
    }

    return false;
  } catch {
    return false;
  }
}

export function signCppPooToken(payload: MobileJwtPayload): string {
  return jwt.sign(payload, jwtSecret(), { expiresIn: "30d" });
}

export function buildCppPooCallbackUrl(params: {
  redirectUri: string;
  state: string;
  token: string;
  user: { id: string; email: string; name: string };
}) {
  const url = new URL(params.redirectUri);
  url.searchParams.set("token", params.token);
  url.searchParams.set("state", params.state);
  url.searchParams.set("userId", params.user.id);
  url.searchParams.set("email", params.user.email);
  url.searchParams.set("name", params.user.name);
  return url.toString();
}
