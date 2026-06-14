import jwt from "jsonwebtoken";

export type MobileJwtPayload = {
  id: string;
  email?: string;
  role?: string;
};

export function verifyMobileJwt(authHeader: string | null): MobileJwtPayload | null {
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
  if (!token) return null;

  const secret =
    process.env.JWT_SECRET?.trim() ||
    process.env.BETTER_AUTH_SECRET?.trim() ||
    "your-secret-key";

  try {
    return jwt.verify(token, secret) as MobileJwtPayload;
  } catch {
    return null;
  }
}
