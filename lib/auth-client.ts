import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

export const authClient = createAuthClient({
  plugins: [
    passkeyClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        // La UI actual ya soporta un paso de "código" (OTP).
        // Aquí no redirigimos: el formulario manejará el estado.
      },
    }),
  ],
});

