import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import cookieParser from "cookie-parser";

const db = new Database("school.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL, -- teacher, student
    student_id INTEGER, -- NULL for teachers
    FOREIGN KEY (student_id) REFERENCES students(id)
  );

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

const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  // Seed Users
  const insertUser = db.prepare("INSERT INTO users (username, password, role, student_id) VALUES (?, ?, ?, ?)");
  insertUser.run("guru", "guru123", "teacher", null);
  insertUser.run("ahmad", "siswa123", "student", 1);
  insertUser.run("siti", "siswa123", "student", 2);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Auth Middleware (Simple)
  const getSessionUser = (req: express.Request) => {
    const userId = req.cookies.userId;
    if (!userId) return null;
    return db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
  };

  // API Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;
    
    if (user) {
      res.cookie("userId", user.id, { httpOnly: true, sameSite: 'none', secure: true });
      res.json({ success: true, user: { id: user.id, username: user.username, role: user.role, student_id: user.student_id } });
    } else {
      res.status(401).json({ success: false, message: "Username atau password salah" });
    }
  });

  app.post("/api/logout", (req, res) => {
    res.clearCookie("userId");
    res.json({ success: true });
  });

  app.get("/api/me", (req, res) => {
    const user = getSessionUser(req);
    if (user) {
      res.json({ id: user.id, username: user.username, role: user.role, student_id: user.student_id });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  app.get("/api/students", (req, res) => {
    const user = getSessionUser(req);
    if (!user || user.role !== 'teacher') {
      return res.status(403).json({ message: "Forbidden" });
    }
    const students = db.prepare("SELECT * FROM students").all();
    res.json(students);
  });

  app.get("/api/students/:id", (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Students can only see their own data
    if (user.role === 'student' && user.student_id !== parseInt(req.params.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const student = db.prepare("SELECT * FROM students WHERE id = ?").get(req.params.id);
    const attendance = db.prepare("SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC").all(req.params.id);
    const grades = db.prepare("SELECT * FROM grades WHERE student_id = ? ORDER BY date DESC").all(req.params.id);
    const behavior = db.prepare("SELECT * FROM behavior WHERE student_id = ? ORDER BY date DESC").all(req.params.id);
    res.json({ ...student, attendance, grades, behavior });
  });

  app.post("/api/attendance", (req, res) => {
    const user = getSessionUser(req);
    if (!user || user.role !== 'teacher') return res.status(403).json({ message: "Forbidden" });

    const { student_id, date, status } = req.body;
    const insert = db.prepare("INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)");
    insert.run(student_id, date, status);
    res.json({ success: true });
  });

  app.post("/api/grades", (req, res) => {
    const user = getSessionUser(req);
    if (!user || user.role !== 'teacher') return res.status(403).json({ message: "Forbidden" });

    const { student_id, subject, score, date } = req.body;
    const insert = db.prepare("INSERT INTO grades (student_id, subject, score, date) VALUES (?, ?, ?, ?)");
    insert.run(student_id, subject, score, date);
    res.json({ success: true });
  });

  app.post("/api/behavior", (req, res) => {
    const user = getSessionUser(req);
    if (!user || user.role !== 'teacher') return res.status(403).json({ message: "Forbidden" });

    const { student_id, type, description, date } = req.body;
    const insert = db.prepare("INSERT INTO behavior (student_id, type, description, date) VALUES (?, ?, ?, ?)");
    insert.run(student_id, type, description, date);
    res.json({ success: true });
  });

  app.get("/api/stats", (req, res) => {
    const user = getSessionUser(req);
    if (!user || user.role !== 'teacher') return res.status(403).json({ message: "Forbidden" });

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
