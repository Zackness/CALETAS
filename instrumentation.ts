/**
 * Se ejecuta al arrancar el runtime de Node en el servidor.
 * En producción a veces no se pasa NODE_OPTIONS=--dns-result-order=ipv4first;
 * sin eso, Neon puede resolver primero IPv6 y fallar de forma intermitente (P1017, ECONNRESET).
 *
 * No usar `import("dns")` ni `import("node:dns")` aquí: Webpack falla al compilar instrumentation
 * ("Unhandled scheme" / "Can't resolve 'dns'"). Cargamos el built-in solo en runtime con require.
 */
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    // eslint-disable-next-line no-eval -- único hook permitido por Webpack para módulos built-in de Node
    const dns = eval("require")("dns") as typeof import("dns");
    dns.setDefaultResultOrder("ipv4first");
  } catch {
    // Sin `require` (poco habitual): el host debe usar NODE_OPTIONS=--dns-result-order=ipv4first
  }
}
