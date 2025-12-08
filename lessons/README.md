# Lessons Folder

Place your educational materials here for the AI Study Buddy to process.

## Supported File Types:
- **PDF** (.pdf) - Textbooks, lecture notes, articles
- **DOCX** (.docx) - Word documents, assignments
- **PPTX** (.pptx) - PowerPoint presentations, slides
- **TXT** (.txt) - Plain text notes

## How to Add Lessons:

1. Copy your lesson files (PDF, DOCX, PPTX, TXT) to this folder
2. Run the digestion script:
   ```bash
   npx tsx Digestion.ts
   ```
3. The AI will process and index all files
4. Students can now ask questions about the content!

## Example Files to Add:
- `Introduction_to_Python.pdf`
- `JavaScript_Basics.docx`
- `History_Lecture_1.pptx`
- `Math_Notes.txt`

## Tips:
- Use descriptive filenames (they become lesson IDs)
- Files are only re-processed if they change
- Each file is chunked into ~1000 character pieces for better search
- The AI can search across all uploaded lessons simultaneously
