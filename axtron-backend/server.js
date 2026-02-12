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

// Configurações
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 1. Configurar Pasta de Uploads
const uploadPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
app.use('/uploads', express.static(uploadPath));

// 2. Servir o Frontend (Agora na pasta 'public' interna)
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// 3. Rotas da API
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/comments', commentRoutes);
app.use('/users', userRoutes);

// 4. Fallback: Qualquer rota não-API manda pro index.html (SPA)
app.get('*', (req, res) => {
    // Ignora chamadas de API que deram erro 404
    if (req.url.startsWith('/auth') || req.url.startsWith('/posts')) {
        return res.status(404).json({ error: 'Endpoint não encontrado' });
    }
    res.sendFile(path.join(publicPath, 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 AXTRON rodando na porta ${PORT}`);
    console.log(`jwts: ${process.env.JWT_SECRET ? 'Carregado' : 'Faltando'}`);
});