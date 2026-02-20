const { Worker } = require('bullmq');
const ffmpeg = require('fluent-ffmpeg');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/database');
const fs = require('fs');
const redisConfig = require('../config/redisConfig');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const worker = new Worker('video-processing', async (job) => {
    const { videoId, filePath, userId } = job.data;
    console.log(`Processando vídeo ID: ${videoId}...`);

    try {
        const screenshotPath = `./temp/thumb-${videoId}.jpg`;
        
        await new Promise((resolve, reject) => {
            ffmpeg(filePath)
                .screenshots({
                    count: 1,
                    folder: './temp',
                    filename: `thumb-${videoId}.jpg`,
                    size: '1280x720'
                })
                .on('end', resolve)
                .on('error', reject);
        });

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const imageBuffer = fs.readFileSync(screenshotPath);
        
        const prompt = `Analise este frame de vídeo. Gere um título Clickbait (máx 60 chars), 
                        uma descrição otimizada para SEO (máx 200 chars), 
                        uma categoria e 5 tags. Responda APENAS em JSON no formato:
                        {"title": "", "description": "", "category": "", "tags": []}`;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageBuffer.toString('base64'), mimeType: 'image/jpeg' } }
        ]);
        
        const aiResponse = result.response.text();
        const jsonString = aiResponse.replace(/```json|```/g, '').trim();
        const aiData = JSON.parse(jsonString);

        const finalVideoPath = `/uploads/videos/vid-${videoId}.mp4`; 
        const finalThumbPath = `/uploads/thumbs/thumb-${videoId}.jpg`;

        fs.renameSync(filePath, `public${finalVideoPath}`);
        fs.renameSync(screenshotPath, `public${finalThumbPath}`);

        const updateQuery = `
            UPDATE videos SET 
                title = $1, description = $2, tags = $3, category = $4,
                video_url = $5, thumbnail_url = $6, status = 'published'
            WHERE id = $7
        `;

        await db.query(updateQuery, [
            aiData.title, 
            aiData.description, 
            aiData.tags,
            aiData.category,
            finalVideoPath,
            finalThumbPath,
            videoId
        ]);

        console.log(`Vídeo ${videoId} publicado com sucesso pela IA!`);

    } catch (error) {
        console.error(`Falha no job ${job.id}:`, error);
        await db.query('UPDATE videos SET status = \'failed\' WHERE id = $1', [videoId]);
    }
}, { connection: redisConfig });

module.exports = worker;
