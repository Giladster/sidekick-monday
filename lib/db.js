import { neon } from "@neondatabase/serverless";
import { DATA } from "./library.js";

export const sql = neon(process.env.DATABASE_URL);

let ready;
// Creates the table on first use and seeds it with the starter practice pool.
export function db() {
  ready ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS objections (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      library_id TEXT,
      category TEXT,
      source TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM objections`;
    if (n === 0) {
      for (const text of DATA.practicePool) {
        await sql`INSERT INTO objections (text, source) VALUES (${text}, 'seed')`;
      }
    }
    return sql;
  })().catch((e) => { ready = undefined; throw e; });
  return ready;
}

// Every objection we hear goes into the pool. Never blocks the answer.
export async function saveObjection(text, entry, source) {
  try {
    const q = await db();
    // Skip repeats of the same words within 10 minutes (page reloads, double clicks).
    await q`INSERT INTO objections (text, library_id, category, source)
            SELECT ${text}, ${entry?.id ?? null}, ${entry?.category ?? "New"}, ${source}
            WHERE NOT EXISTS (SELECT 1 FROM objections
              WHERE text = ${text} AND created_at > now() - interval '10 minutes')`;
  } catch (e) {
    console.error("saveObjection failed", e);
  }
}
