module.exports = {
  siteUrl: 'https://globalegal.org',
  generateRobotsTxt: true,
  exclude: ['/instructor/*', 'editor/*'],
  additionalPaths: async (config) => {
    const { db } = require('./lib/db');

    // Recupera cursos, noticias y posts publicados
    const courses = await db.course.findMany({
      where: { isPublished: true },
      select: { slug: true },
    });
    const news = await db.newsArticle.findMany({
      where: { isPublished: true },
      select: { slug: true },
    });
    const blogPosts = await db.blogPost.findMany({
      where: { isPublished: true },
      select: { slug: true },
    });

    const paths = [
      ...courses.map((course) => `/cursos/${course.slug}`),
      ...news.map((article) => `/noticias/${article.slug}`),
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





