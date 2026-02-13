require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pipeline = require('./config/pipeline');
const uploadRoutes = require('./routes/upload');
const seoRoutes = require('./routes/seo');
const queueManager = require('./services/queueManager');
const analytics = require('./services/analytics');
const { authenticate, login } = require('./middleware/auth');
const { uploadLimiter, apiLimiter } = require('./middleware/rateLimiter');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

if (pipeline.missing.length) {
  console.warn('[seo-engine] Variáveis ausentes:', pipeline.missing.join(', '));
}

queueManager.setupProcessors();

app.use('/uploads', express.static(path.join(process.env.UPLOAD_PATH || '.', 'videos')));
app.use('/thumbs', express.static(process.env.THUMB_PATH || '.'));

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await login(username, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

app.use('/api', apiLimiter);
app.use('/api/admin', authenticate, uploadLimiter, uploadRoutes);
app.use('/api/seo', authenticate, seoRoutes);

app.post('/api/track/view/:videoId', async (req, res) => {
  await analytics.trackView(req.params.videoId, {
    referrer: req.headers.referer || null,
    duration: Number(req.body.duration || 0)
  });
  res.json({ success: true });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), locales: pipeline.supportedLocales });
});

const port = Number(process.env.SEO_ENGINE_PORT || process.env.PORT || 4100);
app.listen(port, '0.0.0.0', () => {
  console.log(`[seo-engine] online na porta ${port}`);
});
