const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'desejoshot',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function execute(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

module.exports = { pool, execute, query };
