import { Types } from "mongoose";
import Assignment, { IAssignment } from "../models/Assignment";
import Submission, { ISubmission } from "../models/Submission";

interface CreateAssignmentInput {
  courseId: string;
  title: string;
  instructions?: string;
  dueDate: Date;
}

export async function createAssignment(
  data: CreateAssignmentInput
): Promise<IAssignment> {
  const assignment = await Assignment.create({
    courseId: new Types.ObjectId(data.courseId),
    title: data.title,
    instructions: data.instructions || "",
    dueDate: data.dueDate,
  });

  return assignment;
}

export async function getAssignmentsForCourse(
  courseId: string
): Promise<IAssignment[]> {
  const assignments = await Assignment.find({
    courseId: new Types.ObjectId(courseId),
  }).sort({ createdAt: -1 });

  return assignments;
}

interface SubmitAssignmentInput {
  assignmentId: string;
  studentId: string;
  fileUrl: string;
}

export async function submitAssignment(
  data: SubmitAssignmentInput
): Promise<ISubmission> {
  const existing = await Submission.findOne({
    assignmentId: data.assignmentId,
    studentId: data.studentId,
  });

  if (existing) {
    throw new Error("You have already submitted this assignment.");
  }

  const submission = await Submission.create({
    assignmentId: new Types.ObjectId(data.assignmentId),
    studentId: new Types.ObjectId(data.studentId),
    fileUrl: data.fileUrl,
    submittedAt: new Date(),
    grade: null,
    feedback: null,
  });

  return submission;
}

interface GradeSubmissionInput {
  submissionId: string;
  grade: number;
  feedback?: string;
}

export async function gradeSubmission(
  data: GradeSubmissionInput
): Promise<ISubmission> {
  const submission = await Submission.findById(data.submissionId);
  if (!submission) {
    throw new Error("Submission not found.");
  }

  submission.grade = data.grade;
  submission.feedback = data.feedback || null;
  submission.gradedAt = new Date();

  await submission.save();
  return submission;
}
