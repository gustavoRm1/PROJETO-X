const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

let schemaReady = false;

const ensureSchema = async () => {
  if (schemaReady) return;

  await pool.query(`
    ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS views INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS category VARCHAR(100),
      ADD COLUMN IF NOT EXISTS video_url TEXT,
      ADD COLUMN IF NOT EXISTS thumbnail_url TEXT
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS post_likes (
      id SERIAL PRIMARY KEY,
      post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(post_id, user_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS favorites (
      id SERIAL PRIMARY KEY,
      post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(post_id, user_id)
    )
  `);

  schemaReady = true;
};

// Configuração de Upload (Multer)
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const normalizePost = (row) => ({
  ...row,
  video_url: row.video_url || row.video,
  likes_count: Number(row.likes_count || 0),
  views: Number(row.views || 0)
});

// GET listagem (com busca/categoria)
router.get('/', async (req, res) => {
  try {
    await ensureSchema();

    const { search, category } = req.query;
    const where = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      where.push(`p.title ILIKE $${params.length}`);
    }

    if (category && category !== 'Tudo') {
      params.push(category);
      where.push(`p.category = $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const queryText = `
      SELECT p.*, u.username, u.avatar,
      EXISTS (
        SELECT 1 FROM favorites f
        WHERE f.post_id = p.id
          AND f.user_id = COALESCE($${params.length + 1}::int, -1)
      ) AS is_favorite
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ${whereSql}
      ORDER BY p.created_at DESC
    `;

    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const { jwtSecret } = require('../config/auth');
        const decoded = jwt.verify(authHeader.replace('Bearer ', ''), jwtSecret);
        userId = decoded.id;
      } catch (err) {
        userId = null;
      }
    }

    const result = await pool.query(queryText, [...params, userId]);
    res.json(result.rows.map(normalizePost));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro no servidor ao buscar posts' });
  }
});

// GET post por id
router.get('/:id(\\d+)', async (req, res) => {
  try {
    await ensureSchema();

    const result = await pool.query(
      `SELECT p.*, u.username, u.avatar
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vídeo não encontrado.' });
    }

    return res.json(normalizePost(result.rows[0]));
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: 'Erro ao carregar vídeo.' });
  }
});

// ROTA POST: Upload de novo vídeo
router.post('/', auth, upload.single('video'), async (req, res) => {
  try {
    await ensureSchema();

    const { title, category } = req.body;
    const videoUrl = req.file ? req.file.filename : req.body.video_url;

    if (!title || !videoUrl) {
      return res.status(400).json({ error: 'Título e Vídeo são obrigatórios' });
    }

    const thumbnailUrl = req.body.thumbnail_url || null;

    const newPost = await pool.query(
      'INSERT INTO posts (user_id, title, video_url, thumbnail_url, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, title, videoUrl, thumbnailUrl, category || null]
    );

    res.json(normalizePost(newPost.rows[0]));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao salvar post' });
  }
});

// Incrementa visualização real
router.post('/:id(\\d+)/view', async (req, res) => {
  try {
    await ensureSchema();
    const result = await pool.query(
      'UPDATE posts SET views = COALESCE(views, 0) + 1 WHERE id = $1 RETURNING id, views',
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Vídeo não encontrado.' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: 'Erro ao registrar view.' });
  }
});

// Toggle like real por usuário
router.post('/:id(\\d+)/like', auth, async (req, res) => {
  try {
    await ensureSchema();

    const exists = await pool.query(
      'SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    let liked;

    if (exists.rows.length) {
      await pool.query('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2', [req.params.id, req.user.id]);
      await pool.query('UPDATE posts SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = $1', [req.params.id]);
      liked = false;
    } else {
      await pool.query('INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)', [req.params.id, req.user.id]);
      await pool.query('UPDATE posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = $1', [req.params.id]);
      liked = true;
    }

    const count = await pool.query('SELECT likes_count FROM posts WHERE id = $1', [req.params.id]);

    return res.json({ liked, likes_count: Number(count.rows[0]?.likes_count || 0) });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: 'Erro ao curtir vídeo.' });
  }
});

// Toggle favorito (library)
router.post('/:id(\\d+)/favorite', auth, async (req, res) => {
  try {
    await ensureSchema();

    const exists = await pool.query(
      'SELECT id FROM favorites WHERE post_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    let isFavorite;

    if (exists.rows.length) {
      await pool.query('DELETE FROM favorites WHERE post_id = $1 AND user_id = $2', [req.params.id, req.user.id]);
      isFavorite = false;
    } else {
      await pool.query('INSERT INTO favorites (post_id, user_id) VALUES ($1, $2)', [req.params.id, req.user.id]);
      isFavorite = true;
    }

    return res.json({ isFavorite });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: 'Erro ao favoritar vídeo.' });
  }
});

// Library/Favoritos reais do usuário
router.get('/library/favorites', auth, async (req, res) => {
  try {
    await ensureSchema();

    const result = await pool.query(
      `SELECT p.*, u.username, u.avatar
       FROM favorites f
       JOIN posts p ON p.id = f.post_id
       JOIN users u ON u.id = p.user_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );

    return res.json(result.rows.map((row) => ({ ...normalizePost(row), is_favorite: true })));
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: 'Erro ao buscar favoritos.' });
  }
});

module.exports = router;
