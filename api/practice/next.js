import { route } from "../../lib/http.js";
import { db } from "../../lib/db.js";

// A random objection from the pool of everything we've heard.
export default route(async ({ exclude }) => {
  const sql = await db();
  const rows = await sql`SELECT text FROM objections
    WHERE text <> ${exclude || ""} AND length(text) BETWEEN 15 AND 300
    ORDER BY random() LIMIT 1`;
  return { objection: rows[0]?.text };
});
