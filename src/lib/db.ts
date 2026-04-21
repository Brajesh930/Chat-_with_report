import Database from 'better-sqlite3';
import path from 'path';

import bcrypt from 'bcryptjs';

const db = new Database('portal.db');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'employee', 'client')),
    client_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    file_key TEXT,
    version TEXT DEFAULT '1.0',
    status TEXT DEFAULT 'uploaded' CHECK(status IN ('uploaded', 'in review', 'completed', 'delivered', 'revised', 'archived')),
    visibility TEXT DEFAULT 'private' CHECK(visibility IN ('private', 'public')),
    client_id INTEGER NOT NULL,
    uploaded_by_user_id INTEGER NOT NULL,
    updated_by_user_id INTEGER NOT NULL,
    logicapt_project_code TEXT,
    client_project_code TEXT,
    patent_no TEXT,
    patent_title TEXT,
    project_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(client_id) REFERENCES clients(id),
    FOREIGN KEY(uploaded_by_user_id) REFERENCES users(id),
    FOREIGN KEY(updated_by_user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    context_type TEXT DEFAULT 'report' CHECK(context_type IN ('report', 'rough_notes')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(report_id) REFERENCES reports(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS report_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    file_key TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT,
    content TEXT,
    is_rough_note BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(report_id) REFERENCES reports(id)
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    employee_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(report_id) REFERENCES reports(id),
    FOREIGN KEY(employee_id) REFERENCES users(id)
  );
`);

// Migrations (Add missing columns to existing tables)
try {
  const reportFilesInfo = db.prepare("PRAGMA table_info(report_files)").all();
  if (!reportFilesInfo.some((col: any) => col.name === 'mime_type')) {
    db.exec("ALTER TABLE report_files ADD COLUMN mime_type TEXT");
    console.log("Added mime_type column to report_files");
  }

  const chatHistoryInfo = db.prepare("PRAGMA table_info(chat_history)").all();
  if (!chatHistoryInfo.some((col: any) => col.name === 'context_type')) {
    db.exec("ALTER TABLE chat_history ADD COLUMN context_type TEXT DEFAULT 'report' CHECK(context_type IN ('report', 'rough_notes'))");
    console.log("Added context_type column to chat_history");
  }

  const reportsInfo = db.prepare("PRAGMA table_info(reports)").all();
  const reportColumns = ['logicapt_project_code', 'client_project_code', 'patent_no', 'patent_title', 'project_type'];
  reportColumns.forEach(col => {
    if (!reportsInfo.some((info: any) => info.name === col)) {
      db.exec(`ALTER TABLE reports ADD COLUMN ${col} TEXT`);
      console.log(`Added ${col} column to reports`);
    }
  });
} catch (err) {
  console.error("Migration error:", err);
}

// Seed admin (password: admin123)
const hash = bcrypt.hashSync('admin123', 10);
const admin: any = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!admin) {
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hash, 'admin');
} else {
  // Update password in case it was seeded with a broken hash previously
  db.prepare('UPDATE users SET password = ? WHERE username = ?').run(hash, 'admin');
}

export default db;
