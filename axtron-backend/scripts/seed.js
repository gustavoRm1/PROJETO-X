require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true'
});

async function seed(){
  try {
    await pool.query('BEGIN');
    await pool.query('TRUNCATE likes, comments, posts, users, interactions, gamification RESTART IDENTITY CASCADE');

    const users = await pool.query(`
      INSERT INTO users (username, password, premium, xp, streak, arousal_level)
      VALUES 
      ('eva', crypt('123', gen_salt('bf')), false, 0, 5, 0.65),
      ('mia', crypt('123', gen_salt('bf')), true, 200, 7, 0.70),
      ('luna', crypt('123', gen_salt('bf')), false, 150, 3, 0.55)
      RETURNING *;
    `);

    await pool.query(`
      INSERT INTO posts (
        user_id, title, tags, premium, duration, video, explicitness, dominance, novelty, intimacy, frustration,
        avg_watch_time, like_rate, comment_rate, unlock_rate, freshness, success, fail
      ) VALUES
      ($1, 'BDSM Dominance', ARRAY['bdsm','dominance'], true, 24, 'https://www.w3schools.com/html/mov_bbb.mp4', 0.86, 0.74, 0.62, 0.60, 0.82, 18, 0.62, 0.31, 0.44, 0.82, 38, 12),
      ($2, 'Foot Play Fun', ARRAY['feet','play'], false, 30, 'https://www.w3schools.com/html/mov_bbb.mp4', 0.55, 0.44, 0.82, 0.40, 0.20, 24, 0.71, 0.18, 0, 0.91, 110, 30);
    `, [users.rows[1].id, users.rows[2].id]);

    await pool.query('COMMIT');
    console.log('Seed completed ✅');
    process.exit(0);
  } catch (err){
    await pool.query('ROLLBACK');
    console.error(err);
    process.exit(1);
  }
}

seed();
