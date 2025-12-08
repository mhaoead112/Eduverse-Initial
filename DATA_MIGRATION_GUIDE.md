# Data Migration Guide: Local PostgreSQL → Neon

This guide explains how to migrate your existing data from the local PostgreSQL database to your Neon cloud database.

## Prerequisites

- PostgreSQL installed locally with `pg_dump` and `psql` utilities
- Access to both local and Neon databases
- Existing data in local database (`eduverse-dev`)

## Migration Methods

### Method 1: Using pg_dump and psql (Recommended)

#### Step 1: Export data from local database

```powershell
# Navigate to project root
cd "d:\VIisual Studio Code\EduVerse\Eduverse-Initial"

# Export only the data (no schema) from local database
pg_dump -U postgres -d eduverse-dev --data-only --column-inserts --file="data_export.sql"
```

**Flags explained:**
- `--data-only`: Export only data, not schema (schema already exists in Neon)
- `--column-inserts`: Use INSERT with column names (more compatible)
- `--file`: Output file name

#### Step 2: Import data to Neon database

```powershell
# Set your Neon connection string
$NEON_URL = "postgresql://neondb_owner:npg_e1Lgjvl4rPuI@ep-delicate-snow-a40lr6lt-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Import the data
psql "$NEON_URL" -f data_export.sql
```

---

### Method 2: Export/Import Specific Tables

If you only want to migrate specific tables or have issues with the full dump:

#### Step 1: Export specific tables

```powershell
# Export users table
pg_dump -U postgres -d eduverse-dev --data-only --column-inserts --table=users --file="users_data.sql"

# Export courses table
pg_dump -U postgres -d eduverse-dev --data-only --column-inserts --table=courses --file="courses_data.sql"

# Export enrollments table
pg_dump -U postgres -d eduverse-dev --data-only --column-inserts --table=enrollments --file="enrollments_data.sql"

# Add more tables as needed
```

#### Step 2: Import to Neon

```powershell
$NEON_URL = "postgresql://neondb_owner:npg_e1Lgjvl4rPuI@ep-delicate-snow-a40lr6lt-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

psql "$NEON_URL" -f users_data.sql
psql "$NEON_URL" -f courses_data.sql
psql "$NEON_URL" -f enrollments_data.sql
```

---

### Method 3: Using Node.js Script (If pg_dump not available)

If you don't have PostgreSQL CLI tools installed, use this Node.js migration script:

```powershell
# Create and run the migration script
node server/migrate-data.js
```

See the `migrate-data.js` script created separately.

---

## Important Tables to Migrate (in order)

Migrate tables in this order to respect foreign key constraints:

1. **users** (no dependencies)
2. **courses** (references users.teacher_id)
3. **enrollments** (references users, courses)
4. **lessons** (references courses)
5. **assignments** (references courses, lessons)
6. **submissions** (references assignments, users)
7. **grades** (references submissions, users)
8. **events** (references courses, users)
9. **event_participants** (references events, users)
10. **announcements** (references courses, users)
11. **study_groups** (references courses, users)
12. **group_members** (references study_groups, users)
13. **conversations** (references study_groups)
14. **conversation_participants** (references conversations, users)
15. **messages** (references conversations, users)
16. **message_read_receipts** (references messages, users)
17. **user_presence** (references users)
18. **notifications** (references users)
19. **blocked_users** (references users)
20. **reported_users** (references users)
21. **parent_children** (references users)
22. **attendance** (references users, courses)
23. **study_activity** (references users)
24. **study_streaks** (references users)
25. **push_subscriptions** (references users)

---

## Verification Steps

After migration, verify the data:

```powershell
# Connect to Neon and check row counts
psql "$NEON_URL"

# In the psql prompt:
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL
SELECT 'lessons', COUNT(*) FROM lessons;
```

Compare these counts with your local database:

```powershell
# Connect to local database
psql -U postgres -d eduverse-dev

# Run the same query
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL
SELECT 'lessons', COUNT(*) FROM lessons;
```

---

## Troubleshooting

### Issue: "psql: command not found"

**Solution:** PostgreSQL CLI tools are not installed. Use Method 3 (Node.js script) instead.

### Issue: Foreign key constraint violations

**Solution:** Make sure you import tables in the correct order (see list above).

### Issue: Duplicate key errors

**Solution:** Your Neon database already has data. Either:
- Drop all data first: See "Clean Neon Database" section below
- Or use `--on-conflict-do-nothing` in your import

### Issue: Password authentication failed

**Solution:** Verify your connection string in `.env` file is correct.

---

## Clean Neon Database (Optional)

If you need to start fresh and remove all existing data from Neon:

```sql
-- WARNING: This deletes ALL data in your Neon database!

-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Truncate all tables
TRUNCATE users, courses, enrollments, lessons, assignments, submissions, 
         grades, events, event_participants, announcements, study_groups, 
         group_members, conversations, conversation_participants, messages, 
         message_read_receipts, user_presence, notifications, blocked_users, 
         reported_users, parent_children, attendance, study_activity, 
         study_streaks, push_subscriptions CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';
```

---

## Alternative: Use Neon's Import Tool

Neon also provides a web-based import tool:

1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Go to "Import" tab
4. Upload your `data_export.sql` file
5. Click "Import"

---

## Post-Migration Checklist

- [ ] All tables have correct row counts
- [ ] Test login functionality
- [ ] Test course enrollment
- [ ] Test assignment submission
- [ ] Verify file uploads still work (files in `uploads/` folder)
- [ ] Check study groups and messaging
- [ ] Update `.env` to use Neon permanently
- [ ] Backup local database before deletion

---

## Rollback Plan

If migration fails, you can always switch back to local database:

```env
# In server/.env, change:
DATABASE_URL="postgresql://postgres:password@localhost:5432/eduverse-dev"
```

Then restart the server:
```powershell
npm run dev
```
