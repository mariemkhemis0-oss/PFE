import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import connectDB from './db.js';
import apiRoutes from './routes/api.js';
import { restoreActiveScans } from './controllers/scanController.js';
import { startScheduler } from './services/schedulerService.js';

const app = express();

// Connect to MongoDB then restore active scans and start scheduler
connectDB().then(() => {
  restoreActiveScans().catch(err => console.error('[BOOT] Erreur restauration scans:', err.message));
  startScheduler();
});

// ── Security: block path traversal & malicious probes ──
const TRAVERSAL_PATTERNS = [
  /\.\.[\/\\]/,           // ../  ..\
  /%2e%2e/i,              // URL-encoded ..
  /%252e/i,               // double-encoded .
  /\0|%00/,               // null bytes
  /file:\/\//i,           // file:// protocol
  /file%3a/i,             // encoded file:
  /winnt[\/\\%]/i,        // winnt/win.ini
  /windows[\/\\%]/i,      // windows/win.ini
  /etc[\/\\%]passwd/i,    // /etc/passwd
  /proc[\/\\%]self/i,     // /proc/self
];

app.use((req, res, next) => {
  const raw = decodeURIComponent(req.url || '').toLowerCase();
  if (TRAVERSAL_PATTERNS.some(p => p.test(raw) || p.test(req.url))) {
    return res.status(400).end();
  }
  next();
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
// Request logging — API routes only, no scanner noise
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/ping') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// Health check endpoint
app.get('/ping', (req, res) => {
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CyberAudit AI Platform Backend API',
    version: '1.0.0',
    status: 'running',
    documentation: 'Available at /api/docs',
    endpoints: {
      users: '/api/users',
      vulnerabilities: '/api/vulnerabilities',
      reports: '/api/reports',
      hosts: '/api/hosts',
      organizations: '/api/organizations',
      notifications: '/api/notifications',
      scanners: '/api/scanners',
      roleRequests: '/api/role-requests',
      cves: '/api/cves',
      config: '/api/config',
      dashboard: '/api/dashboard',
      health: '/api/health',
    },
  });
});

// 404 Not Found handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString(),
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════════╗
  ║  CyberAudit AI Platform - Backend Server      ║
  ║  Running on: http://localhost:${PORT}              ║
  ║  Environment: ${config.nodeEnv}                  ║
  ║  Frontend URL: ${config.frontendUrl}           ║
  ╚════════════════════════════════════════════════╝
  `);
});
