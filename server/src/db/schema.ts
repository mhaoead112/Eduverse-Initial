import { pgTable, text, boolean, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

// --- ENUMS ---
export const userRoleEnum = pgEnum('user_role', ['student', 'teacher', 'admin', 'parent']);

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  username: varchar("username", { length: 255 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password_hash").notNull(),
  role: userRoleEnum("role").default("student").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const courses = pgTable("courses", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  title: text("title").notNull(),
  description: text("description"),
  teacherId: text("teacher_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const enrollments = pgTable("enrollments", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
});

export const lessons = pgTable("lessons", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: text("file_size").notNull(),
  order: text("order").default('0'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const assignments = pgTable("assignments", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  lessonId: text("lesson_id").references(() => lessons.id, { onDelete: 'set null' }),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  maxScore: text("max_score").default('100'),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const submissions = pgTable("submissions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  assignmentId: text("assignment_id").notNull().references(() => assignments.id, { onDelete: 'cascade' }),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text("content"),
  filePath: text("file_path"),
  fileName: text("file_name"),
  fileType: text("file_type"),
  fileSize: text("file_size"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  status: text("status").default('submitted').notNull(),
});

export const grades = pgTable("grades", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  submissionId: text("submission_id").notNull().references(() => submissions.id, { onDelete: 'cascade' }).unique(),
  score: text("score").notNull(),
  maxScore: text("max_score").default('100'),
  feedback: text("feedback"),
  gradedBy: text("graded_by").references(() => users.id, { onDelete: 'set null' }),
  gradedAt: timestamp("graded_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const announcements = pgTable("announcements", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  teacherId: text("teacher_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});
