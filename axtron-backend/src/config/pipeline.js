const required = [
  'GEMINI_API_KEY',
  'DB_HOST',
  'DB_USER',
  'DB_PASS',
  'DB_NAME',
  'REDIS_HOST',
  'REDIS_PORT',
  'UPLOAD_PATH',
  'THUMB_PATH',
  'TEMP_PATH',
  'SITE_URL'
];

const missing = required.filter((key) => !process.env[key]);

module.exports = {
  missing,
  supportedLocales: (process.env.SUPPORTED_LOCALES || 'pt,en,es,fr,de,it,ru,ja,ar,hi').split(',').map((v) => v.trim()),
  maxConcurrentJobs: Number(process.env.MAX_CONCURRENT_JOBS || 3),
  batchSize: Number(process.env.BATCH_SIZE || 10)
};
