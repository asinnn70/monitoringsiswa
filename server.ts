import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("school.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    parent_name TEXT,
    phone TEXT
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    date TEXT NOT NULL,
    status TEXT NOT NULL, -- present, absent, late, sick
    FOREIGN KEY (student_id) REFERENCES students(id)
  );

  CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    subject TEXT NOT NULL,
    score REAL,
    date TEXT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id)
  );

  CREATE TABLE IF NOT EXISTS behavior (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    type TEXT NOT NULL, -- positive, negative
    description TEXT,
    date TEXT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id)
  );
`);

// Seed data if empty
const studentCount = db.prepare("SELECT COUNT(*) as count FROM students").get() as { count: number };
if (studentCount.count === 0) {
  const insertStudent = db.prepare("INSERT INTO students (name, class, parent_name, phone) VALUES (?, ?, ?, ?)");
  insertStudent.run("Ahmad Fauzi", "10-A", "Budi Santoso", "08123456789");
  insertStudent.run("Siti Aminah", "10-A", "Hasan Basri", "08123456780");
  insertStudent.run("Budi Pratama", "10-B", "Agus Setiawan", "08123456781");
  insertStudent.run("Dewi Lestari", "11-A", "Eko Prasetyo", "08123456782");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/students", (req, res) => {
    const students = db.prepare("SELECT * FROM students").all();
    res.json(students);
  });

  app.get("/api/students/:id", (req, res) => {
    const student = db.prepare("SELECT * FROM students WHERE id = ?").get(req.params.id);
    const attendance = db.prepare("SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC").all(req.params.id);
    const grades = db.prepare("SELECT * FROM grades WHERE student_id = ? ORDER BY date DESC").all(req.params.id);
    const behavior = db.prepare("SELECT * FROM behavior WHERE student_id = ? ORDER BY date DESC").all(req.params.id);
    res.json({ ...student, attendance, grades, behavior });
  });

  app.post("/api/attendance", (req, res) => {
    const { student_id, date, status } = req.body;
    const insert = db.prepare("INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)");
    insert.run(student_id, date, status);
    res.json({ success: true });
  });

  app.post("/api/grades", (req, res) => {
    const { student_id, subject, score, date } = req.body;
    const insert = db.prepare("INSERT INTO grades (student_id, subject, score, date) VALUES (?, ?, ?, ?)");
    insert.run(student_id, subject, score, date);
    res.json({ success: true });
  });

  app.post("/api/behavior", (req, res) => {
    const { student_id, type, description, date } = req.body;
    const insert = db.prepare("INSERT INTO behavior (student_id, type, description, date) VALUES (?, ?, ?, ?)");
    insert.run(student_id, type, description, date);
    res.json({ success: true });
  });

  app.get("/api/stats", (req, res) => {
    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM students").get() as { count: number };
    const today = new Date().toISOString().split('T')[0];
    const attendanceToday = db.prepare("SELECT status, COUNT(*) as count FROM attendance WHERE date = ? GROUP BY status").all(today);
    res.json({
      totalStudents: totalStudents.count,
      attendanceToday
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
