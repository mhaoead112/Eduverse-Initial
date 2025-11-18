import express from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import {
  createAssignment,
  getAssignmentsForCourse,
  submitAssignment,
  gradeSubmission,
} from "../services/assignment.service.js";

const router = express.Router();

// Teacher creates an assignment for a course
router.post("/courses/:courseId/assignments", isAuthenticated, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== "teacher") {
      return res.status(403).json({ message: "Forbidden: Teachers only." });
    }

    const { title, instructions, dueDate } = req.body;
    if (!title || !dueDate) {
      return res.status(400).json({ message: "title and dueDate are required" });
    }

    const assignment = await createAssignment({
      courseId: req.params.courseId,
      title,
      instructions,
      dueDate: new Date(dueDate),
    });

    res.status(201).json(assignment);
  } catch (error: any) {
    console.error("Error creating assignment:", error);
    res.status(500).json({ message: error?.message || "Failed to create assignment" });
  }
});

// Get assignments for a course (teacher or enrolled student)
router.get("/courses/:courseId/assignments", isAuthenticated, async (req, res) => {
  try {
    const assignments = await getAssignmentsForCourse(req.params.courseId);
    res.json(assignments);
  } catch (error: any) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ message: error?.message || "Failed to fetch assignments" });
  }
});

// Student submits an assignment
router.post("/assignments/:assignmentId/submit", isAuthenticated, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== "student") {
      return res.status(403).json({ message: "Forbidden: Students only." });
    }

    const { fileUrl } = req.body;
    if (!fileUrl) {
      return res.status(400).json({ message: "fileUrl is required" });
    }

    const submission = await submitAssignment({
      assignmentId: req.params.assignmentId,
      studentId: user.id,
      fileUrl,
    });

    res.status(201).json(submission);
  } catch (error: any) {
    console.error("Error submitting assignment:", error);
    res.status(500).json({ message: error?.message || "Failed to submit assignment" });
  }
});

// Teacher grades a submission
router.post("/submissions/:submissionId/grade", isAuthenticated, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== "teacher") {
      return res.status(403).json({ message: "Forbidden: Teachers only." });
    }

    const { grade, feedback } = req.body;
    if (grade == null) {
      return res.status(400).json({ message: "grade is required" });
    }

    const updated = await gradeSubmission({
      submissionId: req.params.submissionId,
      grade,
      feedback,
    });

    res.json(updated);
  } catch (error: any) {
    console.error("Error grading submission:", error);
    res.status(500).json({ message: error?.message || "Failed to grade submission" });
  }
});

export default router;
