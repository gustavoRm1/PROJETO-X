const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIProcessor {
  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  parseJSON(text) {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  }

  async generateSEOMetadata(frameDescription, context = {}) {
    const prompt = `Gere JSON SEO para vídeo adulto sugestivo e seguro para ads. Contexto: ${JSON.stringify(context)}. Frame: ${frameDescription}.`;
    const result = await this.model.generateContent(prompt);
    return this.parseJSON(result.response.text());
  }

  async translateMetadata(metadata, locales) {
    const prompt = `Traduza para ${locales.join(',')} e retorne JSON puro: ${JSON.stringify(metadata)}`;
    const result = await this.model.generateContent(prompt);
    return this.parseJSON(result.response.text());
  }

  generateSchemaJSON(video, metadata) {
    return {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: metadata.title,
      description: metadata.metaDescription,
      thumbnailUrl: `${process.env.SITE_URL}/thumbs/${video.thumbnail_best}`,
      uploadDate: new Date(video.created_at).toISOString(),
      contentUrl: `${process.env.SITE_URL}/video/${video.slug}`,
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'http://schema.org/WatchAction',
        userInteractionCount: video.views || 0
      },
      isFamilyFriendly: false,
      contentRating: 'adult'
    };
  }
}

module.exports = new AIProcessor();
