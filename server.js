require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});


// 📌 Admin: Add a Candidate (Signup)
app.post('/add-candidate', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO candidates (username, password) VALUES ($1, $2)', [username, hashedPassword]);
        res.status(201).json({ message: "Candidate added successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 📌 Candidate Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await pool.query('SELECT * FROM candidates WHERE username = $1', [username]);
        if (!user.rows.length) return res.status(400).json({ message: "Invalid username or password" });

        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) return res.status(400).json({ message: "Invalid username or password" });

        res.json({ message: "Login successful", username });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 📌 Admin: Add a Question
app.post('/add-question', async (req, res) => {
    const { question, options, answer } = req.body;
    try {
        await pool.query('INSERT INTO questions (question, options, answer) VALUES ($1, $2, $3)', 
            [question, JSON.stringify(options), answer]);
        res.status(201).json({ message: "Question added successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/add-questions', async (req, res) => {
    const questions = req.body; // Expecting an array of questions
    try {
        for (const q of questions) {
            await pool.query(
                'INSERT INTO questions (question, options, answer) VALUES ($1, $2, $3)',
                [q.question, JSON.stringify(q.options), q.answer]
            );
        }
        res.status(201).json({ message: "Questions added successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// 📌 Get All Questions (For Candidates)
app.get('/questions', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, question, options, answer FROM questions'); // ✅ Fetch answer
        res.json(result.rows.map(q => ({
            ...q,
            options: JSON.parse(q.options),
            answer: q.answer.trim() // ✅ Ensure answer is trimmed
        })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// 📌 Admin: Delete a Question
app.delete('/delete-question/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM questions WHERE id = $1', [id]);
        res.json({ message: "Question deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 📌 Admin: Update a Question
app.put('/update-question/:id', async (req, res) => {
    const { id } = req.params;
    const { question, options, answer } = req.body;
    try {
        await pool.query('UPDATE questions SET question = $1, options = $2, answer = $3 WHERE id = $4', 
            [question, JSON.stringify(options), answer, id]);
        res.json({ message: "Question updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 📌 Candidate: Submit Quiz
app.post('/submit-quiz', async (req, res) => {
    const { username, answers } = req.body;
    try {
        const questions = await pool.query('SELECT id, answer FROM questions');
        let score = 0, total = questions.rowCount;

        questions.rows.forEach((q) => {
            let questionId = String(q.id);
            let correctAnswer = q.answer.trim().toLowerCase();
            let userAnswer = answers[questionId] ? answers[questionId].trim().toLowerCase() : "";

            if (userAnswer === correctAnswer) {
                score++;
            }
        });

        await pool.query('INSERT INTO results (username, score, total) VALUES ($1, $2, $3)', 
            [username, score, total]);

        res.json({ score, total });
    } catch (error) {
        console.error("Error submitting quiz:", error);
        res.status(500).json({ message: "Failed to submit quiz" });
    }
});



// 📌 Get All Candidates
app.get('/candidates', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username FROM candidates');
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching candidates:", error);
        res.status(500).json({ message: "Failed to fetch candidates" });
    }
});

// 📌 Delete a Candidate
app.delete('/delete-candidate/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM candidates WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Candidate not found" });
        }
        res.json({ message: "Candidate deleted successfully" });
    } catch (error) {
        console.error("Error deleting candidate:", error);
        res.status(500).json({ message: "Failed to delete candidate" });
    }
});


// 📌 Admin: Get Quiz Results
app.get('/results', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, username, score, total, timestamp
            FROM results
            ORDER BY timestamp DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// 📌 Admin: Delete a Quiz Result
app.delete('/delete-result/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM results WHERE id = $1', [id]);
        res.json({ message: "Result deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 📌 Admin Login
app.post('/admin-login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);

        if (!admin.rows.length) return res.status(400).json({ message: "Invalid username or password" });

        const validPassword = await bcrypt.compare(password, admin.rows[0].password);
        if (!validPassword) return res.status(400).json({ message: "Invalid username or password" });

        res.json({ message: "Login successful", username });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 📌 Admin Logout (Optional)
app.post('/admin-logout', (req, res) => {
    res.json({ message: "Logout successful" });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
