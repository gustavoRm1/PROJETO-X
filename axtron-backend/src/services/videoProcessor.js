const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

function ffprobeAsync(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, data) => (err ? reject(err) : resolve(data)));
  });
}

class VideoProcessor {
  async getVideoMetadata(videoPath) {
    const data = await ffprobeAsync(videoPath);
    const video = data.streams.find((s) => s.codec_type === 'video');
    const audio = data.streams.find((s) => s.codec_type === 'audio');
    return {
      duration: Math.floor(Number(data.format.duration || 0)),
      fileSize: Number(data.format.size || 0),
      resolution: video ? `${video.width}x${video.height}` : null,
      codec: video ? video.codec_name : null,
      hasAudio: Boolean(audio)
    };
  }

  async validateVideo(videoPath) {
    const metadata = await this.getVideoMetadata(videoPath);
    const errors = [];
    if (metadata.duration < 10) errors.push('Vídeo muito curto');
    if (metadata.duration > 3600) errors.push('Vídeo muito longo');
    if (metadata.fileSize > 5 * 1024 * 1024 * 1024) errors.push('Arquivo maior que 5GB');
    return { valid: errors.length === 0, errors, metadata };
  }

  getUploadOutput(uuid, ext = '.mp4') {
    return path.join(process.env.UPLOAD_PATH, 'videos', `${uuid}${ext}`);
  }
}

module.exports = new VideoProcessor();
