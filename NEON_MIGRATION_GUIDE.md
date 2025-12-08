# 🚀 Migrate Local Database to Neon (Free Tier)

## Step 1: Create Neon Account & Database (5 minutes)

1. **Sign up for Neon** (Free tier - no credit card required)
   - Go to: https://neon.tech
   - Click "Sign up" 
   - Use GitHub or email to register

2. **Create a new project**
   - Click "Create Project"
   - Project name: `eduverse-prototype`
   - Region: Choose closest to you (US East, Europe, Asia)
   - PostgreSQL version: 15 (recommended)
   - Click "Create Project"

3. **Get your connection string**
   - After creation, you'll see a connection string like:
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   - **COPY THIS** - you'll need it in Step 3

## Step 2: Export Your Local Database (2 minutes)

**Option A: Export entire database**
```powershell
# From your project root
cd "d:\VIisual Studio Code\EduVerse\Eduverse-Initial"

# Export your local database
pg_dump -U postgres -d eduverse-dev -F c -f eduverse_backup.dump

# If you get password prompt, enter your PostgreSQL password
```

**Option B: Export as SQL (if pg_dump doesn't work)**
```powershell
# Export as plain SQL
pg_dump -U postgres -d eduverse-dev --clean --if-exists > eduverse_backup.sql
```

## Step 3: Update Environment Variables

**Update `server/.env`:**
```env
# Replace your current DATABASE_URL with Neon connection string
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Keep everything else the same
JWT_SECRET="7ccf1858f946ff4face9da731faa2ea4b9003bbc185724cc2033b7de09ab93e2c20f87aa88cb154fb8f3cf0082622b9a746582363fe2dd54b26e1bd4003df8bc"
NODE_ENV="development"
PORT=3001
CORS_ORIGINS="http://localhost:5173"
# ... rest of your config
```

## Step 4: Restore Database to Neon (3 minutes)

**Option A: If you used .dump format**
```powershell
# Restore to Neon
pg_restore -d "postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require" eduverse_backup.dump
```

**Option B: If you used .sql format**
```powershell
# Restore SQL file to Neon
psql "postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require" < eduverse_backup.sql
```

**Option C: Using Drizzle Push (Recommended for development)**
```powershell
cd server

# This will sync your schema to Neon
npm run db:push
```

## Step 5: Verify Migration (2 minutes)

```powershell
# Test connection to Neon
cd server
npm run dev
```

**Check these things:**
- [ ] Server starts without database errors
- [ ] Login works
- [ ] Data appears in the application
- [ ] Can create new records

**Verify in Neon Dashboard:**
1. Go to https://console.neon.tech
2. Select your project
3. Click "Tables" - you should see all your tables
4. Click "Monitoring" - check connection status

## Step 6: Quick Data Migration Script (If needed)

If you need to migrate just the data (tables already exist):

**Create `migrate-to-neon.js`:**
```javascript
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './server/src/db/schema.js';

const localDb = drizzle(postgres('postgresql://postgres:@localhost:5432/eduverse-dev'));
const neonDb = drizzle(postgres('YOUR_NEON_CONNECTION_STRING'));

async function migrate() {
  console.log('Starting migration...');
  
  // Get all users from local
  const users = await localDb.select().from(schema.users);
  console.log(`Migrating ${users.length} users...`);
  
  // Insert into Neon (with conflict handling)
  for (const user of users) {
    await neonDb.insert(schema.users)
      .values(user)
      .onConflictDoNothing();
  }
  
  // Repeat for other tables as needed
  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch(console.error);
```

```powershell
# Run migration
node migrate-to-neon.js
```

## 🎯 Neon Free Tier Limits (Prototype-Friendly)

✅ **What you get FREE:**
- 0.5 GB storage (plenty for prototype)
- Unlimited queries
- 1 project with 10 branches
- Automatic backups
- SSL connections
- No credit card required

⚠️ **Limitations:**
- Database pauses after 5 minutes of inactivity (auto-resumes on connection)
- 100 hours of active time per month
- Perfect for prototypes and development!

## 🔧 Troubleshooting

### Error: "Connection timeout"
```powershell
# Make sure you included ?sslmode=require in connection string
# Check firewall isn't blocking port 5432
```

### Error: "Password authentication failed"
```powershell
# Copy connection string exactly from Neon dashboard
# Don't URL-encode the password, use it as-is
```

### Error: "Database already exists" during restore
```powershell
# This is okay - Neon creates the database automatically
# Just run the restore command without CREATE DATABASE
```

### Error: "FATAL: too many connections"
```powershell
# Add connection pooling to your DATABASE_URL:
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require&pgbouncer=true"
```

### Server starts but no data appears
```powershell
# Verify schema is synced
cd server
npm run db:push

# Or manually check tables in Neon console
```

## 📊 Quick Comparison

| Feature | Local PostgreSQL | Neon (Free) |
|---------|-----------------|-------------|
| Cost | Free | Free |
| Setup Time | 30+ minutes | 2 minutes |
| Backups | Manual | Automatic |
| Access Anywhere | No (localhost only) | Yes (cloud) |
| SSL | Optional | Required |
| Connection Pooling | Manual | Built-in |
| Auto-pause | No | Yes (saves resources) |

## 🚀 Next Steps After Migration

1. **Update your deployment guide** - Use Neon URL instead of local DB
2. **Share with team** - Anyone can connect to same database
3. **Test deployment** - Neon works same in production
4. **Enable branching** - Create dev/staging/prod branches in Neon

## 💡 Pro Tips

**1. Use Connection Pooling (Recommended)**
```env
# Add pgbouncer=true for better performance
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require&pgbouncer=true"
```

**2. Set up Neon branches for different environments**
- Main branch: Production data
- Dev branch: Development testing
- Staging branch: Pre-production testing

**3. Keep local backup**
```powershell
# Schedule weekly backups
pg_dump -U postgres -d eduverse-dev > backups/weekly_$(Get-Date -Format 'yyyy-MM-dd').sql
```

---

**Estimated Total Time:** 10-15 minutes  
**Difficulty:** Easy  
**Cost:** $0 (Free tier)

✅ **You're now running on cloud infrastructure for free!**
