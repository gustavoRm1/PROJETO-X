CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email TEXT,
    password TEXT NOT NULL,
    premium BOOLEAN DEFAULT FALSE,
    xp INT DEFAULT 0,
    streak INT DEFAULT 0,
    arousal_level FLOAT DEFAULT 0.5,
    last_login TIMESTAMP DEFAULT NOW()
);

-- Posts
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    title TEXT,
    tags TEXT[],
    premium BOOLEAN DEFAULT FALSE,
    duration INT,
    video TEXT,
    explicitness FLOAT,
    dominance FLOAT,
    novelty FLOAT,
    intimacy FLOAT,
    frustration FLOAT,
    avg_watch_time FLOAT,
    like_rate FLOAT,
    comment_rate FLOAT,
    unlock_rate FLOAT,
    freshness FLOAT,
    success INT DEFAULT 0,
    fail INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INT REFERENCES posts(id),
    user_id INT REFERENCES users(id),
    text TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Likes
CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    post_id INT REFERENCES posts(id),
    user_id INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Interactions (Feed history)
CREATE TABLE IF NOT EXISTS interactions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    post_id INT REFERENCES posts(id),
    watched_percent FLOAT,
    liked BOOLEAN,
    commented BOOLEAN,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Gamification history
CREATE TABLE IF NOT EXISTS gamification (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    xp_gained INT,
    streak INT,
    reward TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);
