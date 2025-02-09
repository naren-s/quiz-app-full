CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL
);

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    options TEXT NOT NULL,  -- JSON formatted string
    answer VARCHAR(255) NOT NULL
);

CREATE TABLE results (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) REFERENCES candidates(username) ON DELETE CASCADE,
    score INT NOT NULL,
    total INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
