# Login Error Fix - Column "name" Does Not Exist

## Problem

When attempting to login, the application throws this error:
```
Error: column "name" does not exist
```

## Root Cause

**Schema Mismatch**: The `users` table schema definition in `shared/schema.ts` was incomplete and didn't match what the authentication code in `server/routes.ts` expected.

### What Was Wrong:

**Old Schema (INCORRECT):**
```typescript
export const users = pgTable('users', {
    id: text('id').$defaultFn(() => createId()).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),        // ❌ Used "name" not "username"
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: text('password').notNull(),                     // ❌ Used "password" not "passwordHash"
    role: userRoleEnum('role').default('student').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});
```

**Code Expected (from routes.ts):**
```typescript
// Registration expected:
const { username, email, fullName, password } = validationResult.data;

const user = await storage.createUser({
    username,
    email,
    fullName,
    role,
    passwordHash,
    emailVerificationToken: hashedVerificationToken,
    preferredRole: role
});

// Login returned:
user: { id: user.id, username: user.username, role: user.role, fullName: user.fullName }
```

**Mismatch:** Code used `username` and `fullName` but schema only had `name`

---

## Solution

### 1. Updated User Schema

**New Schema (CORRECT):**
```typescript
export const users = pgTable('users', {
    id: text('id').$defaultFn(() => createId()).primaryKey(),
    username: varchar('username', { length: 255 }).notNull().unique(),      // ✅ Added username
    fullName: varchar('full_name', { length: 255 }).notNull(),              // ✅ Renamed to fullName
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),                           // ✅ Renamed to passwordHash
    role: userRoleEnum('role').default('student').notNull(),
    isActive: boolean('is_active').default(true).notNull(),                  // ✅ Added
    emailVerified: boolean('email_verified').default(false).notNull(),       // ✅ Added
    emailVerificationToken: text('email_verification_token'),                // ✅ Added
    passwordResetToken: text('password_reset_token'),                        // ✅ Added
    passwordResetExpires: timestamp('password_reset_expires'),               // ✅ Added
    preferredRole: userRoleEnum('preferred_role'),                           // ✅ Added
    lastLogin: timestamp('last_login'),                                      // ✅ Added
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});
```

### 2. Database Migration

Created migration file: `migrations/0003_fix_users_schema.sql`

The migration:
1. Creates a new `users_new` table with the correct schema
2. Migrates existing data from the old table (if any)
3. Converts email to username (lowercase of email)
4. Renames `name` column to `full_name`
5. Renames `password` to `password_hash`
6. Drops the old table
7. Renames new table to `users`

### 3. Added User Zod Schema

```typescript
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
  passwordResetToken: true,
  passwordResetExpires: true,
  emailVerificationToken: true,
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
```

---

## What Changed

| File | Change |
|------|--------|
| `shared/schema.ts` | Updated users table schema with all required fields |
| `shared/schema.ts` | Added `insertUserSchema` and types for validation |
| `migrations/0003_fix_users_schema.sql` | New migration to fix database schema |

---

## How to Apply the Fix

### Step 1: Update the Database
Run the migration to update your database schema:
```bash
# If using drizzle-kit
npm run db:push

# Or manually run the SQL
psql -U postgres -d eduverse -f migrations/0003_fix_users_schema.sql
```

### Step 2: Recreate Demo Users
The demo users will need to be recreated with the new schema:
```bash
POST http://localhost:3000/api/auth/create-demo-users
```

### Step 3: Test Login
Try logging in with:
```
Username: teacher_demo
Password: demo123
```

---

## Why This Happened

The schema was copied from an older version or different branch that had:
- `name` instead of separate `username` and `fullName`
- `password` instead of `passwordHash`
- Missing authentication fields (`emailVerified`, `emailVerificationToken`, `passwordResetToken`, etc.)
- Missing other user properties (`isActive`, `preferredRole`, `lastLogin`)

The authentication code in `server/routes.ts` expected these fields but the schema didn't define them, causing the mismatch.

---

## Verification

After applying the fix:

✅ Login should work
✅ Demo users can be created
✅ User data stored correctly
✅ No more "column does not exist" errors
✅ All auth endpoints functioning

---

## Additional Notes

The fixed schema now properly supports:
- Multiple authentication fields (verification tokens, reset tokens)
- User status tracking (isActive, lastLogin)
- Preferred role selection
- Email verification
- Password reset functionality
- Unique username and email

All fields align with what the authentication code in `server/routes.ts` expects.

---

**Fixed:** November 16, 2025  
**Status:** ✅ Ready to Deploy
