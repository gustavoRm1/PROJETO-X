const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const { Queue } = require('bullmq');
const redisConfig = require('../redisConfig');
const fs = require('fs');

// Fila de Processamento
const videoQueue = new Queue('video-processing', { connection: redisConfig.connection });

// Config Multer (Upload Temporário)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'temp_uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `raw-${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// POST /upload/ai
router.post('/ai', upload.single('video'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });

    try {
        const userId = req.user.id;
        
        // 1. Cria registro "Processing" no banco
        const newPost = await pool.query(
            "INSERT INTO posts (user_id, title, video_url, status) VALUES ($1, 'Processando...', 'pending', 'processing') RETURNING id",
            [userId]
        );
        const videoId = newPost.rows[0].id;

        // 2. Envia para o Worker (Background)
        await videoQueue.add('process-ai-video', {
            videoId,
            userId,
            filePath: req.file.path,
            originalName: req.file.originalname
        });

        // 3. Responde rápido
        res.status(202).json({ 
            message: 'Upload iniciado! Nossa IA está analisando seu vídeo.',
            videoId 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno no upload.' });
    }
});

module.exports = router;
