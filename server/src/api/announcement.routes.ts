// server/src/api/announcement.routes.ts

import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { 
    createAnnouncement, 
    getAnnouncementsByCourse, 
    getAnnouncementById, 
    updateAnnouncement,
    deleteAnnouncement 
} from '../services/announcement.service.js';
import { getCourseById } from '../services/course.service.js';

const router = express.Router();

/**
 * PUBLIC/PROTECTED
 * GET /api/announcements/course/:courseId
 * Get all announcements for a course
 */
router.get('/course/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;

        const courseAnnouncements = await getAnnouncementsByCourse(courseId);

        res.status(200).json({
            announcements: courseAnnouncements
        });
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({
            message: 'Failed to fetch announcements',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * PROTECTED (TEACHER ONLY)
 * POST /api/announcements
 * Create a new announcement
 */
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const user = (req as any).user;
        if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
            return res.status(403).json({ message: 'Forbidden: Teachers or Admins only.' });
        }

        const { courseId, title, content, isPinned } = req.body;

        if (!courseId || !title || !content) {
            return res.status(400).json({ message: 'Course ID, title, and content are required.' });
        }

        // Verify course exists and user owns it
        const course = await getCourseById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        if (course.teacherId !== user.id && user.role !== 'admin') {
            return res.status(403).json({ message: "You don't have permission to post announcements to this course." });
        }

        const newAnnouncement = await createAnnouncement({
            courseId,
            teacherId: user.id,
            title,
            content,
            isPinned: isPinned || false
        });

        res.status(201).json({
            message: 'Announcement created successfully',
            announcement: newAnnouncement
        });
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({
            message: 'Failed to create announcement',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * PROTECTED (TEACHER ONLY)
 * PATCH /api/announcements/:id
 * Update an announcement
 */
router.patch('/:id', isAuthenticated, async (req, res) => {
    try {
        const user = (req as any).user;
        if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
            return res.status(403).json({ message: 'Forbidden: Teachers or Admins only.' });
        }

        const announcementId = req.params.id;
        const { title, content, isPinned } = req.body;

        // Get announcement to verify ownership
        const announcement = await getAnnouncementById(announcementId);
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found.' });
        }

        if (announcement.teacherId !== user.id && user.role !== 'admin') {
            return res.status(403).json({ message: "You don't have permission to update this announcement." });
        }

        const updatedAnnouncement = await updateAnnouncement(announcementId, {
            title,
            content,
            isPinned
        });

        res.status(200).json({
            message: 'Announcement updated successfully',
            announcement: updatedAnnouncement
        });
    } catch (error) {
        console.error('Error updating announcement:', error);
        res.status(500).json({
            message: 'Failed to update announcement',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * PROTECTED (TEACHER ONLY)
 * DELETE /api/announcements/:id
 * Delete an announcement
 */
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const user = (req as any).user;
        if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
            return res.status(403).json({ message: 'Forbidden: Teachers or Admins only.' });
        }

        const announcementId = req.params.id;

        // Get announcement to verify ownership
        const announcement = await getAnnouncementById(announcementId);
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found.' });
        }

        if (announcement.teacherId !== user.id && user.role !== 'admin') {
            return res.status(403).json({ message: "You don't have permission to delete this announcement." });
        }

        await deleteAnnouncement(announcementId);

        res.status(200).json({
            message: 'Announcement deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({
            message: 'Failed to delete announcement',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
