/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://topprompt.io',
  generateRobotsTxt: true,
  exclude: ['/api/*', '/saved', '/submit', '/login', '/auth/*'],
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/saved', '/submit', '/login'] },
    ],
  },
  additionalPaths: async () => {
    // Dynamically add all prompt pages to the sitemap
    const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_POOLED
    if (!dbUrl) {
      console.warn('next-sitemap: DATABASE_URL not set, skipping dynamic prompt paths')
      return []
    }
    const { neon } = require('@neondatabase/serverless')
    const sql = neon(dbUrl)

    const rows = await sql`
      SELECT slug, updated_at FROM prompts
      WHERE flagged = false
      ORDER BY score DESC
    `

    return rows.map((p) => ({
      loc: `/prompt/${p.slug}`,
      lastmod: p.updated_at ? new Date(p.updated_at).toISOString() : new Date().toISOString(),
      changefreq: 'weekly',
      priority: 0.8,
    }))
  },
}
