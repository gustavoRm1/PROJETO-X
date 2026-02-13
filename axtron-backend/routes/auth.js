const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/auth');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
};

const comparePassword = (password, storedHash) => {
  if (!storedHash || !storedHash.startsWith('scrypt:')) return false;
  const [, salt, originalHash] = storedHash.split(':');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
};

router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Preencha todos os campos!' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ error: 'A senha deve ter ao menos 8 caracteres.' });
    }

    const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }

    const hashedPassword = hashPassword(password);

    const newUser = await pool.query(
      'INSERT INTO users (email, username, password, name) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, username, hashedPassword, username]
    );

    const token = jwt.sign({ id: newUser.rows[0].id }, jwtSecret, { expiresIn: jwtExpiresIn });

    res.json({
      message: 'Conta criada com sucesso!',
      token,
      user: {
        id: newUser.rows[0].id,
        name: newUser.rows[0].name,
        email: newUser.rows[0].email,
        username: newUser.rows[0].username
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro no servidor ao criar conta.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Preencha e-mail e senha.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }

    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Credenciais inválidas.' });
    }

    const validPassword = comparePassword(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign({ id: user.rows[0].id }, jwtSecret, { expiresIn: jwtExpiresIn });

    res.json({
      message: 'Login realizado!',
      token,
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        username: user.rows[0].username
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro no servidor ao fazer login.' });
  }
});

module.exports = router;
