CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_a BIGINT NOT NULL,
    user_b BIGINT NOT NULL,
    FOREIGN KEY (user_a) REFERENCES users(id),
    FOREIGN KEY (user_b) REFERENCES users(id),
    UNIQUE(user_a, user_b),
    CHECK (user_a != user_b)
);