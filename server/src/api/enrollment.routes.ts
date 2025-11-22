// server/src/api/enrollment.routes.ts

import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { db } from '../db.js';
import { enrollments, courses } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

/**
 * PROTECTED (STUDENT)
 * GET /api/enrollments/student
 * Get all enrollments for the authenticated student
 */
router.get('/student', isAuthenticated, async (req, res) => {
    try {
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const studentEnrollments = await db
            .select({
                id: enrollments.id,
                courseId: enrollments.courseId,
                enrolledAt: enrollments.enrolledAt,
                course: {
                    id: courses.id,
                    title: courses.title,
                    description: courses.description,
                    teacherId: courses.teacherId,
                    isPublished: courses.isPublished,
                }
            })
            .from(enrollments)
            .leftJoin(courses, eq(enrollments.courseId, courses.id))
            .where(eq(enrollments.studentId, user.id));

        res.status(200).json(studentEnrollments);
    } catch (error) {
        console.error('Error fetching student enrollments:', error);
        res.status(500).json({
            message: 'Failed to fetch enrollments',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
