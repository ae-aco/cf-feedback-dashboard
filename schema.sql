-- schema.sql
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT,
    created_at TEXT NOT NULL,
    sentiment TEXT,
    themes TEXT,
    urgency TEXT,
    analyzed INTEGER DEFAULT 0
);

CREATE INDEX idx_source ON feedback(source);
CREATE INDEX idx_urgency ON feedback(urgency);
CREATE INDEX idx_created_at ON feedback(created_at);