const configuredSiteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
const siteUrl = configuredSiteUrl && !/localhost|127\.0\.0\.1/i.test(configuredSiteUrl)
  ? configuredSiteUrl
  : 'https://caleta.top';

const privateRoutePrefixes = [
  '/api',
  '/admin',
  '/academico',
  '/ajustes',
  '/biblioteca',
  '/billetera',
  '/caletas',
  '/cursos',
  '/editor',
  '/historias',
  '/home',
  '/ia',
  '/onboarding',
  '/perfil',
  '/suscripcion',
  '/tareas',
  '/tesis',
  '/view-file',
  '/view-pdf',
];

const nonIndexablePublicRoutes = new Set([
  '/aprende-pic18/connect',
  '/error',
  '/login',
  '/new-password',
  '/new-verification',
  '/register',
  '/reset',
  '/zeno-notes/connect',
]);

async function loadDynamicPublicPaths() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const [posts, users] = await Promise.all([
      prisma.blogPost.findMany({
        where: { isPublished: true, slug: { not: null } },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 500,
      }),
      prisma.user.findMany({
        where: { username: { not: null } },
        select: { username: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 1000,
      }),
    ]);
    await prisma.$disconnect();

    return [
      ...posts
        .filter((post) => post.slug)
        .map((post) => ({
          loc: `/blog/${post.slug}`,
          lastmod: post.updatedAt?.toISOString?.() || new Date().toISOString(),
          changefreq: 'monthly',
          priority: 0.7,
        })),
      ...users
        .filter((user) => user.username)
        .map((user) => ({
          loc: `/u/${user.username}`,
          lastmod: user.updatedAt?.toISOString?.() || new Date().toISOString(),
          changefreq: 'weekly',
          priority: 0.6,
        })),
    ];
  } catch (error) {
    console.warn('[next-sitemap] No se pudieron cargar rutas dinámicas públicas:', error instanceof Error ? error.message : error);
    return [];
  }
}

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  exclude: [
    '/api/*',
    '/admin/*',
    '/academico/*',
    '/aprende-pic18/connect',
    '/editor/*',
    '/error',
    '/login',
    '/new-password',
    '/new-verification',
    '/register',
    '/reset',
    '/test-*',
    '/view-file/*',
    '/view-pdf/*',
    '/zeno-notes/connect',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/academico/', '/editor/', '/onboarding/'],
      },
    ],
  },
  transform: async (config, path) => {
    if (nonIndexablePublicRoutes.has(path)) return null;
    if (privateRoutePrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
      return null;
    }
    return {
      loc: path,
      changefreq: path === '/' ? 'weekly' : 'monthly',
      priority: path === '/' ? 1.0 : path.startsWith('/u/') ? 0.6 : 0.7,
      lastmod: new Date().toISOString(),
    };
  },
  additionalPaths: async () => loadDynamicPublicPaths(),
};





