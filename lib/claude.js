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
