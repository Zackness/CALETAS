const { prisma } = require('./lib/prisma'); // Asegúrate de que prisma esté configurado correctamente

module.exports = {
  siteUrl: 'https://globalegal.org',
  generateRobotsTxt: true,
  exclude: ['/instructor/*', 'editor/*'],
  additionalPaths: async (config) => {
    // Recupera cursos, noticias y posts publicados
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      select: { slug: true },
    });
    const news = await prisma.newsArticle.findMany({
      where: { isPublished: true },
      select: { slug: true },
    });
    const blogPosts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { slug: true },
    });

    const paths = [
      ...blogPosts.map((post) => `/blog/${post.slug}`),
    ];

    return paths.map((path) => {
      return {
        loc: `${config.siteUrl}${path}`, // Asegúrate de que está usando el sitio base.
        lastmod: new Date().toISOString(), // Puedes ajustar esto según los cambios.
        changefreq: 'daily',
        priority: 0.7,
      };
    });
  },
};





