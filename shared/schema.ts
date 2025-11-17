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
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;

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