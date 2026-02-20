// Simple Redis client wrapper with graceful fallback
let client;

try {
  const { createClient } = require('redis');
  const url = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;
  client = createClient({ url });
  client.connect().catch((err) => console.warn('Redis connect error (fallback to noop):', err.message));
} catch (err) {
  console.warn('Redis package not available, using noop client');
}

const noopClient = {
  async get() { return null; },
  async setEx() { return null; },
  async del() { return null; },
};

module.exports = client || noopClient;
