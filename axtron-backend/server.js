require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// ============================================
// IMPORTAÇÕES - ROTAS ORIGINAIS
// ============================================
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const userRoutes = require('./routes/users');

// ============================================
// IMPORTAÇÕES - SISTEMA SEO (NOVO)
// ============================================
const uploadRoutes = require('./src/routes/upload');
const seoRoutes = require('./src/routes/seo');
const queueManager = require('./src/services/queueManager');
const analytics = require('./src/services/analytics');
const { authenticate, login } = require('./src/middleware/auth');
const { uploadLimiter, apiLimiter } = require('./src/middleware/rateLimiter');

const app = express();

// ============================================
// RATE LIMITER PARA AUTH
// ============================================
const authRequestStore = new Map();
const authWindowMs = 15 * 60 * 1000;
const authMaxRequests = 100;

const authLimiter = (req, res, next) => {
  const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const register = authRequestStore.get(key);

  if (!register || now > register.resetAt) {
    authRequestStore.set(key, { count: 1, resetAt: now + authWindowMs });
    return next();
  }

  register.count += 1;

  if (register.count > authMaxRequests) {
    return res.status(429).json({ error: 'Muitas tentativas. Tente novamente em alguns minutos.' });
  }

  return next();
};

// ============================================
// HEADERS DE SEGURANÇA
// ============================================
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
};

// ============================================
// CORS CONFIGURATION
// ============================================
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : true;

// ============================================
// MIDDLEWARES
// ============================================
app.use(securityHeaders);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ============================================
// CRIAR PASTAS NECESSÁRIAS
// ============================================
const uploadPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const videosPath = path.join(uploadPath, 'videos');
if (!fs.existsSync(videosPath)) {
  fs.mkdirSync(videosPath, { recursive: true });
}

// ============================================
// STATIC FILES
// ============================================
app.use('/uploads', express.static(uploadPath));
app.use('/thumbs', express.static(process.env.THUMB_PATH || path.join(__dirname, 'thumbs')));

// Servir Frontend
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// ============================================
// INICIALIZAR QUEUE PROCESSORS (IMPORTANTE!)
// ============================================
console.log('🔧 Inicializando processadores de fila...');
try {
  queueManager.setupProcessors();
  console.log('✅ Processadores de fila inicializados');
} catch (error) {
  console.error('❌ Erro ao inicializar processadores:', error.message);
}

// ============================================
// ROTAS DA API
// ============================================

// Auth principal (sistema original)
app.use('/auth', authLimiter, authRoutes);

// Sistema original (posts, comments, users)
app.use('/posts', postRoutes);
app.use('/comments', commentRoutes);
app.use('/users', userRoutes);

// ============================================
// ROTAS DO SISTEMA SEO (NOVO)
// ============================================

// Login para admin SEO
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await login(username, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Rotas protegidas de upload e SEO
app.use('/api', apiLimiter);
app.use('/api/admin', authenticate, uploadLimiter, uploadRoutes);
app.use('/api/seo', authenticate, seoRoutes);

// Tracking de views (público)
app.post('/api/track/view/:videoId', async (req, res) => {
  try {
    await analytics.trackView(req.params.videoId, {
      referrer: req.headers.referer || null,
      userAgent: req.headers['user-agent'] || null,
      ip: req.ip || req.headers['x-forwarded-for'] || null,
      duration: Number(req.body.duration || 0)
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao rastrear view:', error);
    res.json({ success: false });
  }
});

// Stats das filas
app.get('/api/admin/queue/stats', authenticate, async (req, res) => {
  try {
    const stats = await queueManager.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'checking',
      redis: 'checking',
      gemini: process.env.GEMINI_API_KEY ? 'configured' : 'missing'
    }
  });
});

// ============================================
// FALLBACK PARA SPA
// ============================================
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 4000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
========================================
🚀 DESEJOSHOT SERVER ONLINE
========================================
Port: ${PORT}
Environment: ${process.env.NODE_ENV || 'development'}
API: http://localhost:${PORT}/api
Admin: http://localhost:${PORT}/admin.html
========================================

⚙️  SERVIÇOS:
- MySQL: ${process.env.DB_HOST || '127.0.0.1'}:3306
- Redis: ${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}
- Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ Configurado' : '❌ FALTANDO'}

📁 CAMINHOS:
- Uploads: ${process.env.UPLOAD_PATH || './uploads'}
- Thumbs: ${process.env.THUMB_PATH || './thumbs'}
- Temp: ${process.env.TEMP_PATH || './temp'}

========================================
  `);

  // Verificar variáveis críticas
  const missing = [];
  if (!process.env.GEMINI_API_KEY) missing.push('GEMINI_API_KEY');
  if (!process.env.DB_HOST) missing.push('DB_HOST');
  if (!process.env.REDIS_HOST) missing.push('REDIS_HOST');

  if (missing.length > 0) {
    console.warn('⚠️  VARIÁVEIS FALTANDO:', missing.join(', '));
    console.warn('⚠️  Configure o arquivo .env antes de usar o sistema completo!');
  }
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido, encerrando gracefully...');
  process.exit(0);
});
