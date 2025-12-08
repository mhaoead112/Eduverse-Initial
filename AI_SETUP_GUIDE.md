# AI Study Buddy - Quick Setup Guide

## 1. Database Setup

Run the SQL script to set up AI tables:
```bash
psql -U postgres -d eduverse -f setup_ai_database.sql
```

Or in pgAdmin/DBeaver, execute `setup_ai_database.sql`

## 2. Get Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Create a new API key
3. Copy it to `.env.ai` file:
   ```
   GEMINI_API_KEY=your_key_here
   ```

## 3. Configure Environment

Edit `.env.ai` and update:
- `AI_DB_PASSWORD` (your postgres password)
- `GEMINI_API_KEY` (from step 2)

## 4. Install pgvector Extension

In PostgreSQL command line or pgAdmin:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## 5. Process Lesson Files

Upload lesson files (PDF, DOCX, PPTX, TXT) to `uploads/lessons` folder, then run:

```bash
npx tsx Digestion.ts
```

This will:
- Extract text from all lesson files
- Create embeddings with Gemini AI
- Store them in the database

## 6. Start the Server

```bash
cd server
npm run dev
```

## 7. Test the AI

1. Login as a student
2. Click "AI Study Buddy" in the sidebar
3. Ask questions about your lessons!

## Example Questions:

- "Explain the main concept from the Python tutorial"
- "What are the key points about JavaScript functions?"
- "Can you summarize the history lesson?"

## Troubleshooting:

**"AI service not configured"**
- Make sure `GEMINI_API_KEY` is set in `.env.ai`

**"No results found"**
- Run `Digestion.ts` to process lesson files
- Check if lesson files exist in `uploads/lessons`

**"Database connection error"**
- Verify database credentials in `.env.ai`
- Make sure pgvector extension is installed

## How to Add More Lessons:

1. Add PDF/DOCX/PPTX/TXT files to `uploads/lessons`
2. Run: `npx tsx Digestion.ts`
3. The AI will now know about the new content!

## Personas:

- **Alex the Fun Learner** (default) - Casual, jokes, fun explanations
- **Dr. Focus** - Professional, structured, academic style
- **Coach Inspire** - Motivational, energetic, supportive

Switch personas in the dropdown to change the AI's teaching style!
