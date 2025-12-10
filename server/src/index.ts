// server/src/index.ts

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV !== 'production') {
  const { default: dotenv } = await import('dotenv');
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
// @ts-ignore
import morgan from 'morgan';
// @ts-ignore
import xss from 'xss-clean';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

import { setupWebSocketServer } from './websocket.js';
import { logger, morganStream } from './utils/logger.js';

const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing env vars: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// ---------- CORS CONFIG (moved before helmet) ----------

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://eduverse-initial.vercel.app',
      'https://eduverse-initial*.vercel.app'
    ];

const corsConfig = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const direct = allowedOrigins.includes(origin);
    const vercelPreview = /eduverse-initial.*\.vercel\.app$/.test(origin);
    if (direct || vercelPreview) return callback(null, true);
    logger.warn(`❌ CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
  exposedHeaders: ['Content-Range','X-Content-Range'],
  maxAge: 600
};

// IMPORTANT: CORS BEFORE HELMET
app.use(cors(corsConfig));
app.options('*', cors(corsConfig));

// ---------- Helmet Security ----------

app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", ...allowedOrigins],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  } : false,
  crossOriginEmbedderPolicy: !isProduction
}));

// ---------- Other security ----------

app.use(xss());
const cookieSecret = process.env.COOKIE_SECRET || process.env.JWT_SECRET;
app.use(cookieParser(cookieSecret));

const baseLimiter = rateLimit({
  windowMs: 15*60*1000,
  max: isProduction ? 100 : 1000
});

app.use('/api/', baseLimiter);

// ---------- Logging ----------

app.use(morgan(isProduction ? 'combined' : 'dev', { stream: morganStream }));

app.use(express.json());
app.use(express.urlencoded({ extended:true }));

app.use('/uploads', express.static('uploads'));

// ---------- Routes ----------

import authRoutes from './api/auth.routes.js';
import aiRoutes from './api/ai.routes.js';
import aiChatRoutes from './api/ai-chat.routes.js';
import courseRoutes from './api/course.routes.js';
import lessonRoutes from './api/lesson.routes.js';
import announcementRoutes from './api/announcement.routes.js';
import enrollmentRoutes from './api/enrollment.routes.js';
import assignmentRoutes from './api/assignment.routes.js';
import reportCardRoutes from './api/report-cards.routes.js';
import usersRoutes from './api/users.routes.js';
import studyGroupRoutes from './api/study-groups.routes.js';
import conversationsRoutes from './api/conversations.routes.js';
import notificationsRoutes from './api/notifications.routes.js';
import progressRoutes from './api/progress.routes.js';
import streakRoutes from './api/streak.routes.js';
import eventsRoutes from './api/events.routes.js';
import profileRoutes from './api/profile.routes.js';
import analyticsRoutes from './api/analytics.routes.js';
import adminRoutes from './api/admin.routes.js';
import parentRoutes from './api/parent.routes.js';
import scheduleRoutes from './api/schedule.routes.js';
import adminSettingsRoutes from './api/admin-settings.routes.js';
import pushRoutes from './api/push.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/report-cards', reportCardRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/study-groups', studyGroupRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/streaks', streakRoutes);
app.use('/api', eventsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/push', pushRoutes);

app.get('/api/health', (req,res) => {
  res.status(200).json({
    status:'ok',
    timestamp:new Date(),
    environment:process.env.NODE_ENV,
    uptime:process.uptime()
  });
});

// ---------- Error Handler ----------

app.use((err,req,res,next)=>{
  logger.error(err);
  res.status(500).json({ error:'Internal server error' });
});

const server = createServer(app);
const wss = new WebSocketServer({ server });
setupWebSocketServer(wss);

server.listen(PORT,()=>{
  logger.info(`Eduverse backend running on port ${PORT}`);
});
