import Anthropic from "@anthropic-ai/sdk";
import { LIBRARY_TEXT } from "./library.js";

const client = new Anthropic();

export const FAST = "claude-haiku-5-5";   // live detect, finding objections
export const SMART = "claude-sonnet-5-5"; // answers and practice scoring

const SYSTEM = `You are Sidekick, a coach for monday.com Customer Success Managers (CSMs).
Customers raise objections about monday.com AI features. You only use facts from the approved answer library below. Never invent product facts, limits, prices, or policies.

Approved answer library (JSON):
${LIBRARY_TEXT}`;

// One call, JSON out. The library sits in a cached system prompt.
export async function askJSON({ model, task, input, schema, effort = "low" }) {
  const res = await client.messages.create({
    model,
    max_tokens: 2000,
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    output_config: { effort, format: { type: "json_schema", schema } },
    messages: [{ role: "user", content: `${task}\n\n<input>\n${input}\n</input>` }]
  });
  if (res.stop_reason === "refusal") throw new Error("Claude declined the request");
  const text = res.content.find((b) => b.type === "text")?.text;
  return JSON.parse(text);
}

// For an objection the library doesn't cover: search monday.com's help pages
// and return the 1 or 2 articles that best fit. Links come only from real
// search results, so we never show a made-up URL.
const sourceCache = new Map();
export async function searchSources(objection) {
  const key = objection.trim().toLowerCase();
  if (sourceCache.has(key)) return sourceCache.get(key);
  const res = await client.messages.create({
    model: SMART,
    max_tokens: 4000,
    output_config: { effort: "low" },
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 2, allowed_domains: ["monday.com"] }],
    messages: [{
      role: "user",
      content: `A customer raised this worry about monday.com AI: "${objection}"
Search monday.com's help center (support.monday.com) for the articles that best answer it. Read them, then reply with only the URLs of the 1 or 2 most relevant articles, one per line. Skip blog posts and pages that don't address the worry.`
    }]
  });
  const found = [];
  for (const b of res.content) {
    if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
      for (const r of b.content) if (r.type === "web_search_result") found.push({ title: cleanTitle(r.title), url: r.url });
    }
  }
  const reply = res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
  const picked = found.filter((r, i) => reply.includes(r.url) && found.findIndex((x) => x.url === r.url) === i);
  const sources = (picked.length ? picked : found.filter((r) => r.url.includes("support.monday.com"))).slice(0, 2);
  sourceCache.set(key, sources);
  return sources;
}

const cleanTitle = (t = "") => t.split(/\s[–|-]\s/)[0].trim() || "monday.com help";
