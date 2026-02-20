const { Worker } = require('bullmq');
const ffmpeg = require('fluent-ffmpeg');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const pool = require('./db');
const redisConfig = require('./redisConfig');
const fs = require('fs');
const path = require('path');

// Configuração da IA
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'SUA_CHAVE_AQUI');

console.log("👷 Worker de Vídeo Iniciado!");

const worker = new Worker('video-processing', async (job) => {
    const { videoId, filePath, userId } = job.data;
    console.log(`[Job ${job.id}] Processando Vídeo ID: ${videoId}`);

    const finalDir = 'public/uploads/videos';
    const thumbDir = 'public/uploads/thumbs';
    
    if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true });
    if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

    const finalVideoName = `vid-${videoId}.mp4`;
    const thumbName = `thumb-${videoId}.jpg`;
    const finalVideoPath = path.join(finalDir, finalVideoName);
    const finalThumbPath = path.join(thumbDir, thumbName);

    try {
        await new Promise((resolve, reject) => {
            ffmpeg(filePath)
                .screenshots({
                    count: 1,
                    folder: thumbDir,
                    filename: thumbName,
                    size: '640x360'
                })
                .on('end', resolve)
                .on('error', reject);
        });

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const imageBuffer = fs.readFileSync(finalThumbPath);
        
        const prompt = "Analise esta imagem (thumbnail de video). Gere um JSON com: title (max 60 chars, clickbait), category (uma palavra), e tags (array de strings).";
        
        let aiData = { title: `Vídeo Novo #${videoId}`, category: 'Geral', tags: ['novo', 'video'] };
        
        if (process.env.GEMINI_API_KEY) {
            try {
                const result = await model.generateContent([
                    prompt,
                    { inlineData: { data: imageBuffer.toString("base64"), mimeType: "image/jpeg" } }
                ]);
                const text = result.response.text().replace(/```json|```/g, '').trim();
                aiData = JSON.parse(text);
            } catch (e) {
                console.error("Erro na IA (usando fallback):", e.message);
            }
        }

        fs.renameSync(filePath, finalVideoPath);

        await pool.query(`
            UPDATE posts SET 
                title = $1, 
                video_url = $2, 
                thumbnail_url = $3, 
                status = 'published',
                category = $4,
                tags = $5,
                duration = 'HD'
            WHERE id = $6
        `, [
            aiData.title || 'Vídeo Sem Título',
            `/uploads/videos/${finalVideoName}`,
            `/uploads/thumbs/${thumbName}`,
            aiData.category || 'Geral',
            aiData.tags || [],
            videoId
        ]);

        console.log(`✅ Vídeo ${videoId} publicado!`);

    } catch (err) {
        console.error(`❌ Falha no job ${job.id}:`, err);
        await pool.query("UPDATE posts SET status = 'failed' WHERE id = $1", [videoId]);
    }
}, { connection: redisConfig.connection });
