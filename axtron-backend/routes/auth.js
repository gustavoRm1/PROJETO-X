const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'axtron_secret_key_super_segura'; // Em produção, use .env

// ROTA: REGISTRAR (CRIAR CONTA)
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // 1. Validação Básica
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Preencha todos os campos!' });
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
      [email, username, hashedPassword, username] // Usamos username como nome inicial
    );

    // 5. Gera o Token (Login automático)
    const token = jwt.sign({ id: newUser.rows[0].id }, SECRET_KEY);

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

    // 1. Busca usuário
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Usuário não encontrado.' });
    }

    // 2. Verifica senha
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Senha incorreta.' });
    }

    // 3. Gera Token
    const token = jwt.sign({ id: user.rows[0].id }, SECRET_KEY);

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
