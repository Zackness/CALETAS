import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect() {
        // La UI actual ya soporta un paso de "código" (OTP).
        // Aquí no redirigimos: el formulario manejará el estado.
      },
    }),
  ],
});

