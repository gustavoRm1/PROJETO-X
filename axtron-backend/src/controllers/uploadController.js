const { Queue } = require('bullmq');
const redisConfig = require('../config/redisConfig');
const db = require('../config/database');

// Fila de processamento de vídeo
const videoQueue = new Queue('video-processing', { connection: redisConfig });

exports.uploadVideoAi = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum vídeo enviado.' });

    const userId = req.user.id;
    const filePath = req.file.path;

    try {
        const insertQuery = `
            INSERT INTO videos (author_id, status, created_at) 
            VALUES ($1, 'processing', NOW()) RETURNING id
        `;
        const { rows } = await db.query(insertQuery, [userId]);
        const videoId = rows[0].id;

        await videoQueue.add('process-ai-video', {
            videoId,
            userId,
            filePath,
            originalName: req.file.originalname
        });

        res.status(202).json({ 
            message: 'Upload recebido! Nossa IA está processando seu vídeo.',
            videoId
        });

    } catch (error) {
        console.error('Erro ao enfileirar vídeo:', error);
        res.status(500).json({ error: 'Erro ao iniciar processamento.' });
    }
};
