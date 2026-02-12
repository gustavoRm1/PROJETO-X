const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../models/db');
const auth = require('../middleware/authMiddleware');

const router = express.Router();
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (_, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g,'_'))
});
const upload = multer({ storage });

// Helpers God Engine
function interestScore(tags, interests){
  let score = 0;
  (tags||[]).forEach(t=>{ if(interests[t]) score += interests[t]; });
  if(tags?.length) score = Math.min(score / tags.length, 1);
  return score;
}
function watchScore(p){ return Math.min((p.avg_watch_time || p.avgWatchTime || 0) / (p.duration || 1), 1); }
function desireScore(p){ return (p.like_rate||0)*0.4 + (p.comment_rate||0)*0.3 + (p.unlock_rate||0)*0.3; }
function noveltyScore(p){ return p.freshness ?? 0.5; }
function premiumScore(p, user){ if(!p.premium) return 0; return user.premium ? 0.4 : 1; }
function energyCognitive(p, user){
  const v = {
    explicitness: p.explicitness ?? p.videoState?.explicitness ?? 0.5,
    dominance: p.dominance ?? p.videoState?.dominance ?? 0.5,
    novelty: p.novelty ?? p.videoState?.novelty ?? p.freshness ?? 0.5
  };
  const desire = user.desire ?? user.interests?.bdsm ?? 0.5;
  const dominance = user.dominance ?? user.interests?.voyeur ?? 0.5;
  const curiosity = user.curiosity ?? user.arousalLevel ?? 0.5;
  const e = Math.abs(desire - v.explicitness) + Math.abs(curiosity - v.novelty) + Math.abs(dominance - v.dominance);
  return Math.max(0, 1 - Math.min(e/3,1));
}
function diversityPenalty(p, history){ if(history?.includes(p.creator || p.user_id)) return 0.9; return 1; }
function applyFatigue(p, user){ if(user.lastInteractions?.includes(p.creator || p.user_id)) return 0.85; return 1; }
function betaSample(a,b){ const x=-Math.log(Math.random())/a; const y=-Math.log(Math.random())/b; return x/(x+y); }

function scorePost(p, user){
  const i = interestScore(p.tags || p.tags_arr, user.interests);
  let ps = premiumScore(p, user);
  if(user.arousalLevel > 0.7 && !user.premium && p.premium) ps *= 1.3;
  let score = i*0.35 + watchScore(p)*0.25 + desireScore(p)*0.20 + noveltyScore(p)*0.10 + ps*0.10;
  score *= applyFatigue(p, user);
  const energy = energyCognitive(p, user);
  const diversity = diversityPenalty(p, user.lastInteractions || []);
  const finalScore = (score * 0.6 + energy * 0.4) * diversity;
  return { finalScore, baseScore: score, energyScore: energy };
}

function rankPosts(posts, user){
  const scored = posts.map(p=>{
    const { finalScore, baseScore, energyScore } = scorePost(p, user);
    return { ...p, finalScore, baseScore, energyScore, sample: betaSample((p.success||1)+1, (p.fail||1)+1) };
  });
  scored.sort((a,b)=> b.finalScore - a.finalScore);
  const rate = 0.12;
  const cut = Math.max(1, Math.floor(scored.length * rate));
  const head = scored.slice(0, scored.length - cut);
  const tail = scored.slice(scored.length - cut).sort(()=>Math.random()-0.5);
  return [...head, ...tail];
}

function parseTags(row){
  if(Array.isArray(row.tags)) return row.tags;
  if(typeof row.tags === 'string') return row.tags.replace(/[{}]/g,'').split(',').filter(Boolean);
  return [];
}

router.get('/feed', async (req, res) => {
  const user = req.user || { interests:{bdsm:0.6,feet:0.3,voyeur:0.4,luxo:0.5}, premium:false, lastInteractions:[] };
  try {
    const result = await db.query(`SELECT p.*, u.username as creator_name FROM posts p JOIN users u ON u.id = p.user_id ORDER BY created_at DESC`);
    const posts = result.rows.map(r=>({
      ...r,
      creator: r.creator_name,
      tags_arr: parseTags(r),
      videoState: {
        explicitness: r.explicitness,
        dominance: r.dominance,
        novelty: r.novelty,
        intimacy: r.intimacy,
        frustration: r.frustration
      }
    }));
    const ranked = rankPosts(posts, user);
    res.json(ranked);
  } catch (err){
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await db.query(`SELECT p.*, u.username as creator_name FROM posts p JOIN users u ON u.id = p.user_id ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err){
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, upload.single('video'), async (req, res) => {
  const filePath = req.file ? `/uploads/${req.file.filename}` : req.body.video;
  const { description, premium, tags } = req.body;
  if (!filePath) return res.status(400).json({ error: 'Video obrigatório' });
  try {
    const insert = await db.query(
      `INSERT INTO posts (user_id, video, description, premium, tags) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, filePath, description || '', premium ? true : false, tags || null]
    );
    res.json(insert.rows[0]);
  } catch (err){
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    await db.query('INSERT INTO likes (post_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err){
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
