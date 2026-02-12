const express = require('express');
const db = require('../models/db');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:postId', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT c.*, u.username FROM comments c JOIN users u ON u.id = c.user_id WHERE post_id = $1 ORDER BY created_at DESC',
      [req.params.postId]
    );
    res.json(result.rows);
  } catch (err){
    res.status(500).json({ error: err.message });
  }
});

router.post('/:postId', auth, async (req, res) => {
  const { text } = req.body;
  if(!text) return res.status(400).json({ error: 'Texto obrigatório' });
  try {
    const result = await db.query(
      'INSERT INTO comments (post_id, user_id, text) VALUES ($1,$2,$3) RETURNING *',
      [req.params.postId, req.user.id, text]
    );
    await db.query('INSERT INTO gamification(user_id,xp_gained,streak,reward) VALUES($1,$2,(SELECT streak FROM users WHERE id=$1),$3)', [req.user.id, 10, null]);
    res.json(result.rows[0]);
  } catch (err){
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
