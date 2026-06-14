import jwt from "jsonwebtoken";

import type { MobileJwtPayload } from "@/lib/zeno-mobile-auth";

function jwtSecret() {
  return (
    process.env.JWT_SECRET?.trim() ||
    process.env.BETTER_AUTH_SECRET?.trim() ||
    "your-secret-key"
  );
}

const ALLOWED_REDIRECT_PATTERNS = [
  /^http:\/\/127\.0\.0\.1:\d+(?:\/callback)?\/?$/,
  /^http:\/\/localhost:\d+(?:\/callback)?\/?$/,
  /^zeno-notes:\/\/auth\/callback\/?$/,
];

export function validateZenoRedirectUri(redirectUri: string): boolean {
  try {
    const url = new URL(redirectUri);
    if (url.protocol === "zeno-notes:") {
      return ALLOWED_REDIRECT_PATTERNS.some((pattern) => pattern.test(redirectUri));
    }
    if (url.protocol !== "http:") return false;
    return ALLOWED_REDIRECT_PATTERNS.some((pattern) => pattern.test(redirectUri));
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
