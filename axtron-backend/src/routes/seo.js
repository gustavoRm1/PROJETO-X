const express = require('express');
const router = express.Router();
const sitemapGenerator = require('../services/sitemapGenerator');
const queueManager = require('../services/queueManager');
const db = require('../services/database');

router.post('/sitemap/generate', async (req, res) => {
  try {
    const result = await sitemapGenerator.generate();
    await sitemapGenerator.notifyGoogle();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/notify-google', async (req, res) => {
  try {
    const result = await sitemapGenerator.notifyGoogle();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/articles/generate-all', async (req, res) => {
  try {
    const categories = await db.execute('SELECT id, slug FROM categories WHERE video_count >= 5');

    for (const category of categories) {
      await queueManager.articleQueue.add({ categoryId: category.id }, { priority: 8 });
    }

    res.json({ success: true, categories: categories.length, message: 'Artigos sendo gerados em background' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/articles/:articleId/regenerate', async (req, res) => {
  const { articleId } = req.params;

  try {
    const article = await db.execute('SELECT category_id FROM seo_articles WHERE id = ?', [articleId]);

    if (!article.length) {
      return res.status(404).json({ error: 'Artigo não encontrado' });
    }

    await queueManager.articleQueue.add({ categoryId: article[0].category_id, regenerate: true, articleId });

    return res.json({ success: true, message: 'Artigo sendo regenerado' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/keywords', async (req, res) => {
  try {
    const keywords = await db.execute(
      `SELECT k.*, vc.title as video_title
       FROM seo_keywords k
       LEFT JOIN video_content vc ON k.video_id = vc.video_id
       ORDER BY k.current_position ASC
       LIMIT 100`
    );

    res.json({ keywords });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
