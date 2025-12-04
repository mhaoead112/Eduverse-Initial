import { Router, Request, Response } from 'express';
import { createUser, enrollStudent, resetUserPassword, getGlobalProgress, listAllCourses, getTeacherActivity } from '../services/admin.service.js';
import { authenticateJWT, checkRole } from '../middleware/auth.middleware.js';

const router = Router();

// Protect ALL admin routes
router.use(authenticateJWT);
router.use(checkRole('admin'));

// 1. Create User
router.post('/users', async (req: Request, res: Response) => {
    try {
        const newUser = await createUser(req.body);
        const { password, ...safeUser } = newUser; // Remove hash
        res.status(201).json(safeUser);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

// 2. Enroll Student
router.post('/enrollments', async (req: Request, res: Response) => {
    try {
        const { studentId, courseId } = req.body;
        await enrollStudent(studentId, courseId);
        res.json({ message: "Enrollment successful." });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

// 3. Reset Password
router.post('/users/:id/reset-password', async (req: Request, res: Response) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword) return res.status(400).json({ message: "New password required." });
        await resetUserPassword(req.params.id, newPassword);
        res.json({ message: "Password reset successful." });
    } catch (error: any) {
        res.status(500).json({ message: "Failed to reset password." });
    }
});

// 4. Global Progress
router.get('/progress', async (req: Request, res: Response) => {
    try {
        const progress = await getGlobalProgress();
        res.json(progress);
    } catch (error: any) {
        console.error("Progress Error", error);
        res.status(500).json({ message: "Failed to fetch progress." });
    }
});

// 5. List Courses
router.get('/courses', async (req: Request, res: Response) => {
    try {
        const courses = await listAllCourses();
        res.json(courses);
    } catch (error: any) {
        res.status(500).json({ message: "Failed to list courses." });
    }
});

// 6. Teacher Activity
router.get('/teachers/activity', async (req: Request, res: Response) => {
    try {
        const activity = await getTeacherActivity();
        res.json(activity);
    } catch (error: any) {
        res.status(500).json({ message: "Failed to get teacher activity." });
    }
});

export default router;