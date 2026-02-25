import Stripe from "stripe";

// Acepta STRIPE_API_KEY o STRIPE_SECRET_KEY (nombre habitual en la documentación de Stripe)
const stripeSecretKey =
  process.env.STRIPE_API_KEY ||
  process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey?.startsWith("sk_")) {
  console.warn(
    "[Stripe] No se encontró API key válida. Define STRIPE_API_KEY o STRIPE_SECRET_KEY en .env con tu clave secreta (sk_test_... o sk_live_...)."
  );
}

export const stripe = new Stripe(stripeSecretKey ?? "", {
  apiVersion: "2024-06-20",
  typescript: true,
});