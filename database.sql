CREATE TABLE candidates (
    id VARCHAR(5) PRIMARY KEY,  -- 5-digit unique ID as a string
    username VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL
);

CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL
);

INSERT INTO admins (username, password) VALUES ('admin', '$2b$10$CgsSbkZbIk4LRa.EYS1uv.eWparb1L4XJyZyVUsb3UyPbpQk2i6T2');

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    options TEXT NOT NULL,  -- JSON formatted string
    answer VARCHAR(255) NOT NULL
);

CREATE TABLE results (
    id SERIAL PRIMARY KEY,
    candidate_id VARCHAR(5) REFERENCES candidates(id) ON DELETE CASCADE,  -- Ensures cascade delete
    score INT NOT NULL,
    total INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

