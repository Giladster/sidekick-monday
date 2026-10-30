// Loads the same answer library the frontend uses (data.js), so there is one source of truth.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(process.cwd(), "data.js"), "utf8"), ctx);
export const DATA = ctx.window.COACH_DATA;

export const byId = Object.fromEntries(DATA.library.map((e) => [e.id, e]));

// The library as Claude sees it: no matching hints, just approved content.
export const LIBRARY_TEXT = JSON.stringify(
  DATA.library.map(({ id, category, short, worry, answer, next }) => ({ id, category, short, worry, answer, next })),
  null, 1
);

// Card shape the frontend expects.
export function toCard(entry, quote) {
  const { keywords, keyPoints, ...card } = entry;
  return quote ? { ...card, quote } : card;
}
