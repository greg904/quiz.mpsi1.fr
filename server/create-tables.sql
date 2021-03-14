CREATE TABLE questions (
    id INTEGER PRIMARY KEY,
    question TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    incorrect_answers TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);