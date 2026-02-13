 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/axtron-backend/routes/auth.js b/axtron-backend/routes/auth.js
index 1dd3e7b5b8509b46d510ce48a2d431a4af1b9cd9..e815ae89b8c4303e8bc19214d1231dbd5445f224 100644
--- a/axtron-backend/routes/auth.js
+++ b/axtron-backend/routes/auth.js
@@ -1,93 +1,109 @@
 const express = require('express');
+const crypto = require('crypto');
 const router = express.Router();
 const pool = require('../db');
-const bcrypt = require('bcryptjs');
 const jwt = require('jsonwebtoken');
+const { jwtSecret, jwtExpiresIn } = require('../config/auth');
 
-const SECRET_KEY = 'axtron_secret_key_super_segura'; // Em produção, use .env
+const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
+
+const hashPassword = (password) => {
+  const salt = crypto.randomBytes(16).toString('hex');
+  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
+  return `scrypt:${salt}:${hash}`;
+};
+
+const comparePassword = (password, storedHash) => {
+  if (!storedHash || !storedHash.startsWith('scrypt:')) return false;
+  const [, salt, originalHash] = storedHash.split(':');
+  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
+  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
+};
 
-// ROTA: REGISTRAR (CRIAR CONTA)
 router.post('/register', async (req, res) => {
   try {
     const { email, username, password } = req.body;
 
-    // 1. Validação Básica
     if (!email || !username || !password) {
       return res.status(400).json({ error: 'Preencha todos os campos!' });
     }
 
-    // 2. Verifica se usuário já existe
+    if (!isValidEmail(email)) {
+      return res.status(400).json({ error: 'E-mail inválido.' });
+    }
+
+    if (String(password).length < 8) {
+      return res.status(400).json({ error: 'A senha deve ter ao menos 8 caracteres.' });
+    }
+
     const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
     if (userExist.rows.length > 0) {
       return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
     }
 
-    // 3. Criptografa a senha (Segurança)
-    const salt = await bcrypt.genSalt(10);
-    const hashedPassword = await bcrypt.hash(password, salt);
+    const hashedPassword = hashPassword(password);
 
-    // 4. Insere no Banco
     const newUser = await pool.query(
       'INSERT INTO users (email, username, password, name) VALUES ($1, $2, $3, $4) RETURNING *',
-      [email, username, hashedPassword, username] // Usamos username como nome inicial
+      [email, username, hashedPassword, username]
     );
 
-    // 5. Gera o Token (Login automático)
-    const token = jwt.sign({ id: newUser.rows[0].id }, SECRET_KEY);
+    const token = jwt.sign({ id: newUser.rows[0].id }, jwtSecret, { expiresIn: jwtExpiresIn });
 
-    // 6. Retorna sucesso
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
-
   } catch (err) {
     console.error(err.message);
     res.status(500).json({ error: 'Erro no servidor ao criar conta.' });
   }
 });
 
-// ROTA: LOGIN (ENTRAR)
 router.post('/login', async (req, res) => {
   try {
     const { email, password } = req.body;
 
-    // 1. Busca usuário
+    if (!email || !password) {
+      return res.status(400).json({ error: 'Preencha e-mail e senha.' });
+    }
+
+    if (!isValidEmail(email)) {
+      return res.status(400).json({ error: 'E-mail inválido.' });
+    }
+
     const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
     if (user.rows.length === 0) {
-      return res.status(400).json({ error: 'Usuário não encontrado.' });
+      return res.status(400).json({ error: 'Credenciais inválidas.' });
     }
 
-    // 2. Verifica senha
-    const validPassword = await bcrypt.compare(password, user.rows[0].password);
+    const validPassword = comparePassword(password, user.rows[0].password);
     if (!validPassword) {
-      return res.status(400).json({ error: 'Senha incorreta.' });
+      return res.status(400).json({ error: 'Credenciais inválidas.' });
     }
 
-    // 3. Gera Token
-    const token = jwt.sign({ id: user.rows[0].id }, SECRET_KEY);
+    const token = jwt.sign({ id: user.rows[0].id }, jwtSecret, { expiresIn: jwtExpiresIn });
 
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
-
   } catch (err) {
     console.error(err.message);
     res.status(500).json({ error: 'Erro no servidor ao fazer login.' });
   }
 });
 
 module.exports = router;
 
EOF
)