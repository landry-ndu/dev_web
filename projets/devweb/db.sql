-- Base de donnees GameBizarre
-- Import : mysql -u <user> -p < db.sql  (ou phpMyAdmin)

CREATE DATABASE IF NOT EXISTS gamebizarre
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE gamebizarre;

-- ------------------------------------------------------------
--  users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    email      VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,                       -- hash bcrypt
    role       ENUM('user','journalist','admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
--  profiles  (1-1 avec users)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    user_id    INT PRIMARY KEY,
    bio        TEXT,
    photo      VARCHAR(500),
    visibility ENUM('public','private') DEFAULT 'public',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
--  friend_requests  (demandes en attente)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS friend_requests (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    from_user_id INT NOT NULL,
    to_user_id   INT NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_req (from_user_id, to_user_id),
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id)   REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
--  friends  (relation acceptée, stockée 1 ligne par paire)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS friends (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_a_id  INT NOT NULL,
    user_b_id  INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_pair (user_a_id, user_b_id),
    FOREIGN KEY (user_a_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_b_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
--  messages  (conversations 1-to-1, pas de table conversation
--             séparée : on regroupe par paire d'utilisateurs)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    from_user_id INT NOT NULL,
    to_user_id   INT NOT NULL,
    content     TEXT NOT NULL,
    is_read     TINYINT(1) DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id)   REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_pair (from_user_id, to_user_id),
    INDEX idx_to_read (to_user_id, is_read)
);

-- ------------------------------------------------------------
--  game_lists  (Letterbox : joué / en cours / envie / suivi)
--  game_id = id RAWG du jeu
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS game_lists (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    user_id   INT NOT NULL,
    game_id   INT NOT NULL,
    game_slug VARCHAR(200),
    game_name VARCHAR(255),
    status    ENUM('played','playing','want','followed') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_game_status (user_id, game_id, status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
);

-- ------------------------------------------------------------
--  ratings  (note /5 d'un user sur un jeu)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ratings (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    game_id INT NOT NULL,
    value   TINYINT NOT NULL,                               -- 1..5
    UNIQUE KEY uniq_user_game (user_id, game_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
--  reviews  (avis texte d'un user sur un jeu)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    game_id    INT NOT NULL,
    rating     TINYINT NOT NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_game_review (user_id, game_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
--  articles  (actus communautaires publiées par les journalistes)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS articles (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    author_id  INT NOT NULL,
    title      VARCHAR(255) NOT NULL,
    category   VARCHAR(50)  DEFAULT 'News',
    content    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
--  article_likes  (likes sur les articles communautaires)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS article_likes (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL,
    user_id    INT NOT NULL,
    UNIQUE KEY uniq_like (article_id, user_id),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
);

-- ------------------------------------------------------------
--  article_comments  (commentaires sur les articles)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS article_comments (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL,
    user_id    INT NOT NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
);

-- Compte admin par defaut (identifiant : admin / mot de passe : admin123)
INSERT INTO users (username, email, password, role)
VALUES (
  'admin',
  'admin@gamebizarre.local',
  '$2y$10$abcdefghijklmnopqrstuuW9Xp0t5z4r6F8q2hY3kL1mN0oP9qR2',
  'admin'
)
ON DUPLICATE KEY UPDATE username = username;
