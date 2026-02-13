const Queue = require('bull');
const db = require('./database');
const aiProcessor = require('./aiProcessor');

class QueueManager {
  constructor() {
    const redis = {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT || 6379)
    };

    this.thumbnailQueue = new Queue('thumbnail-generation', { redis });
    this.aiQueue = new Queue('ai-processing', { redis });
    this.translationQueue = new Queue('translation', { redis });
    this.articleQueue = new Queue('article-generation', { redis });
  }

  setupProcessors() {
    this.aiQueue.process(async (job) => {
      const { videoId, context } = job.data;
      const metadata = await aiProcessor.generateSEOMetadata('frame', context);

      await db.execute(
        'INSERT INTO video_content (video_id, title, meta_description, description_long, tags) VALUES (?, ?, ?, ?, ?)',
        [videoId, metadata.title, metadata.metaDescription, metadata.descriptionLong, JSON.stringify(metadata.tags || [])]
      );

      await db.execute('UPDATE videos SET slug = ?, status = ? WHERE id = ?', [metadata.suggestedSlug || `video-${videoId}`, 'ready', videoId]);
      await db.execute('UPDATE processing_queue SET status = ?, completed_at = NOW() WHERE video_id = ? AND task_type = ?', ['completed', videoId, 'ai_metadata']);

      return { ok: true };
    });

    this.articleQueue.process(async (job) => {
      const { categoryId } = job.data;
      return { ok: true, categoryId };
    });
  }

  async addVideoToProcessing(videoId, context = {}) {
    await this.aiQueue.add({ videoId, context }, { priority: 2, attempts: 3 });
    await db.execute('INSERT INTO processing_queue (video_id, task_type, priority) VALUES (?, ?, ?)', [videoId, 'ai_metadata', 2]);
  }
}

module.exports = new QueueManager();
