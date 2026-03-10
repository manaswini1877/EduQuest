const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- AUTH API ---

app.post('/api/register', (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    if (role !== 'student' && role !== 'teacher') {
        return res.status(400).json({ error: "Invalid role" });
    }

    db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        [username, password, role],
        function (err) {
            if (err) {
                if (err.message.includes("UNIQUE constraint failed")) {
                    return res.status(409).json({ error: "Username already exists" });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: "User created successfully", id: this.lastID, role });
        }
    );
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT id, username, role FROM users WHERE username = ? AND password = ?",
        [username, password],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(401).json({ error: "Invalid credentials" });

            res.json({ message: "Login successful", user: row });
        }
    );
});

// --- SUBJECTS & SECTIONS API ---

app.get('/api/subjects', (req, res) => {
    db.all("SELECT * FROM subjects ORDER BY id ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/subjects/:subjectId/sections', (req, res) => {
    db.all("SELECT * FROM sections WHERE subject_id = ? ORDER BY order_index ASC", [req.params.subjectId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- QUESTIONS API ---

app.get('/api/sections/:sectionId/questions', (req, res) => {
    db.all("SELECT * FROM questions WHERE section_id = ?", [req.params.sectionId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/questions', (req, res) => {
    const { section_id, question, option_a, option_b, option_c, option_d, correct_option, teacher_id } = req.body;

    db.run(`INSERT INTO questions 
        (section_id, question, option_a, option_b, option_c, option_d, correct_option, teacher_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [section_id, question, option_a, option_b, option_c, option_d, correct_option, teacher_id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: "Question added successfully", id: this.lastID });
        }
    );
});

// --- SCORES & PROGRESS API ---

app.post('/api/scores', (req, res) => {
    const { user_id, section_id, score, total } = req.body;

    db.run(
        "INSERT INTO scores (user_id, section_id, score, total) VALUES (?, ?, ?, ?)",
        [user_id, section_id, score, total],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Score saved successfully" });
        }
    );
});

// For teacher dashboard to see all student progress
app.get('/api/progress', (req, res) => {
    db.all(`
        SELECT u.username, sub.name as subject_name, sec.name as section_name, s.score, s.total, s.date
        FROM scores s
        JOIN users u ON s.user_id = u.id
        JOIN sections sec ON s.section_id = sec.id
        JOIN subjects sub ON sec.subject_id = sub.id
        WHERE u.role = 'student'
        ORDER BY s.date DESC
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
