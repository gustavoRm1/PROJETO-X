const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const xss = require('xss');

// Config do Multer para Imagens de Perfil
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'public/uploads/profiles';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `temp-${Date.now()}-${Math.round(Math.random() * 1E9)}`);
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// 1. GET /profile (Dados + Stats)
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        
        const userData = await pool.query(`
            SELECT 
                u.name, u.username, u.bio, u.avatar_url, u.cover_url, u.is_vip, u.is_verified,
                (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as videos_count,
                (SELECT COALESCE(SUM(views), 0) FROM posts WHERE user_id = u.id) as total_views
            FROM users u
            WHERE u.id = $1
        `, [userId]);

        if (userData.rows.length === 0) return res.status(404).json({ error: 'Perfil não encontrado' });

        res.json(userData.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao carregar perfil' });
    }
});

// 2. PUT /profile/edit (Edição com Sharp e XSS)
router.put('/edit', upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const userId = req.user.id;
        const { name, bio } = req.body;
        
        let updateFields = [];
        let values = [];
        let idx = 1;

        if (name) { updateFields.push(`name = $${idx++}`); values.push(xss(name)); }
        if (bio) { updateFields.push(`bio = $${idx++}`); values.push(xss(bio)); }

        if (req.files) {
            if (req.files.avatar) {
                const filename = `avatar-${userId}-${Date.now()}.webp`;
                await sharp(req.files.avatar[0].path)
                    .resize(200, 200).webp({ quality: 80 })
                    .toFile(`public/uploads/profiles/${filename}`);
                
                updateFields.push(`avatar_url = $${idx++}`);
                values.push(`/uploads/profiles/${filename}`);
                fs.unlinkSync(req.files.avatar[0].path);
            }
            if (req.files.cover) {
                const filename = `cover-${userId}-${Date.now()}.webp`;
                await sharp(req.files.cover[0].path)
                    .resize(1200, 400).webp({ quality: 85 })
                    .toFile(`public/uploads/profiles/${filename}`);
                
                updateFields.push(`cover_url = $${idx++}`);
                values.push(`/uploads/profiles/${filename}`);
                fs.unlinkSync(req.files.cover[0].path);
            }
        }

        if (updateFields.length > 0) {
            values.push(userId);
            await client.query(
                `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${idx}`,
                values
            );
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Perfil atualizado!' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar perfil' });
    } finally {
        client.release();
    }
});

// 3. GET /profile/feed/:tab (Lógica das Abas)
router.get('/feed/:tab', async (req, res) => {
    try {
        const { tab } = req.params;
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;

        let query = '';
        let params = [limit, offset];

        if (tab === 'videos') {
            query = `SELECT id, title, thumbnail_url, views, duration, created_at FROM posts WHERE user_id = $3 ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
            params.push(userId);
        } else if (tab === 'favoritos') {
            query = `SELECT p.id, p.title, p.thumbnail_url, p.views, p.duration FROM posts p JOIN favorites f ON f.video_id = p.id WHERE f.user_id = $3 ORDER BY f.created_at DESC LIMIT $1 OFFSET $2`;
            params.push(userId);
        } else if (tab === 'historico') {
            query = `SELECT p.id, p.title, p.thumbnail_url, p.views, p.duration FROM posts p JOIN watch_history w ON w.video_id = p.id WHERE w.user_id = $3 ORDER BY w.watched_at DESC LIMIT $1 OFFSET $2`;
            params.push(userId);
        } else if (tab === 'vip') {
            if (!req.user.is_vip) return res.status(403).json({ error: 'Área exclusiva para VIPs' });
            query = `SELECT id, title, thumbnail_url, views, duration FROM posts WHERE is_vip_only = true LIMIT $1 OFFSET $2`;
        } else {
            return res.status(400).json({ error: 'Aba inválida' });
        }

        const result = await pool.query(query, params);
        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao carregar feed' });
    }
});

module.exports = router;
