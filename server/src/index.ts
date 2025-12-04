// server/src/index.ts

// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

// Import our API routes (with .js extensions)
import authRoutes from './api/auth.routes.js';
import aiRoutes from './api/ai.routes.js';
import courseRoutes from './api/course.routes.js';
import lessonRoutes from './api/lesson.routes.js';
import announcementRoutes from './api/announcement.routes.js';
import enrollmentRoutes from './api/enrollment.routes.js';
import adminRoutes from './api/admin.routes.js';
// We will NOT import staff.routes.js as it doesn't exist yet
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors()); 
app.use(express.json());

// --- API Route Definitions ---
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`✅ Eduverse backend server is running and listening on http://localhost:${PORT}`);
});