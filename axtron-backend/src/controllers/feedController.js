const db = require('../config/database');

exports.getProfileFeed = async (req, res) => {
    const { tab } = req.params;
    const userId = req.user.id;
    const isVipUser = req.user.is_vip;
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const offset = (page - 1) * limit;

    let query = '';
    let params = [];

    try {
        switch (tab) {
            case 'videos':
                query = `
                    SELECT id, title, thumbnail_url, views, duration, created_at 
                    FROM videos 
                    WHERE author_id = $1 AND status = 'published'
                    ORDER BY created_at DESC 
                    LIMIT $2 OFFSET $3
                `;
                params = [userId, limit, offset];
                break;

            case 'favoritos':
                query = `
                    SELECT v.id, v.title, v.thumbnail_url, v.views, v.duration, v.created_at
                    FROM videos v
                    INNER JOIN favorites f ON f.video_id = v.id
                    WHERE f.user_id = $1
                    ORDER BY f.created_at DESC
                    LIMIT $2 OFFSET $3
                `;
                params = [userId, limit, offset];
                break;

            case 'historico':
                query = `
                    SELECT DISTINCT ON (wh.video_id) v.id, v.title, v.thumbnail_url, v.views, v.duration, wh.watched_at
                    FROM watch_history wh
                    INNER JOIN videos v ON wh.video_id = v.id
                    WHERE wh.user_id = $1
                    ORDER BY wh.video_id, wh.watched_at DESC
                    LIMIT $2 OFFSET $3
                `;
                params = [userId, limit, offset];
                break;

            case 'vip':
                if (!isVipUser) {
                    return res.status(403).json({ 
                        error: 'Conteúdo exclusivo', 
                        redirect: '/upgrade',
                        message: 'Torne-se VIP para acessar esta área.'
                    });
                }
                query = `
                    SELECT id, title, thumbnail_url, views, duration 
                    FROM videos 
                    WHERE is_vip_only = true
                    ORDER BY created_at DESC 
                    LIMIT $1 OFFSET $2
                `;
                params = [limit, offset];
                break;

            default:
                return res.status(400).json({ error: 'Aba inválida' });
        }

        const { rows } = await db.query(query, params);
        
        res.json({
            data: rows,
            page,
            hasMore: rows.length === limit
        });

    } catch (error) {
        console.error('Erro no feed:', error);
        res.status(500).json({ error: 'Erro ao carregar feed' });
    }
};
