const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const db = require('../services/database');
const queueManager = require('../services/queueManager');
const videoProcessor = require('../services/videoProcessor');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(process.env.UPLOAD_PATH, 'videos')),
  filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname)}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['video/mp4', 'video/x-matroska', 'video/webm', 'video/avi'];
    cb(allowed.includes(file.mimetype) ? null : new Error('Formato de vídeo não suportado'), true);
  }
});

router.post('/admin/upload', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum vídeo enviado' });

  const uuid = path.basename(req.file.filename, path.extname(req.file.filename));

  try {
    const validation = await videoProcessor.validateVideo(req.file.path);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Vídeo inválido', details: validation.errors });
    }

    const result = await db.execute(
      `INSERT INTO videos (uuid, filename, original_name, duration, file_size, resolution, codec, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'processing')`,
      [
        uuid,
        req.file.filename,
        req.file.originalname,
        validation.metadata.duration,
        validation.metadata.fileSize,
        validation.metadata.resolution,
        validation.metadata.codec
      ]
    );

    const videoId = result.insertId;
    await queueManager.addVideoToProcessing(videoId, { originalName: req.file.originalname });

    return res.json({ success: true, videoId, uuid, status: 'processing' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao processar upload', details: error.message });
  }
});

module.exports = router;
