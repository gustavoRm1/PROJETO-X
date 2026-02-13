const { Pool } = require('pg');

// Configura pool lendo variáveis do ambiente (docker-compose/.env)
const pool = new Pool({
  user: process.env.POSTGRES_USER || process.env.DB_USER || 'user',
  host: process.env.DB_HOST || 'postgres',
  database: process.env.POSTGRES_DB || process.env.DB_NAME || 'axtron',
  password: process.env.POSTGRES_PASSWORD || process.env.DB_PASS || 'password',
  port: parseInt(process.env.DB_PORT || process.env.POSTGRES_PORT || '5432', 10),
});

// Teste de conexão
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erro fatal ao conectar no Banco:', err.stack);
    return;
  }
  client.query('SELECT NOW()', (queryErr, result) => {
    release();
    if (queryErr) {
      console.error('❌ Erro ao executar query:', queryErr.stack);
    } else {
      console.log('✅ CONEXÃO COM BANCO REALIZADA COM SUCESSO:', result.rows[0]);
    }
  });
});

module.exports = pool;
