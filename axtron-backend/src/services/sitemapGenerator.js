const { SitemapStream, streamToPromise } = require('sitemap');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const db = require('./database');

class SitemapGenerator {
  constructor() {
    this.siteUrl = process.env.SITE_URL || 'https://desejoshot.com';
    this.locales = (process.env.SUPPORTED_LOCALES || 'pt,en,es,fr,de,it,ru,ja,ar,hi').split(',');
  }

  getUrlType(url) {
    if (url.includes('/video/')) return 'video';
    if (url.includes('/categoria/')) return 'category';
    if (url.includes('/blog/')) return 'article';
    return 'static';
  }

  async saveToDatabase(urls) {
    await db.execute('DELETE FROM sitemap_urls');
    if (!urls.length) return;

    for (const urlItem of urls) {
      const locale = (urlItem.url.split('/')[1] || 'pt').slice(0, 5);
      await db.execute(
        `INSERT INTO sitemap_urls (url, locale, priority, changefreq, lastmod, url_type, reference_id, is_active)
         VALUES (?, ?, ?, ?, ?, ?, NULL, 1)`,
        [
          urlItem.url,
          locale,
          Number(urlItem.priority || 0.5),
          urlItem.changefreq || 'weekly',
          urlItem.lastmod || new Date().toISOString(),
          this.getUrlType(urlItem.url)
        ]
      );
    }
  }

  async generate() {
    const urls = [];

    this.locales.forEach((locale) => {
      urls.push({
        url: locale === 'pt' ? '/' : `/${locale}/`,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString()
      });
    });

    const videos = await db.execute(
      `SELECT v.id, v.slug, v.updated_at, vt.locale, vt.slug as locale_slug
       FROM videos v
       LEFT JOIN video_translations vt ON v.id = vt.video_id
       WHERE v.status = 'ready'`
    );

    videos.forEach((video) => {
      const locale = video.locale || 'pt';
      const slug = video.locale_slug || video.slug;
      if (!slug) return;
      urls.push({
        url: locale === 'pt' ? `/video/${slug}` : `/${locale}/video/${slug}`,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: new Date(video.updated_at || Date.now()).toISOString()
      });
    });

    const categories = await db.execute(
      `SELECT c.slug, c.priority, ct.locale
       FROM categories c
       LEFT JOIN category_translations ct ON c.id = ct.category_id`
    );

    categories.forEach((cat) => {
      const locale = cat.locale || 'pt';
      urls.push({
        url: locale === 'pt' ? `/categoria/${cat.slug}` : `/${locale}/categoria/${cat.slug}`,
        changefreq: 'daily',
        priority: Number(cat.priority || 0.7),
        lastmod: new Date().toISOString()
      });
    });

    const articles = await db.execute('SELECT slug, last_regenerated FROM seo_articles WHERE is_published = 1');
    articles.forEach((article) => {
      urls.push({
        url: `/blog/${article.slug}`,
        changefreq: 'monthly',
        priority: 0.6,
        lastmod: new Date(article.last_regenerated || Date.now()).toISOString()
      });
    });

    const stream = new SitemapStream({ hostname: this.siteUrl });
    const data = await streamToPromise(Readable.from(urls).pipe(stream));

    const outputPath = path.join(__dirname, '../../public/sitemap.xml');
    fs.writeFileSync(outputPath, data.toString());

    await this.saveToDatabase(urls);

    return {
      success: true,
      urls: urls.length,
      locales: this.locales.length,
      path: outputPath
    };
  }

  async notifyGoogle() {
    const sitemapUrl = `${this.siteUrl}/sitemap.xml`;

    try {
      const response = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
      return {
        success: response.ok,
        message: response.ok ? 'Google notificado com sucesso' : 'Falha ao notificar Google'
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = new SitemapGenerator();
