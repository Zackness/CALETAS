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

function configuredWebOrigins(): Set<string> {
  return new Set(
    (process.env.ZENO_NOTES_REDIRECT_ORIGINS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export function validateZenoRedirectUri(redirectUri: string): boolean {
  try {
    const url = new URL(redirectUri);

    if (url.protocol === "zeno-notes:") {
      return (
        url.hostname === "auth" &&
        (url.pathname === "/callback" || url.pathname === "/callback/")
      );
    }

    if (url.protocol === "http:" || url.protocol === "https:") {
      if (LOOPBACK_HOSTS.has(url.hostname)) {
        return true;
      }

      if (configuredWebOrigins().has(url.origin)) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

export function signMobileToken(payload: MobileJwtPayload): string {
  return jwt.sign(payload, jwtSecret(), { expiresIn: "30d" });
}

export function buildZenoConnectCallbackUrl(params: {
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
