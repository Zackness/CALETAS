import { auth } from "@/lib/auth";
import { verifyMobileJwt } from "@/lib/zeno-mobile-auth";

export async function resolveAuthenticatedUserId(request: Request): Promise<string | null> {
  const jwtUser = verifyMobileJwt(request.headers.get("Authorization"));
  if (jwtUser?.id) return jwtUser.id;

  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user?.id ?? null;
}
