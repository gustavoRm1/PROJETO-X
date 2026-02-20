/* SERVER.JS - AXTRON BACKEND V3 (Com Perfil e IA) */
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config(); 

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Garante pastas públicas
['public/uploads/videos', 'public/uploads/thumbs', 'public/uploads/profiles', 'temp_uploads'].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

/* --- ROTAS --- */
const { authGuard, sensitiveRouteLimiter } = require('./middlewares/authGuard');

const db = require('./db');
const postsRoutes = require('./routes/posts');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile'); // NOVO
const uploadRoutes = require('./routes/upload');   // NOVO

app.use('/posts', postsRoutes);
app.use('/auth', authRoutes);
app.use('/profile', authGuard, profileRoutes); // Protegido
app.use('/upload', authGuard, sensitiveRouteLimiter, uploadRoutes); // Protegido + Rate Limit

// Ping
app.get('/', (req, res) => res.json({ status: 'AXTRON API V3 Online' }));

// Erro global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor!' });
});

app.listen(port, () => {
  console.log(`🔥 AXTRON API rodando na porta ${port}`);
});
