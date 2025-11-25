import * as dotenv from 'dotenv';
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../db/schema"; // adjust path if needed
// Check that DATABASE_URL exists
dotenv.config();
if (!process.env.DATABASE_URL) {
  throw new Error("FATAL ERROR: DATABASE_URL is not set in your .env file.");
}

// Create a pool using local PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize Drizzle with our schema
export const db = drizzle(pool, { schema });

// Optional: test connection
(async () => {
  try {
    const client = await pool.connect();
    console.log(" Connected to PostgreSQL successfully");
    client.release();
  } catch (err) {
    console.error(" Failed to connect to PostgreSQL:", err);
  }
})();
