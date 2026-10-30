import { route } from "../lib/http.js";
import { db } from "../lib/db.js";
import { DATA } from "../lib/library.js";

// The most common objections we've heard, for the Ask chips.
// Groups by library entry and shows the shortest real wording of each.
export default route(async () => {
  const sql = await db();
  const rows = await sql`
    SELECT category, (array_agg(text ORDER BY length(text)))[1] AS text, count(*)::int AS n
    FROM objections
    WHERE library_id IS NOT NULL AND length(text) <= 80
    GROUP BY library_id, category
    ORDER BY n DESC LIMIT 4`;
  if (rows.length < 4) {
    return DATA.insights.trending.slice(0, 4).map((t) => ({ text: t.example, category: t.category }));
  }
  return rows.map(({ text, category }) => ({ text, category }));
});
