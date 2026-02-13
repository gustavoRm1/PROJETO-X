const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_key_in_production';

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function compareScrypt(password, stored) {
  if (!stored || !stored.startsWith('scrypt:')) return false;
  const [, salt, hash] = stored.split(':');
  const generated = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(generated, 'hex'), Buffer.from(hash, 'hex'));
}

async function login(username, password) {
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS_HASH = process.env.ADMIN_PASS_HASH;

  if (!ADMIN_PASS_HASH) {
    throw new Error('ADMIN_PASS_HASH não configurado');
  }

  if (username !== ADMIN_USER || !compareScrypt(password, ADMIN_PASS_HASH)) {
    throw new Error('Credenciais inválidas');
  }

  const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
  return { token };
}

module.exports = { authenticate, login };
