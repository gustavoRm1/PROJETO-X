const rateLimit = require('express-rate-limit');

let sharedConfig = {};

try {
  const RedisStore = require('rate-limit-redis');
  const Redis = require('ioredis');
  const redis = new Redis({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT });
  sharedConfig.store = new RedisStore({ sendCommand: (...args) => redis.call(...args) });
} catch (error) {
  sharedConfig = {};
}

const uploadLimiter = rateLimit({
  ...sharedConfig,
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Muitos uploads. Tente novamente em 15 minutos.'
});

const apiLimiter = rateLimit({
  ...sharedConfig,
  windowMs: 60 * 1000,
  max: 100,
  message: 'Muitas requisições. Tente novamente em 1 minuto.'
});

module.exports = { uploadLimiter, apiLimiter };
