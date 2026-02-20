const jwt = require('jsonwebtoken');
const pool = require('../db');
const rateLimit = require('express-rate-limit');

const SECRET_KEY = process.env.JWT_SECRET || 'axtron_secret_key_super_segura';

// Middleware de Autenticação
const authGuard = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token não fornecido.' });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        
        const user = await pool.query('SELECT id, is_vip, name FROM users WHERE id = $1', [decoded.id]);
        
        if (user.rows.length === 0) {
            return res.status(403).json({ error: 'Usuário não encontrado.' });
        }

        req.user = user.rows[0];
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido.' });
    }
};

// Rate Limit para Rotas Pesadas (Upload/Edit)
const sensitiveRouteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Muitas tentativas. Aguarde um pouco.' }
});

module.exports = { authGuard, sensitiveRouteLimiter };
