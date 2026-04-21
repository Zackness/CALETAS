import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Idéntico a unexpo-comedor: handler directo de Better Auth.
export const { GET, POST } = toNextJsHandler(auth);

