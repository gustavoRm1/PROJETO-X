const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/auth');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ROTA: REGISTRAR (CRIAR CONTA)
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // 1. Validação Básica
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Preencha todos os campos!' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ error: 'A senha deve ter ao menos 8 caracteres.' });
    }

    // 2. Verifica se usuário já existe
    const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }

    // 3. Criptografa a senha (Segurança)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Insere no Banco
    const newUser = await pool.query(
      'INSERT INTO users (email, username, password, name) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, username, hashedPassword, username]
    );

    // 5. Gera o Token (Login automático)
    const token = jwt.sign({ id: newUser.rows[0].id }, jwtSecret, { expiresIn: jwtExpiresIn });

    // 6. Retorna sucesso
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

// ROTA: LOGIN (ENTRAR)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Preencha e-mail e senha.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }

    // 1. Busca usuário
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Credenciais inválidas.' });
    }

    // 2. Verifica senha
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Credenciais inválidas.' });
    }

    // 3. Gera Token
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
