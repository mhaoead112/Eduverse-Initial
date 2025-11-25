// server/src/api/course.routes.ts

import express from 'express';
// We need to add the .js extension for NodeNext module resolution
import { isAuthenticated } from '../middleware/auth.middleware.js'; 
import { createCourse, getCoursesByTeacher, getPublishedCourses, getCourseById, updateCoursePublishStatus, deleteCourse } from '../services/course.service.js';

const router = express.Router();

/**
 * PUBLIC
 * GET /api/courses
 * Returns all published courses
 */
router.get('/', async (req, res) => {
    try {
        const courses = await getPublishedCourses();
        res.status(200).json(courses);
    } catch (error) {
        console.error("Error fetching published courses:", error);
        res.status(500).json({ message: "Failed to fetch courses." });
    }
});

/**
 * PROTECTED (TEACHER/STUDENT)
 * GET /api/courses/user
 * Returns all courses for the authenticated user (teacher's courses or student's enrolled courses)
 */
router.get('/user', isAuthenticated, async (req, res) => {
    try {
        const user = (req as any).user; // Cast to access the user property
        if (!user || user.role !== 'teacher') {
            return res.status(403).json({ message: 'Forbidden: Teachers only.' });
        }

        const courses = await getCoursesByTeacher(user.id);
        res.status(200).json(courses);
    } catch (error) {
        console.error('Error fetching teacher courses:', error);
        res.status(500).json({ message: 'Failed to fetch courses.' });
    }
});

/**
 * PROTECTED (TEACHER ONLY)
 * POST /api/courses
 * Creates a new course for the authenticated teacher
 */
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const user = (req as any).user;
        if (!user || user.role !== 'teacher') {
            return res.status(403).json({ message: 'Forbidden: Teachers only.' });
        }

        const { title, description } = req.body;
        if (!title) {
            return res.status(400).json({ message: 'Title is required.' });
        }

        const newCourse = await createCourse({
            title,
            description,
            teacherId: user.id,
        });

        res.status(201).json(newCourse);
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ message: 'Failed to create course.' });
    }
});

/**
 * PROTECTED (TEACHER ONLY)
 * PATCH /api/courses/:id/publish
 * Toggle publish status of a course
 */
router.patch('/:id/publish', isAuthenticated, async (req, res) => {
    try {
        const user = (req as any).user;
        if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
            return res.status(403).json({ message: 'Forbidden: Teachers or Admins only.' });
        }

        const courseId = req.params.id;
        const { isPublished } = req.body;

        if (typeof isPublished !== 'boolean') {
            return res.status(400).json({ message: 'isPublished must be a boolean.' });
        }

        // Check if course exists
        const existingCourse = await getCourseById(courseId);
        if (!existingCourse) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // Check if user owns the course or is admin
        if (existingCourse.teacherId !== user.id && user.role !== 'admin') {
            return res.status(403).json({ message: "You don't have permission to update this course." });
        }

        // Update publication status
        const updatedCourse = await updateCoursePublishStatus(courseId, isPublished);

        res.status(200).json({
            message: `Course ${isPublished ? 'published' : 'unpublished'} successfully`,
            course: updatedCourse
        });
    } catch (error) {
        console.error('Error updating course publish status:', error);
        res.status(500).json({
            message: 'Failed to update course publication status',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * PROTECTED (TEACHER ONLY)
 * DELETE /api/courses/:id
 * Delete a course (and cascade to enrollments and lessons)
 */
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const user = (req as any).user;
        if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
            return res.status(403).json({ message: 'Forbidden: Teachers or Admins only.' });
        }

        const courseId = req.params.id;

        // Check if course exists
        const existingCourse = await getCourseById(courseId);
        if (!existingCourse) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // Check if user owns the course or is admin
        if (existingCourse.teacherId !== user.id && user.role !== 'admin') {
            return res.status(403).json({ message: "You don't have permission to delete this course." });
        }

        // Delete the course (will cascade to enrollments and lessons via DB constraints)
        await deleteCourse(courseId);

        res.status(200).json({
            message: 'Course deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({
            message: 'Failed to delete course',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;