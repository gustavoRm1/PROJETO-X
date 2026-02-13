 const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const pool = require('../db'); // Certifique-se que este é seu pool do mysql2
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/auth');

// --- UTILITÁRIOS DE SEGURANÇA (SENIOR LEVEL) ---

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

// --- ROTAS ---

// 1. REGISTRAR (CRIAR CONTA)
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validações básicas
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Preencha todos os campos!' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ error: 'A senha deve ter ao menos 8 caracteres.' });
    }

    // Verifica se usuário já existe (Sintaxe MySQL)
    const [userExist] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (userExist.length > 0) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }

    const hashedPassword = hashPassword(password);

    // Insere no Banco (MySQL não suporta RETURNING *)
    const [result] = await pool.query(
      'INSERT INTO users (email, username, password, name) VALUES (?, ?, ?, ?)',
      [email, username, hashedPassword, username]
    );

    const userId = result.insertId;

    // Gera o Token
    const token = jwt.sign({ id: userId }, jwtSecret, { expiresIn: jwtExpiresIn });

    res.json({
      message: 'Conta criada com sucesso!',
      token,
      user: {
        id: userId,
        name: username,
        email: email,
        username: username
      }
    });

  } catch (err) {
    console.error('Erro no Registro:', err.message);
    res.status(500).json({ error: 'Erro no servidor ao criar conta.' });
  }
});

// 2. LOGIN (ENTRAR)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Preencha e-mail e senha.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }

    // Busca usuário no MySQL
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(400).json({ error: 'Credenciais inválidas.' });
    }

    const user = users[0];

    // Verifica senha com o novo hash scrypt
    const validPassword = comparePassword(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Credenciais inválidas.' });
    }

    // Gera Token
    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: jwtExpiresIn });

    res.json({
      message: 'Login realizado!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username
      }
    });

  } catch (err) {
    console.error('Erro no Login:', err.message);
    res.status(500).json({ error: 'Erro no servidor ao fazer login.' });
  }
});

module.exports = router;