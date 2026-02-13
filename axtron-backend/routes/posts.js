const express = require('express');
const router = express.Router();
const pool = require('../db'); // Certifique-se que o arquivo db.js existe na raiz ou pasta config
const multer = require('multer');
const path = require('path');

// Configuração de Upload (Multer)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// ROTA GET: Busca vídeos (com filtro de busca opcional)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let queryText;
    let queryParams = [];

    // Se tiver busca, filtra pelo título
    if (search) {
      queryText = `
        SELECT p.*, u.username, u.avatar 
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.title ILIKE $1
        ORDER BY p.created_at DESC
      `;
      queryParams.push(`%${search}%`);
    } else {
      // Se não tiver busca, traz tudo
      queryText = `
        SELECT p.*, u.username, u.avatar 
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
      `;
    }

    const result = await pool.query(queryText, queryParams);
    res.json(result.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro no servidor ao buscar posts' });
  }
});

// ROTA POST: Upload de novo vídeo (Protegido seria ideal, mas vamos deixar aberto pro teste)
router.post('/', upload.single('video'), async (req, res) => {
  try {
    const { title, user_id } = req.body;
    const video_url = req.file ? req.file.filename : req.body.video_url;

    // Validação básica
    if (!title || !video_url) {
      return res.status(400).json({ error: 'Título e Vídeo são obrigatórios' });
    }

    // Tenta pegar thumbnail se enviada (ou usa padrão)
    const thumbnail_url = req.body.thumbnail_url || null; 

    // Inserção no Banco
    const newPost = await pool.query(
      'INSERT INTO posts (user_id, title, video_url, thumbnail_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id || 1, title, video_url, thumbnail_url] // Usa ID 1 se não vier user_id
    );

    res.json(newPost.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao salvar post' });
  }
});

module.exports = router;
