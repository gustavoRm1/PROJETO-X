const db = require('./database');

class Analytics {
  async trackView(videoId, data = {}) {
    const { referrer = null, duration = 0 } = data;

    try {
      await db.execute('UPDATE videos SET views = views + 1 WHERE id = ?', [videoId]);

      const today = new Date().toISOString().split('T')[0];
      const isOrganic = referrer && (referrer.includes('google') || referrer.includes('bing') || referrer.includes('yahoo'));

      await db.execute(
        `INSERT INTO video_analytics (video_id, date, views_organic, views_direct, avg_watch_time)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         views_organic = views_organic + ?,
         views_direct = views_direct + ?,
         avg_watch_time = ((avg_watch_time * (views_organic + views_direct)) + ?) / (views_organic + views_direct + 1)`,
        [videoId, today, isOrganic ? 1 : 0, isOrganic ? 0 : 1, duration, isOrganic ? 1 : 0, isOrganic ? 0 : 1, duration]
      );
    } catch (error) {
      console.error('Erro ao registrar view:', error.message);
    }
  }

  async getGlobalStats() {
    try {
      const stats = await db.execute(
        `SELECT
          COUNT(*) as total_videos,
          SUM(views) as total_views,
          COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready_videos,
          COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_videos
        FROM videos`
      );

      const localesCount = await db.execute('SELECT COUNT(DISTINCT locale) as locales FROM video_translations');
      const indexedPages = await db.execute('SELECT COUNT(*) as total FROM sitemap_urls WHERE is_active = 1');

      return {
        videos: stats[0],
        locales: localesCount[0]?.locales || 0,
        indexedPages: indexedPages[0]?.total || 0
      };
    } catch (error) {
      console.error('Erro ao buscar stats:', error.message);
      return null;
    }
  }

  async getTrafficReport(days = 30) {
    try {
      return await db.execute(
        `SELECT
          date,
          SUM(views_organic) as organic,
          SUM(views_direct) as direct,
          AVG(avg_watch_time) as avg_time
         FROM video_analytics
         WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         GROUP BY date
         ORDER BY date ASC`,
        [days]
      );
    } catch (error) {
      console.error('Erro ao gerar relatório:', error.message);
      return [];
    }
  }
}

module.exports = new Analytics();
