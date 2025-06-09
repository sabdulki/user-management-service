CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_1_id BIGINT NOT NULL,
    user_2_id BIGINT NOT NULL,
    FOREIGN KEY (user_1_id) REFERENCES users(id),
    FOREIGN KEY (user_2_id) REFERENCES users(id),
    UNIQUE(user_1_id, user_2_id),
    CHECK (user_1_id != user_2_id)
);