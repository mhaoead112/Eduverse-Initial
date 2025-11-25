import { db } from "../db/index.js";
import { assignments, submissions, courses } from "../../../shared/schema.js";
import { and, desc, eq } from "drizzle-orm";

export interface CreateAssignmentInput {
  courseId: string;
  title: string;
  instructions?: string;
  dueDate: Date;
}

export async function createAssignment(data: CreateAssignmentInput) {
  const [created] = await db
    .insert(assignments)
    .values({
      courseId: data.courseId,
      title: data.title,
      instructions: data.instructions || "",
      dueDate: data.dueDate,
    })
    .returning();

  if (!created) throw new Error("Failed to create assignment");
  return created;
}

export async function getAssignmentsForCourse(courseId: string) {
  return db
    .select()
    .from(assignments)
    .where(eq(assignments.courseId, courseId))
    .orderBy(desc(assignments.createdAt));
}

export interface SubmitAssignmentInput {
  assignmentId: string;
  studentId: string;
  fileUrl: string;
}

export async function submitAssignment(data: SubmitAssignmentInput) {
  const existing = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.assignmentId, data.assignmentId),
        eq(submissions.studentId, data.studentId)
      )
    );

  if (existing.length > 0) {
    throw new Error("You have already submitted this assignment.");
  }

  const [created] = await db
    .insert(submissions)
    .values({
      assignmentId: data.assignmentId,
      studentId: data.studentId,
      fileUrl: data.fileUrl,
      submittedAt: new Date(),
    })
    .returning();

  if (!created) throw new Error("Failed to create submission");
  return created;
}

export interface GradeSubmissionInput {
  submissionId: string;
  grade: number;
  feedback?: string;
}

export async function gradeSubmission(data: GradeSubmissionInput) {
  const [updated] = await db
    .update(submissions)
    .set({
      grade: data.grade,
      feedback: data.feedback ?? null,
      gradedAt: new Date(),
    })
    .where(eq(submissions.id, data.submissionId))
    .returning();

  if (!updated) throw new Error("Submission not found.");
  return updated;
}

export async function getStudentProgress(studentId: string) {
  const studentAssignments = await db
    .select({
      id: assignments.id,
      title: assignments.title,
      courseTitle: courses.title,
      dueDate: assignments.dueDate,
    })
    .from(assignments)
    .leftJoin(courses, eq(assignments.courseId, courses.id));

  const studentSubmissions = await db
    .select()
    .from(submissions)
    .where(eq(submissions.studentId, studentId))
    .orderBy(desc(submissions.submittedAt));

  const studentGrades = await db
    .select({
      id: submissions.id,
      courseTitle: courses.title,
      assignmentTitle: assignments.title,
      score: submissions.grade,
      maxScore: submissions.maxScore,
      letterGrade: submissions.letterGrade,
    })
    .from(submissions)
    .leftJoin(assignments, eq(submissions.assignmentId, assignments.id))
    .leftJoin(courses, eq(assignments.courseId, courses.id))
    .where(and(eq(submissions.studentId, studentId)));

  return {
    assignments: studentAssignments,
    submissions: studentSubmissions,
    grades: studentGrades,
  };
}
