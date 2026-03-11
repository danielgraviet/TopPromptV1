/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://topprompt.io',
  generateRobotsTxt: true,
  exclude: ['/api/*', '/saved', '/submit', '/login', '/auth/*'],
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/api/', '/saved', '/submit', '/login'] },
    ],
  },
  additionalPaths: async () => {
    // Dynamically add all prompt pages to the sitemap
    const { neon } = require('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL)

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
