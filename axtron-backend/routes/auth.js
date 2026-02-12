const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const { jwtSecret, jwtExpiresIn } = require('../config/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Campos obrigatórios' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const insert = await db.query('INSERT INTO users (username, email, password) VALUES ($1,$2,$3) RETURNING id, username, email', [username, email, hash]);
    res.json(insert.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar' });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Campos obrigatórios' });

  db.query('SELECT * FROM users WHERE email = $1', [email])
    .then(async ({ rows }) => {
      const user = rows[0];
      if (!user) return res.status(401).json({ error: 'Usuário não existe' });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Senha errada' });
      const token = jwt.sign({ id: user.id, premium: !!user.premium }, jwtSecret, { expiresIn: jwtExpiresIn });
      res.json({ token, user: { id: user.id, username: user.username, premium: !!user.premium } });
    })
    .catch(err => res.status(500).json({ error: err.message }));
});

module.exports = router;
