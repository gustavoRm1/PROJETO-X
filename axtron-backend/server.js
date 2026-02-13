require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Importação das Rotas (Seus arquivos originais)
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const userRoutes = require('./routes/users');

const app = express();

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

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
};

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : true;

// Configurações
app.use(securityHeaders);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 1. Configurar Pasta de Uploads
const uploadPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
app.use('/uploads', express.static(uploadPath));

// 2. Servir o Frontend (Agora na pasta 'public' interna)
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// 3. Rotas da API
app.use('/auth', authLimiter, authRoutes);
app.use('/posts', postRoutes);
app.use('/comments', commentRoutes);
app.use('/users', userRoutes);

// Rota para carregar o index.html como fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`🔥 AXTRON backend rodando na porta ${PORT}`));
