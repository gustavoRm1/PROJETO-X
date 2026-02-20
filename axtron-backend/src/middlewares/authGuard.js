const jwt = require('jsonwebtoken');
const db = require('../config/database');
const rateLimit = require('express-rate-limit');

const sensitiveRouteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Muitas tentativas. Tente novamente mais tarde.' }
});

const authGuard = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const query = 'SELECT id, is_vip, status FROM users WHERE id = $1 LIMIT 1';
        const { rows } = await db.query(query, [decoded.id]);

        if (rows.length === 0 || rows[0].status !== 'active') {
            return res.status(403).json({ error: 'Usuário banido ou inexistente.' });
        }

        req.user = { id: rows[0].id, is_vip: rows[0].is_vip };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
};

module.exports = { authGuard, sensitiveRouteLimiter };
