const db = require('../config/database');
const redisClient = require('../config/redis');

exports.getProfile = async (req, res) => {
    const userId = req.user.id;
    const cacheKey = `profile_stats:${userId}`;

    try {
        const userQuery = `
            SELECT name, username, bio, avatar_url, cover_url, is_vip, is_verified 
            FROM users WHERE id = $1
        `;
        
        let stats = await redisClient.get(cacheKey);

        if (!stats) {
            const [userResult, statsResult] = await Promise.all([
                db.query(userQuery, [userId]),
                db.query(`
                    SELECT 
                        (SELECT COUNT(*) FROM followers WHERE user_id = $1) as followers_count,
                        (SELECT COUNT(*) FROM videos WHERE author_id = $1) as videos_count,
                        (SELECT COALESCE(SUM(views), 0) FROM videos WHERE author_id = $1) as total_views
                `, [userId])
            ]);

            if (userResult.rows.length === 0) return res.status(404).json({ error: 'Perfil não encontrado' });

            const userData = userResult.rows[0];
            const rawStats = statsResult.rows[0];

            stats = rawStats;
            await redisClient.setEx(cacheKey, 300, JSON.stringify(stats));
            return res.json({ ...userData, stats });
        }

        const { rows } = await db.query(userQuery, [userId]);
        if (!rows.length) return res.status(404).json({ error: 'Perfil não encontrado' });
        return res.json({ ...rows[0], stats: JSON.parse(stats) });

    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
