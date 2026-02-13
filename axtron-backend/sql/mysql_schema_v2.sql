-- DESEJOSHOT SEO ENGINE v2 (core)
CREATE TABLE IF NOT EXISTS videos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  duration INT UNSIGNED,
  file_size BIGINT UNSIGNED,
  resolution VARCHAR(20),
  codec VARCHAR(50),
  slug VARCHAR(255) UNIQUE,
  category_id INT UNSIGNED,
  is_premium BOOLEAN DEFAULT 0,
  thumbnail_best VARCHAR(255),
  thumbnail_frames JSON,
  status ENUM('uploading','processing','ai_analyzing','ready','failed') DEFAULT 'uploading',
  processed_at TIMESTAMP NULL,
  views BIGINT UNSIGNED DEFAULT 0,
  likes INT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_category (category_id),
  INDEX idx_created (created_at),
  INDEX idx_views (views)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS video_content (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  video_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  meta_description VARCHAR(320),
  description_long TEXT,
  tags JSON,
  transcription TEXT,
  ai_summary TEXT,
  schema_json JSON,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  FULLTEXT KEY ft_search (title, description_long, transcription)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS video_translations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  video_id BIGINT UNSIGNED NOT NULL,
  locale VARCHAR(5) NOT NULL,
  title VARCHAR(200) NOT NULL,
  meta_description VARCHAR(320),
  description_long TEXT,
  tags JSON,
  slug VARCHAR(255) NOT NULL,
  hreflang_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  UNIQUE KEY unique_video_locale (video_id, locale),
  INDEX idx_locale (locale),
  FULLTEXT KEY ft_translated (title, description_long)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  parent_id INT UNSIGNED NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(50),
  level TINYINT UNSIGNED DEFAULT 0,
  path VARCHAR(500),
  video_count INT UNSIGNED DEFAULT 0,
  priority DECIMAL(2,1) DEFAULT 0.5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_parent (parent_id),
  INDEX idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS processing_queue (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  video_id BIGINT UNSIGNED NOT NULL,
  task_type ENUM('thumbnail','ai_metadata','translation','transcription','article_gen') NOT NULL,
  priority TINYINT UNSIGNED DEFAULT 5,
  status ENUM('pending','processing','completed','failed') DEFAULT 'pending',
  attempts TINYINT UNSIGNED DEFAULT 0,
  max_attempts TINYINT UNSIGNED DEFAULT 3,
  error_message TEXT NULL,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  INDEX idx_status_priority (status, priority),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sitemap_urls (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  url VARCHAR(500) NOT NULL,
  locale VARCHAR(5) DEFAULT 'pt',
  priority DECIMAL(2,1) DEFAULT 0.5,
  changefreq ENUM('always','hourly','daily','weekly','monthly') DEFAULT 'weekly',
  lastmod TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  url_type ENUM('video','category','article','static') NOT NULL,
  reference_id BIGINT UNSIGNED,
  is_active BOOLEAN DEFAULT 1,
  INDEX idx_locale (locale),
  INDEX idx_type (url_type),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
