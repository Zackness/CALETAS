/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {string[]}
 */

export const publicRoutes = [
    "/",
    "/nosotros",
    "/blog/.*",      // Patrones dinámicos
    "/api/webhook",
    "/api/stripe-url",
    "/new-verification",
    "/terminos-y-condiciones",
];

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to /home
 * @type {string[]}
 */
export const authRoutes = [
    "/login",
    "/register",
    "/error",
    "/reset",
    "/new-password"
];

/**
 * The prefix for API authentication routes
 * Routes that star with this prefix are used for API authentication purposes
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth";

/**
 * The default redirect path after logging in 
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/home";