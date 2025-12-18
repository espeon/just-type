ALTER TABLE users
ADD COLUMN username TEXT UNIQUE,
ADD COLUMN display_name TEXT,
ADD COLUMN avatar_url TEXT;

CREATE INDEX idx_users_username ON users(username) WHERE username IS NOT NULL;
