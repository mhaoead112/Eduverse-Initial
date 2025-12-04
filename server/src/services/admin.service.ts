import { db } from '../db/index.js';
import { users, enrollments, lessonProgress, courses } from '../../../shared/schema.js';
import { eq, sql, count, desc } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// 1. Create User
export const createUser = async (userData: any) => {
    const { username, fullName, email, password, role } = userData;
    
    // Checks
    const existingEmail = await db.select().from(users).where(eq(users.email, email));
    if (existingEmail.length > 0) throw new Error("Email already in use.");
    const existingUsername = await db.select().from(users).where(eq(users.username, username));
    if (existingUsername.length > 0) throw new Error("Username already in use.");

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    const newUser = await db.insert(users).values({
        username,
        fullName,
        email,
        password: hashedPassword, // Maps to password_hash in schema
        role: role || 'student', 
    }).returning();

    return newUser[0];
};

// 2. Enroll Student
export const enrollStudent = async (studentId: string, courseId: string) => {
    const existing = await db.select().from(enrollments)
        .where(sql`${enrollments.studentId} = ${studentId} AND ${enrollments.courseId} = ${courseId}`);
    
    if (existing.length > 0) throw new Error("Student already enrolled in this course.");

    await db.insert(enrollments).values({
        studentId,
        courseId,
        enrolledAt: new Date()
    });
};

// 3. Reset Password
export const resetUserPassword = async (userId: string, newPassword: string) => {
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId));
};

// 4. Global Progress
export const getGlobalProgress = async () => {
    const progress = await db.execute(sql`
        SELECT 
            u.id as student_id,
            u."full_name" as student_name, -- Note: snake_case for raw SQL selection from DB
            COUNT(lp.id) as completed_lessons
        FROM ${users} u
        LEFT JOIN ${lessonProgress} lp ON u.id = lp.student_id AND lp.is_completed = true
        WHERE u.role = 'student'
        GROUP BY u.id, u."full_name"
    `);
    return progress.rows;
};

// 5. List All Courses
export const listAllCourses = async () => {
    const allCourses = await db.select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        teacherId: courses.teacherId,
        teacherName: users.fullName,
        createdAt: courses.createdAt
    })
    .from(courses)
    .leftJoin(users, eq(courses.teacherId, users.id))
    .orderBy(desc(courses.createdAt));
    return allCourses;
};

// 6. Teacher Activity
export const getTeacherActivity = async () => {
    const teachers = await db.select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
    }).from(users).where(eq(users.role, 'teacher'));

    const teacherActivities = await Promise.all(teachers.map(async (teacher) => {
        const teacherCourses = await db.select({
            id: courses.id,
            title: courses.title,
        }).from(courses).where(eq(courses.teacherId, teacher.id));
        
        const coursesWithEnrollment = await Promise.all(teacherCourses.map(async (course) => {
            const enrollmentCount = await db.select({ count: count(enrollments.studentId) })
                .from(enrollments).where(eq(enrollments.courseId, course.id));
            return { ...course, studentCount: enrollmentCount[0].count };
        }));

        return {
            teacherId: teacher.id,
            teacherName: teacher.fullName,
            totalCourses: teacherCourses.length,
            courses: coursesWithEnrollment
        };
    }));
    return teacherActivities;
};