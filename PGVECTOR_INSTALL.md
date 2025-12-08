# pgvector Installation Guide for Windows

## Method 1: Using Pre-built Binaries (Recommended)

1. Download pgvector Windows binaries from:
   https://github.com/pgvector/pgvector/releases

2. Extract the files

3. Copy the files to your PostgreSQL installation:
   - Copy `vector.dll` to: `C:\Program Files\PostgreSQL\16\lib\`
   - Copy `vector--0.x.x.sql` and `vector.control` to: `C:\Program Files\PostgreSQL\16\share\extension\`

4. Restart PostgreSQL service:
   ```powershell
   Restart-Service postgresql-x64-16
   ```

5. Enable the extension in your database:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

## Method 2: Using Docker PostgreSQL with pgvector

If you prefer Docker:

```bash
docker run -d \
  --name eduverse-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=eduverse \
  -p 5432:5432 \
  ankane/pgvector
```

Then run the migration scripts.

## Method 3: Cloud Database (Easiest)

Use a cloud provider that includes pgvector:
- **Neon** (https://neon.tech) - FREE tier, pgvector included
- **Supabase** (https://supabase.com) - FREE tier, pgvector included
- **Render** (https://render.com) - Managed PostgreSQL with pgvector

### Using Neon (Recommended):
1. Go to https://console.neon.tech
2. Create new project
3. Copy connection string
4. Update `.env.ai` with new database credentials
5. Run: `CREATE EXTENSION vector;`

## Verify Installation

After installing, verify with:

```sql
SELECT * FROM pg_available_extensions WHERE name = 'vector';
```

Should return a row showing the vector extension.

## Troubleshooting

**"extension "vector" is not available"**
- The pgvector files aren't in the right PostgreSQL directory
- Try Method 2 (Docker) or Method 3 (Cloud)

**"permission denied"**
- Run as administrator when copying files
- Or use cloud database (easier)

## Quick Test

After installation:

```sql
CREATE EXTENSION vector;
CREATE TABLE test_vectors (id bigserial PRIMARY KEY, vec vector(3));
INSERT INTO test_vectors (vec) VALUES ('[1,2,3]');
SELECT * FROM test_vectors;
DROP TABLE test_vectors;
```

If this works, pgvector is properly installed!
