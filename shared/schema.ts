// shared/schema.ts

import { pgTable, text, varchar, timestamp, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm'; // <-- CRITICAL: Import 'sql' from the main package
import { createId } from '@paralleldrive/cuid2';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// --- ENUMS ---
export const userRoleEnum = pgEnum('user_role', ['student', 'teacher', 'admin', 'parent']);

// --- CORE TABLES (Auth and Users) ---
export const users = pgTable('users', {
    id: text('id').$defaultFn(() => createId()).primaryKey(),
    username: varchar('username', { length: 255 }).notNull().unique(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: text('password_hash').notNull(),
    role: userRoleEnum('role').default('student').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    // emailVerified: boolean('email_verified').default(false).notNull(),
    // emailVerificationToken: text('email_verification_token'),
    // passwordResetToken: text('password_reset_token'),
    // passwordResetExpires: timestamp('password_reset_expires'),
    // preferredRole: userRoleEnum('preferred_role'),
    // lastLogin: timestamp('last_login'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// --- COURSES TABLES (from develop branch) ---
export const courses = pgTable("courses", {
  id: text("id").primaryKey().$defaultFn(() => createId()), 
  title: text("title").notNull(),
  description: text("description"),
  teacherId: text("teacher_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const enrollments = pgTable("enrollments", {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
});

// --- LESSONS TABLES ---
export const lessons = pgTable("lessons", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: text("file_size").notNull(),
  order: text("order").default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// --- ASSIGNMENTS TABLES ---
export const assignments = pgTable("assignments", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  lessonId: text("lesson_id").references(() => lessons.id, { onDelete: 'set null' }),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp('due_date'),
  maxScore: text("max_score").default('100'),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// --- SUBMISSIONS TABLES ---
export const submissions = pgTable("submissions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  assignmentId: text("assignment_id").notNull().references(() => assignments.id, { onDelete: 'cascade' }),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text("content"),
  filePath: text("file_path"),
  fileName: text("file_name"),
  fileType: text("file_type"),
  fileSize: text("file_size"),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  status: text("status").default('submitted').notNull(),
});

// --- GRADES TABLES ---
export const grades = pgTable("grades", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  submissionId: text("submission_id").notNull().references(() => submissions.id, { onDelete: 'cascade' }).unique(),
  score: text("score").notNull(),
  maxScore: text("max_score").default('100'),
  feedback: text("feedback"),
  gradedBy: text("graded_by").references(() => users.id, { onDelete: 'set null' }),
  gradedAt: timestamp('graded_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// --- ANNOUNCEMENTS TABLES ---
export const announcements = pgTable("announcements", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  teacherId: text("teacher_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// --- STAFF TABLES (from auth-feature branch) ---
export const staffProfiles = pgTable("staff_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  title: text("title").notNull(),
  bio: text("bio"),
  email: text("email").unique(),
  phone: text("phone"),
  office: text("office_location"),
  photoUrl: text("photo_url"),
  department: text("department"),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const staffAchievements = pgTable("staff_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull().references(() => staffProfiles.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("award"),
  date: timestamp("date").notNull(),
  organization: text("organization"),
  url: text("url"),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- ZOD SCHEMAS & TYPES ---
// User schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  // lastLogin: true,
  // passwordResetToken: true,
  // passwordResetExpires: true,
  // emailVerificationToken: true,
}).extend({
  username: z.string().min(1, "Username is required"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  passwordHash: z.string().min(1, "Password hash is required"),
  role: z.enum(['student', 'teacher', 'admin', 'parent']).optional(),
  isActive: z.boolean().optional().default(true),
  emailVerified: z.boolean().optional().default(false),
  preferredRole: z.enum(['student', 'teacher', 'admin', 'parent']).optional(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Course schemas
export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(3, "Course title must be at least 3 characters").max(255),
  description: z.string().min(10, "Course description must be at least 10 characters").max(2000),
  teacherId: z.string().min(1, "Teacher ID is required"),
  isPublished: z.boolean().optional().default(false),
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrolledAt: true,
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(1, "Lesson title is required").max(255),
  courseId: z.string().min(1, "Course ID is required"),
  fileName: z.string().min(1, "File name is required"),
  filePath: z.string().min(1, "File path is required"),
  fileType: z.string().min(1, "File type is required"),
  fileSize: z.string().min(1, "File size is required"),
  order: z.string().optional().default('0'),
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(1, "Assignment title is required").max(255),
  courseId: z.string().min(1, "Course ID is required"),
  lessonId: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  maxScore: z.string().optional().default('100'),
  isPublished: z.boolean().optional().default(false),
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  submittedAt: true,
}).extend({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  studentId: z.string().min(1, "Student ID is required"),
  content: z.string().optional(),
  filePath: z.string().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  fileSize: z.string().optional(),
  status: z.string().optional().default('submitted'),
});

export const insertGradeSchema = createInsertSchema(grades).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  gradedAt: true,
}).extend({
  submissionId: z.string().min(1, "Submission ID is required"),
  score: z.string().min(1, "Score is required"),
  maxScore: z.string().optional().default('100'),
  feedback: z.string().optional(),
  gradedBy: z.string().optional(),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  courseId: z.string().min(1, "Course ID is required"),
  teacherId: z.string().min(1, "Teacher ID is required"),
  title: z.string().min(1, "Title is required").max(255),
  content: z.string().min(1, "Content is required"),
  isPinned: z.boolean().optional().default(false),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Grade = typeof grades.$inferSelect;
export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

// Staff schemas
export const insertStaffProfileSchema = createInsertSchema(staffProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStaffAchievementSchema = createInsertSchema(staffAchievements).omit({
  id: true,
  createdAt: true,
});

export type StaffProfile = typeof staffProfiles.$inferSelect;
export type InsertStaffProfile = z.infer<typeof insertStaffProfileSchema>;

export type StaffAchievement = typeof staffAchievements.$inferSelect;
export type InsertStaffAchievement = z.infer<typeof insertStaffAchievementSchema>;

export type UserRole = 'student' | 'teacher' | 'admin' | 'parent';