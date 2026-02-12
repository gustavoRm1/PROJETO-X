const express = require('express');
const db = require('../models/db');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT id, username, premium, xp, streak, arousal_level FROM users WHERE id = $1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (err){
    res.status(500).json({ error: err.message });
  }
});

router.post('/premium', auth, async (req, res) => {
  try {
    await db.query('UPDATE users SET premium = true WHERE id = $1', [req.user.id]);
    res.json({ premium: true });
  } catch (err){
    res.status(500).json({ error: err.message });
  }
});

router.get('/gamification', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM gamification WHERE user_id=$1 ORDER BY timestamp DESC LIMIT 20', [req.user.id]);
    res.json(result.rows);
  } catch (err){
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
