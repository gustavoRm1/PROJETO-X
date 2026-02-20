const sharp = require('sharp');
const xss = require('xss');
const db = require('../config/database');
const path = require('path');
const fs = require('fs/promises');
const redisClient = require('../config/redis');

exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { bio, name } = req.body;
    
    const cleanName = name ? xss(name) : null;
    const cleanBio = bio ? xss(bio) : null;

    let avatarUrl = null;
    let coverUrl = null;

    try {
        if (req.files) {
            if (req.files.avatar) {
                const filename = `avatar-${userId}-${Date.now()}.webp`;
                const outputPath = path.join(__dirname, '../../public/uploads/profiles', filename);
                await sharp(req.files.avatar[0].path)
                    .resize(200, 200)
                    .webp({ quality: 80 })
                    .toFile(outputPath);
                avatarUrl = `/uploads/profiles/${filename}`;
                await fs.unlink(req.files.avatar[0].path);
            }

            if (req.files.cover) {
                const filename = `cover-${userId}-${Date.now()}.webp`;
                const outputPath = path.join(__dirname, '../../public/uploads/profiles', filename);
                await sharp(req.files.cover[0].path)
                    .resize(1200, 400)
                    .webp({ quality: 85 })
                    .toFile(outputPath);
                coverUrl = `/uploads/profiles/${filename}`;
                await fs.unlink(req.files.cover[0].path);
            }
        }

        const fields = [];
        const values = [];
        let index = 1;

        if (cleanName) { fields.push(`name = $${index++}`); values.push(cleanName); }
        if (cleanBio) { fields.push(`bio = $${index++}`); values.push(cleanBio); }
        if (avatarUrl) { fields.push(`avatar_url = $${index++}`); values.push(avatarUrl); }
        if (coverUrl) { fields.push(`cover_url = $${index++}`); values.push(coverUrl); }

        if (fields.length === 0) return res.status(400).json({ error: 'Nenhum dado para atualizar' });

        values.push(userId);
        const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${index}`;

        await db.query(query, values);

        await redisClient.del(`profile_stats:${userId}`);

        res.json({ success: true, avatarUrl, coverUrl });

    } catch (error) {
        console.error('Erro na edição:', error);
        res.status(500).json({ error: 'Falha ao atualizar perfil' });
    }
};
