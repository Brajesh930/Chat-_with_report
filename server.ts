import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './src/lib/db.ts';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { LocalStorageProvider, S3StorageProvider } from './src/lib/storage.ts';
import dotenv from 'dotenv';
import mammoth from 'mammoth';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

// Ensure pdf is a function (handles potential ESM/CJS compatibility issues)
const pdfLib = typeof pdf === 'function' ? pdf : (pdf && typeof pdf.default === 'function' ? pdf.default : null);

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// Initialize Storage Provider based on environment variable
const storageMode = process.env.STORAGE_PROVIDER || 'local';
let storage: LocalStorageProvider | S3StorageProvider;

if (storageMode === 's3') {
  console.log('[Storage] Initializing AWS S3 Storage Provider');
  storage = new S3StorageProvider();
} else {
  console.log('[Storage] Initializing Local Disk Storage Provider');
  storage = new LocalStorageProvider();
}

// Multer for file uploads
const upload = multer({ dest: 'temp-uploads/' });
if (!fs.existsSync('temp-uploads')) fs.mkdirSync('temp-uploads');

app.use(cors());
app.use(express.json());

// API Request Logger
app.use('/api', (req, res, next) => {
  console.log(`[API Request] ${req.method} ${req.url}`);
  next();
});

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// --- API Routes ---

// Health Check for AWS Fargate/Load Balancer
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, client_id: user.client_id }, JWT_SECRET);
  console.log('Login successful:', { username: user.username, role: user.role, client_id: user.client_id });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, client_id: user.client_id } });
});

// Verify Token / Get Current User
app.get('/api/auth/me', authenticate, (req: any, res) => {
  res.json(req.user);
});

// Admin: Manage Users
app.get('/api/admin/users', authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const users = db.prepare('SELECT id, username, role, client_id, question_limit, questions_asked FROM users').all();
  res.json(users);
});

app.post('/api/admin/users', authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { username, password, role, client_id, question_limit } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare('INSERT INTO users (username, password, role, client_id, question_limit) VALUES (?, ?, ?, ?, ?)').run(
      username, 
      hashedPassword, 
      role, 
      client_id || null, 
      question_limit || 50
    );
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

app.patch('/api/admin/users/:id', authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { password, role, client_id, question_limit } = req.body;
  
  try {
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare('UPDATE users SET password = ?, role = ?, client_id = ?, question_limit = ? WHERE id = ?').run(
        hashedPassword, 
        role, 
        client_id || null, 
        question_limit || 50,
        req.params.id
      );
    } else {
      db.prepare('UPDATE users SET role = ?, client_id = ?, question_limit = ? WHERE id = ?').run(
        role, 
        client_id || null, 
        question_limit || 50,
        req.params.id
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.post('/api/admin/users/:id/reset-usage', authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    db.prepare('UPDATE users SET questions_asked = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset usage' });
  }
});

app.get('/api/admin/alerts', authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const alerts = db.prepare('SELECT * FROM system_alerts ORDER BY created_at DESC').all();
  res.json(alerts);
});

app.patch('/api/admin/alerts/:id', authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { status } = req.body;
  db.prepare('UPDATE system_alerts SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// Public alert logging (authenticated users only)
app.post('/api/alerts/log', authenticate, (req: any, res) => {
  const { type, message, target_user_id } = req.body;
  try {
    // Check if an active alert of this type for this user already exists to prevent dashboard noise
    const existing = db.prepare("SELECT id FROM system_alerts WHERE type = ? AND target_user_id = ? AND status = 'active'").get(type, target_user_id || null);
    if (!existing) {
      db.prepare('INSERT INTO system_alerts (type, message, target_user_id) VALUES (?, ?, ?)').run(type, message, target_user_id || null);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log alert' });
  }
});

// Public check for critical alerts
app.get('/api/alerts/active', (req, res) => {
  const active = db.prepare("SELECT * FROM system_alerts WHERE status = 'active' AND type = 'RESOURCE_EXHAUSTED' LIMIT 1").get();
  res.json({ active: !!active });
});

app.delete('/api/admin/users/:id', authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  
  const userId = req.params.id;

  // Prevent admin from deleting themselves
  if (Number(userId) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own admin account' });
  }

  try {
    // Check if user has associated reports
    const reportCount: any = db.prepare('SELECT COUNT(*) as count FROM reports WHERE uploaded_by_user_id = ? OR updated_by_user_id = ?').get(userId, userId);
    if (reportCount.count > 0) {
      return res.status(400).json({ error: 'Cannot delete user because they have associated reports. Reassign or delete the reports first.' });
    }

    // Use a transaction for safe cleanup
    const deleteUser = db.transaction(() => {
      // 1. Delete chat history
      db.prepare('DELETE FROM chat_history WHERE user_id = ?').run(userId);
      // 2. Delete notes
      db.prepare('DELETE FROM notes WHERE employee_id = ?').run(userId);
      // 3. Finally delete the user
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    });

    deleteUser();
    res.json({ success: true });
  } catch (err) {
    console.error('User Delete Error:', err);
    res.status(500).json({ error: 'Failed to delete user. It may have associated records.' });
  }
});

// Admin: Manage Clients
app.get('/api/admin/clients', authenticate, (req: any, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'employee') return res.status(403).json({ error: 'Forbidden' });
  const clients = db.prepare('SELECT * FROM clients').all();
  res.json(clients);
});

app.post('/api/admin/clients', authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { name } = req.body;
  const result = db.prepare('INSERT INTO clients (name) VALUES (?)').run(name);
  res.json({ id: result.lastInsertRowid });
});

app.delete('/api/admin/clients/:id', authenticate, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const clientId = req.params.id;

  try {
    // Check if client has reports
    const reports: any[] = db.prepare('SELECT id FROM reports WHERE client_id = ?').all(clientId);
    
    // We choose to prevent deletion if there are reports to avoid accidental bulk data loss
    if (reports.length > 0) {
      return res.status(400).json({ error: 'Cannot delete client because they have associated reports. Delete the reports first.' });
    }

    // Check if any users are assigned to this client
    const userCount: any = db.prepare('SELECT COUNT(*) as count FROM users WHERE client_id = ?').get(clientId);
    if (userCount.count > 0) {
      // For users, we can just unassign them
      db.prepare('UPDATE users SET client_id = NULL WHERE client_id = ?').run(clientId);
    }

    db.prepare('DELETE FROM clients WHERE id = ?').run(clientId);
    res.json({ success: true });
  } catch (err) {
    console.error('Client Delete Error:', err);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// Settings Management
app.get('/api/settings', authenticate, (req, res) => {
  const settings = db.prepare('SELECT key, value FROM settings').all();
  const settingsMap = settings.reduce((acc: any, curr: any) => {
    try {
      acc[curr.key] = JSON.parse(curr.value);
    } catch (e) {
      acc[curr.key] = curr.value;
    }
    return acc;
  }, {});
  res.json(settingsMap);
});

app.post('/api/admin/settings', authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { key, value } = req.body;
  
  const updatedValue = typeof value === 'string' ? value : JSON.stringify(value);
  
  db.prepare(`
    INSERT INTO settings (key, value, updated_at) 
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET 
      value = excluded.value,
      updated_at = excluded.updated_at
  `).run(key, updatedValue);
  
  res.json({ success: true });
});

async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  try {
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Explicit PDF check
    if (file.mimetype === 'application/pdf' || ext === '.pdf') {
      if (typeof pdfLib !== 'function') {
        console.error('PDF extraction library not properly initialized');
        return `[Extraction error: PDF library not available for ${file.originalname}]`;
      }
      const dataBuffer = fs.readFileSync(file.path);
      const data = await pdfLib(dataBuffer);
      return data.text;
    } 
    // Explicit DOCX check
    else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === '.docx') {
      const result = await mammoth.extractRawText({ path: file.path });
      return result.value;
    } 
    // Text check (MIME or common extensions)
    else if (file.mimetype.startsWith('text/') || ['.txt', '.md', '.log', '.csv', '.json', '.xml'].includes(ext)) {
      return fs.readFileSync(file.path, 'utf8');
    } 
    // Generic octet-stream fallback: try reading as text if extension suggests it or it's unknown
    else if (file.mimetype === 'application/octet-stream') {
      try {
        return fs.readFileSync(file.path, 'utf8');
      } catch {
        return `[Binary file: ${file.originalname}]`;
      }
    }
    else {
      return `[Non-text file: ${file.originalname}]`;
    }
  } catch (err) {
    console.error(`Extraction error for ${file.originalname}:`, err);
    return `[Error extracting text from ${file.originalname}]`;
  }
}

// Reports
app.get('/api/reports', authenticate, async (req: any, res) => {
  let reports: any[];
  const query = `
    SELECT r.*, 
           u1.username as uploaded_by, 
           u2.username as updated_by,
           c.name as client_name
    FROM reports r
    LEFT JOIN users u1 ON r.uploaded_by_user_id = u1.id
    LEFT JOIN users u2 ON r.updated_by_user_id = u2.id
    LEFT JOIN clients c ON r.client_id = c.id
  `;
  
  if (req.user.role === 'admin' || req.user.role === 'employee') {
    reports = db.prepare(query).all();
  } else {
    const clientId = req.user.client_id;
    if (!clientId) {
      reports = [];
    } else {
      reports = db.prepare(`${query} WHERE r.client_id = ? AND r.visibility = 'public'`).all(clientId);
    }
  }

  // Generate file URLs and include all associated files
  const reportsWithDetails = await Promise.all(reports.map(async (r) => {
    const files = db.prepare('SELECT id, file_key, original_name, mime_type, content, is_rough_note FROM report_files WHERE report_id = ?').all(r.id);
    
    // Add signed URLs to each file
    const filesWithUrls = await Promise.all(files.map(async (f: any) => {
      f.url = await storage.getFileUrl(f.file_key);
      return f;
    }));

    r.files = filesWithUrls;
    if (r.file_key) {
      r.file_url = await storage.getFileUrl(r.file_key);
    }
    return r;
  }));

  res.json(reportsWithDetails);
});

app.post('/api/reports/upload', authenticate, upload.fields([
  { name: 'mainFiles', maxCount: 10 },
  { name: 'roughNotes', maxCount: 10 }
]), async (req: any, res) => {
  if (req.user.role !== 'employee' && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  let { title, client_id, version, visibility, logicapt_project_code, client_project_code, patent_no, patent_title, project_type } = req.body;

  // Enforce visibility constraint: Only admins can create public reports
  if (visibility === 'public' && req.user.role !== 'admin') {
    visibility = 'private';
  }
  
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const mainFiles = files['mainFiles'] || [];
  const roughNotes = files['roughNotes'] || [];

  if (mainFiles.length === 0 && roughNotes.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  try {
    // 1. Save main report record
    const result = db.prepare('INSERT INTO reports (title, client_id, uploaded_by_user_id, updated_by_user_id, version, visibility, logicapt_project_code, client_project_code, patent_no, patent_title, project_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      title, 
      client_id, 
      req.user.id, 
      req.user.id, 
      version || '1.0', 
      visibility || 'private',
      logicapt_project_code || null,
      client_project_code || null,
      patent_no || null,
      patent_title || null,
      project_type || null
    );
    const reportId = result.lastInsertRowid;

    const processFiles = async (fileList: Express.Multer.File[], isRough: boolean) => {
      for (const file of fileList) {
        // Extract text BEFORE moving/uploading the file, because the storage provider
        // may delete or move the temporary file.
        const content = await extractTextFromFile(file);
        const fileKey = await storage.uploadFile(file);
        
        db.prepare('INSERT INTO report_files (report_id, file_key, original_name, mime_type, content, is_rough_note) VALUES (?, ?, ?, ?, ?, ?)').run(
          reportId,
          fileKey,
          file.originalname,
          file.mimetype,
          content,
          isRough ? 1 : 0
        );
      }
    };

    await processFiles(mainFiles, false);
    await processFiles(roughNotes, true);

    res.json({ id: reportId });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'Failed to process files' });
  }
});

app.delete('/api/reports/:id', authenticate, async (req: any, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'employee') return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const report: any = db.prepare('SELECT visibility FROM reports WHERE id = ?').get(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (report.visibility === 'public') {
      return res.status(400).json({ error: 'Switch it to private to delete the project' });
    }

    const files: any[] = db.prepare('SELECT file_key FROM report_files WHERE report_id = ?').all(req.params.id);
    const legacyReport: any = db.prepare('SELECT file_key FROM reports WHERE id = ?').get(req.params.id);
    
    // Delete files from storage
    for (const f of files) {
      await storage.deleteFile(f.file_key);
    }
    if (legacyReport?.file_key) {
      await storage.deleteFile(legacyReport.file_key);
    }

    // Delete child records first to avoid foreign key violations
    db.prepare('DELETE FROM report_files WHERE report_id = ?').run(req.params.id);
    db.prepare('DELETE FROM chat_history WHERE report_id = ?').run(req.params.id);
    db.prepare('DELETE FROM notes WHERE report_id = ?').run(req.params.id);
    
    // Finally delete the parent report
    db.prepare('DELETE FROM reports WHERE id = ?').run(req.params.id);
    
    res.json({ success: true });
  } catch (err) {
    console.error('Delete Error:', err);
    res.status(500).json({ error: 'Failed to delete report and its associated data' });
  }
});

app.delete('/api/reports/:id/files/:fileId', authenticate, async (req: any, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'employee') return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const report: any = db.prepare('SELECT visibility FROM reports WHERE id = ?').get(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (report.visibility === 'public') {
      return res.status(400).json({ error: 'Switch it to private to edit any file' });
    }

    const file: any = db.prepare('SELECT file_key FROM report_files WHERE id = ? AND report_id = ?').get(req.params.fileId, req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    await storage.deleteFile(file.file_key);
    db.prepare('DELETE FROM report_files WHERE id = ?').run(req.params.fileId);
    
    res.json({ success: true });
  } catch (err) {
    console.error('File Delete Error:', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

app.post('/api/reports/:id/files', authenticate, upload.single('file'), async (req: any, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'employee') return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const report: any = db.prepare('SELECT visibility FROM reports WHERE id = ?').get(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (report.visibility === 'public') {
      return res.status(400).json({ error: 'Switch it to private to edit any file' });
    }

    const { isRough } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // Extract text BEFORE moving/uploading the file
    const content = await extractTextFromFile(file);
    const fileKey = await storage.uploadFile(file);
    
    db.prepare('INSERT INTO report_files (report_id, file_key, original_name, mime_type, content, is_rough_note) VALUES (?, ?, ?, ?, ?, ?)').run(
      req.params.id,
      fileKey,
      file.originalname,
      file.mimetype,
      content,
      isRough === 'true' ? 1 : 0
    );

    res.json({ success: true });
  } catch (err) {
    console.error('File Add Error:', err);
    res.status(500).json({ error: 'Failed to add file' });
  }
});

// Get combined content for chat context
app.get('/api/reports/:id/content', authenticate, (req: any, res) => {
  const { type } = req.query; // 'report' or 'rough_notes'
  const isRough = type === 'rough_notes' ? 1 : 0;
  
  const files = db.prepare('SELECT content FROM report_files WHERE report_id = ? AND is_rough_note = ?').all(req.params.id, isRough);
  const combinedContent = files.map((f: any) => f.content).join('\n\n---\n\n');
  
  res.json({ content: combinedContent || "No content available for this section." });
});

// Serve Local Files (Only used by LocalStorageProvider to mimic S3 behavior)
app.get('/api/files/:key', (req, res) => {
  const filePath = path.join(process.cwd(), 'uploads', req.params.key);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

app.patch('/api/reports/:id', authenticate, (req: any, res) => {
  if (req.user.role !== 'employee' && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  
  const currentReport: any = db.prepare('SELECT visibility, status, client_id FROM reports WHERE id = ?').get(req.params.id);
  if (!currentReport) return res.status(404).json({ error: 'Report not found' });

  const { status, visibility, client_id } = req.body;

  // Enforce visibility change restriction: only admins can change visibility
  if (visibility !== undefined && visibility !== currentReport.visibility && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can change report visibility' });
  }

  // If report is public, restrict changes unless it's just the status
  if (currentReport.visibility === 'public') {
    if (client_id !== undefined && client_id !== currentReport.client_id) {
       return res.status(400).json({ error: 'Switch it to private to change the client' });
    }
  }

  const finalStatus = status !== undefined ? status : currentReport.status;
  const finalVisibility = visibility !== undefined ? visibility : currentReport.visibility;
  const finalClientId = client_id !== undefined ? client_id : currentReport.client_id;

  db.prepare('UPDATE reports SET status = ?, visibility = ?, client_id = ?, updated_by_user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
    finalStatus, 
    finalVisibility, 
    finalClientId,
    req.user.id, 
    req.params.id
  );
  
  res.json({ success: true });
});

// Chat History
app.get('/api/reports/:id/chat', authenticate, (req: any, res) => {
  const { type } = req.query; // 'report' or 'rough_notes'
  const history = db.prepare('SELECT * FROM chat_history WHERE report_id = ? AND context_type = ? ORDER BY created_at ASC').all(req.params.id, type || 'report');
  
  // Also provide current user limit info
  const user: any = db.prepare('SELECT question_limit, questions_asked FROM users WHERE id = ?').get(req.user.id);
  
  res.json({
    history,
    usage: {
      limit: user.question_limit,
      asked: user.questions_asked
    }
  });
});

app.post('/api/reports/:id/chat', authenticate, (req: any, res) => {
  const { message, role, context_type } = req.body;
  
  // If it's a user message, check and increment limit
  if (role === 'user') {
    const user: any = db.prepare('SELECT username, question_limit, questions_asked FROM users WHERE id = ?').get(req.user.id);
    if (user.questions_asked >= user.question_limit) {
      // Log alert for admin surveillance
      // Check if an active quota alert already exists for this user
      const existing = db.prepare("SELECT id FROM system_alerts WHERE type = 'QUOTA_EXCEEDED' AND target_user_id = ? AND status = 'active'").get(req.user.id);
      if (!existing) {
        db.prepare('INSERT INTO system_alerts (type, message, target_user_id) VALUES (?, ?, ?)').run(
          'QUOTA_EXCEEDED', 
          `User ${user.username} (ID: ${req.user.id}) has exhausted their analytical quota (${user.question_limit} queries).`,
          req.user.id
        );
      }
      return res.status(403).json({ error: 'Analytical quota exceeded. Please contact your administrator to reset your query limit.' });
    }
    
    db.prepare('UPDATE users SET questions_asked = questions_asked + 1 WHERE id = ?').run(req.user.id);

    // Proactive Warning Logic (Log when reaching 90% threshold for the first time in a session)
    const updatedUser: any = db.prepare('SELECT questions_asked, question_limit FROM users WHERE id = ?').get(req.user.id);
    if (updatedUser.questions_asked === Math.floor(updatedUser.question_limit * 0.9)) {
       // Check if an active warning already exists
       const existingWarning = db.prepare("SELECT id FROM system_alerts WHERE type = 'QUOTA_WARNING' AND target_user_id = ? AND status = 'active'").get(req.user.id);
       if (!existingWarning) {
         db.prepare('INSERT INTO system_alerts (type, message, target_user_id) VALUES (?, ?, ?)').run(
          'QUOTA_WARNING', 
          `User ${user.username} (ID: ${req.user.id}) has reached 90% of their analytical quota (${updatedUser.questions_asked}/${updatedUser.question_limit}).`,
          req.user.id
        );
       }
    }
  }

  db.prepare('INSERT INTO chat_history (report_id, user_id, message, role, context_type) VALUES (?, ?, ?, ?, ?)').run(
    req.params.id, 
    req.user.id, 
    message, 
    role,
    context_type || 'report'
  );
  res.json({ success: true });
});

app.delete('/api/reports/:id/chat', authenticate, (req: any, res) => {
  if (req.user.role !== 'employee' && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { type } = req.query; // 'report' or 'rough_notes'
  const reportId = Number(req.params.id);
  const contextType = type || 'report';
  
  try {
    const result = db.prepare('DELETE FROM chat_history WHERE report_id = ? AND context_type = ?').run(reportId, contextType);
    console.log(`Cleared chat history for report ${reportId}, context ${contextType}. Rows deleted: ${result.changes}`);
    res.json({ success: true, changes: result.changes });
  } catch (err) {
    console.error('Chat Delete Error:', err);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

// Internal Notes
app.get('/api/reports/:id/notes', authenticate, (req: any, res) => {
  if (req.user.role === 'client') return res.status(403).json({ error: 'Forbidden' });
  const notes = db.prepare('SELECT * FROM notes WHERE report_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(notes);
});

app.post('/api/reports/:id/notes', authenticate, (req: any, res) => {
  if (req.user.role === 'client') return res.status(403).json({ error: 'Forbidden' });
  const { content } = req.body;
  db.prepare('INSERT INTO notes (report_id, employee_id, content) VALUES (?, ?, ?)').run(req.params.id, req.user.id, content);
  res.json({ success: true });
});

// --- Vite Middleware ---
async function startServer() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Critical Server Startup Error:', error);
    process.exit(1);
  }
}

// Ensure nested catch-all for API returns JSON, not HTML
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

startServer();
