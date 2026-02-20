// Configuração centralizada do Redis para BullMQ e Cache
module.exports = {
  connection: {
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379
  }
};
