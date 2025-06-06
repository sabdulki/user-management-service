CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT UNIQUE,
  email TEXT UNIQUE,
  password TEXT,
  avatar TEXT,
  provider INTEGER NOT NULL DEFAULT 0,
  removed_at INTEGER DEFAULT null
)