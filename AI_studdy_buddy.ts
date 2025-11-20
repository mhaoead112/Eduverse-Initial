import * as readline from 'readline';
import * as dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';

// ------------- CONFIG -------------
dotenv.config();

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MYSQL_HOST = process.env.MYSQL_HOST || "localhost";
const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || "3306");
const MYSQL_USER = process.env.MYSQL_USER || "root";
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || "";
const MYSQL_DB = process.env.MYSQL_DB || "eduverse";

// FIX: Logic to handle deprecated model names in .env
let envModel = process.env.EMBED_MODEL;
if (envModel === "gemini-embedding-001" || envModel === "embedding-001") {
    console.warn("⚠️ Warning: Overriding deprecated model in .env with 'text-embedding-004'");
    envModel = "text-embedding-004";
}
// FIX: Default to the working model
const EMBED_MODEL = envModel || "text-embedding-004";

const GEN_MODEL = "gemini-2.5-flash";
const TOP_K = 3;
const MAX_RETRIES = 4;
const BACKOFF_BASE = 1.7;

console.log(`ℹ️ Using Embedding Model: ${EMBED_MODEL}`);

if (!GEMINI_KEY) {
    throw new Error("GEMINI_API_KEY missing. Put GEMINI_API_KEY=... in .env");
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY);

// ------------- NEW: PERSONA DEFINITIONS -------------
interface Persona {
    name: string;
    instruction: string;
}

const PERSONAS: Record<string, Persona> = {
    ALEX: {
        name: "Alex the Fun Learner",
        instruction: `You are Alex, the Fun Learner. 
        Style: Make learning fun! Use jokes, memes, pop-culture references, and entertaining metaphors. 
        Tone: Casual, energetic, and lighthearted. 
        Goal: Explain concepts simply but accurately, ensuring the student enjoys the process.`
    },
    DOCTOR: {
        name: "Dr. Focus",
        instruction: `You are Dr. Focus. 
        Style: Structured, detailed, and methodical. Use bullet points, academic terminology, and clear logical steps.
        Tone: Professional, serious, and precise.
        Goal: Provide deep learning and comprehensive understanding without distractions.`
    },
    COACH: {
        name: "Coach Inspire",
        instruction: `You are Coach Inspire. 
        Style: Act as a personal cheerleader. Use motivating language, affirmations, and high energy.
        Tone: Empowering, confident, and supportive.
        Goal: Keep the student motivated and confident while explaining the material clearly.`
    }
};

// Default Persona
let currentPersona = PERSONAS.ALEX;

// ------------- TYPES -------------
interface ChatMessage {
    role: string;
    text: string;
}

interface LessonChunkRow {
    id: number;
    lesson_id: string;
    chunk_index: number;
    chunk_text: string;
    embedding: string; // JSON string from DB
}

interface ScoredChunk {
    lesson_id: string;
    chunk_index: number;
    text: string;
    score: number;
}

interface LessonGroup {
    lesson_id: string;
    chunks: ScoredChunk[];
}

interface ResponseOutput {
    answer_text?: string;
    used_lessons?: LessonGroup[];
    error?: string;
}

// ------------- SESSION & SAFETY -------------
const chatHistory: ChatMessage[] = [];

const FORBIDDEN_KEYWORDS = [
    "bomb", "explode", "how to kill", "kill ", "suicide", "self-harm", "hard drugs",
    "child sexual", "rape", "porn", "manufacture weapon", "weaponize", "how to make a bomb"
];

function containsForbiddenRequest(text: string): boolean {
    const t = text.toLowerCase();
    return FORBIDDEN_KEYWORDS.some(kw => t.includes(kw));
}

// ------------- UTILS -------------
async function retry<T>(fn: () => Promise<T>, maxTries = MAX_RETRIES): Promise<T> {
    let delay = 1000;
    for (let attempt = 1; attempt <= maxTries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxTries) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= BACKOFF_BASE;
        }
    }
    throw new Error("Unreachable");
}

// ------------- VECTOR MATH -------------
function dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

function magnitude(a: number[]): number {
    return Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
}

function cosineSimilarity(a: number[], b: number[]): number {
    const magA = magnitude(a);
    const magB = magnitude(b);
    if (magA === 0 || magB === 0) return 0.0;
    return dotProduct(a, b) / (magA * magB);
}

// ------------- DATABASE -------------
const pool = mysql.createPool({
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DB,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ------------- EMBEDDING -------------
async function embedQueryGemini(text: string): Promise<number[]> {
    const model = genAI.getGenerativeModel({ model: EMBED_MODEL });
    
    const result = await model.embedContent({
        content: { role: 'user', parts: [{ text }] },
        taskType: TaskType.RETRIEVAL_QUERY
    });
    
    const values = result.embedding.values;
    if (!values) throw new Error("Unexpected embedding response");
    return values;
}

// ------------- RETRIEVAL BY LESSON -------------
async function retrieveTopKByLesson(queryEmb: number[], topK = TOP_K): Promise<LessonGroup[]> {
    const conn = await pool.getConnection();
    let rows: LessonChunkRow[];
    
    try {
        const [result] = await conn.execute<any>('SELECT id, lesson_id, chunk_index, chunk_text, embedding FROM lesson_chunks');
        rows = result as LessonChunkRow[];
    } finally {
        conn.release();
    }

    const scoredChunks: ScoredChunk[] = [];
    
    for (const r of rows) {
        let emb: number[];
        try {
            emb = JSON.parse(r.embedding);
        } catch (e) {
            console.warn(`Failed to parse embedding for chunk ${r.id}`);
            continue;
        }
        
        const score = cosineSimilarity(queryEmb, emb);
        scoredChunks.push({
            lesson_id: r.lesson_id,
            chunk_index: r.chunk_index,
            text: r.chunk_text,
            score: score
        });
    }

    scoredChunks.sort((a, b) => b.score - a.score);

    const lessonsMap = new Map<string, ScoredChunk[]>();
    for (const c of scoredChunks) {
        if (!lessonsMap.has(c.lesson_id)) {
            lessonsMap.set(c.lesson_id, []);
        }
        lessonsMap.get(c.lesson_id)!.push(c);
    }

    const sortedLessons = Array.from(lessonsMap.entries())
        .map(([lessonId, chunks]) => {
            const maxScore = Math.max(...chunks.map(c => c.score));
            return { lesson_id: lessonId, chunks, maxScore };
        })
        .sort((a, b) => b.maxScore - a.maxScore)
        .slice(0, topK);

    return sortedLessons.map(l => ({
        lesson_id: l.lesson_id,
        chunks: l.chunks
    }));
}

// ------------- UPDATED PROMPT LOGIC -------------
function buildPromptByLesson(lessons: LessonGroup[], question: string): string {
    const lessonTexts: string[] = [];
    
    for (const l of lessons) {
        const text = l.chunks
            .map(c => `[Chunk ${c.chunk_index}] ${c.text}`)
            .join("\n\n");
        lessonTexts.push(`Lesson: ${l.lesson_id}\n${text}`);
    }

    const contextBlock = lessonTexts.length > 0 
        ? lessonTexts.join("\n\n") 
        : "/* no lesson context available */";

    const recentHistory = chatHistory.slice(-10);

    // Incorporate the current persona instruction
    return `
${currentPersona.instruction}

Treat each LESSON below as a distinct source of knowledge. 
Use primary lessons first, then other info if needed (highlight as secondary).

LESSONS CONTEXT:
${contextBlock}

CHAT HISTORY:
${JSON.stringify(recentHistory, null, 2)}

STUDENT QUESTION:
${question}

Remember to answer in the voice and style of ${currentPersona.name}.
`;
}

// ------------- GENERATION -------------
async function generateWithGemini(prompt: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: GEN_MODEL });
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
}

// ------------- HIGH-LEVEL FLOW -------------
async function produceAnswer(question: string): Promise<ResponseOutput> {
    question = question.trim();
    if (!question) return { error: "Empty question." };
    
    if (containsForbiddenRequest(question)) {
        return { error: "Unsafe or disallowed request." };
    }

    let qEmb: number[];
    let lessons: LessonGroup[];

    try {
        qEmb = await retry(() => embedQueryGemini(question));
        lessons = await retrieveTopKByLesson(qEmb, TOP_K);
    } catch (e) {
        return { error: `Embedding/Retrieval failed: ${e}` };
    }

    const prompt = buildPromptByLesson(lessons, question);
    let gen: string;

    try {
        gen = await retry(() => generateWithGemini(prompt));
    } catch (e) {
        return { error: `Generation failed: ${e}`, used_lessons: lessons };
    }

    chatHistory.push({ role: "user", text: question });
    chatHistory.push({ role: "assistant", text: gen });

    return { answer_text: gen, used_lessons: lessons };
}

// ------------- CLI MAIN -------------
async function main() {
    console.log("✅ AI Study Buddy Loaded.");
    console.log("Type 'switch alex', 'switch doctor', or 'switch coach' to change personalities.");
    console.log("Type 'exit' to quit.\n");
    console.log(`Current Buddy: ${currentPersona.name}\n`);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const ask = (q: string) => new Promise<string>(resolve => rl.question(q, resolve));

    while (true) {
        let user = await ask(`[${currentPersona.name}] You: `);
        user = user.trim();

        if (!user) continue;

        // Handle Exit
        if (user.toLowerCase() === "exit") {
            console.log("Goodbye.");
            rl.close();
            process.exit(0);
        }

        // Handle Character Switching
        const lowerUser = user.toLowerCase();
        if (lowerUser.startsWith("switch")) {
            if (lowerUser.includes("alex")) {
                currentPersona = PERSONAS.ALEX;
                console.log(`✨ Switched to: ${currentPersona.name}\n`);
                continue;
            } else if (lowerUser.includes("doctor") || lowerUser.includes("dr")) {
                currentPersona = PERSONAS.DOCTOR;
                console.log(`🩺 Switched to: ${currentPersona.name}\n`);
                continue;
            } else if (lowerUser.includes("coach")) {
                currentPersona = PERSONAS.COACH;
                console.log(`📣 Switched to: ${currentPersona.name}\n`);
                continue;
            } else {
                console.log("⚠️ Unknown character. Try: 'switch alex', 'switch doctor', or 'switch coach'.");
                continue;
            }
        }

        // Safety check
        if (containsForbiddenRequest(user)) {
            console.log("Assistant: Unsafe request detected.");
            continue;
        }

        // Generate Answer
        console.log(`... ${currentPersona.name} is thinking ...`);
        const out = await produceAnswer(user);

        if (out.error) {
            console.log("Assistant:", out.error);
            continue;
        }

        console.log(`\n${currentPersona.name}:\n`);
        console.log(out.answer_text);
        console.log("\n---\n");
    }
}

main().catch(console.error);
