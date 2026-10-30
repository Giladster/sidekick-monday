import { askJSON, FAST, SMART } from "./claude.js";
import { DATA, byId, toCard } from "./library.js";
import { saveObjection } from "./db.js";

const ids = DATA.library.map((e) => e.id);

// Answer one objection with a full card, tailored to how the customer said it.
export async function answer(text, source = "ask") {
  const out = await askJSON({
    model: SMART,
    effort: "low",
    task: `A customer said the text in <input>. Pick the library entry that best matches the worry behind it, or "none" if no entry fits.
Then write what the CSM should say: 2 to 3 short, warm sentences that answer this customer's exact words, using only facts from that entry. If "none", answer with one good discovery question instead and do not state any facts.`,
    input: text,
    schema: {
      type: "object",
      properties: {
        id: { type: "string", enum: [...ids, "none"] },
        answer: { type: "string" }
      },
      required: ["id", "answer"],
      additionalProperties: false
    }
  });
  const entry = byId[out.id] || DATA.fallback;
  await saveObjection(text, byId[out.id], source);
  return { ...toCard(entry, text), answer: out.answer };
}

// Find every objection in an email or transcript. No answers yet.
export async function find(text) {
  const out = await askJSON({
    model: FAST,
    task: `The <input> is an email or call transcript from a customer. List every objection, worry, or pushback about AI features, quoted exactly as written (one sentence each). Skip greetings and small talk.`,
    input: text,
    schema: {
      type: "object",
      properties: {
        objections: {
          type: "array",
          items: {
            type: "object",
            properties: { quote: { type: "string" }, id: { type: "string", enum: [...ids, "none"] } },
            required: ["quote", "id"],
            additionalProperties: false
          }
        }
      },
      required: ["objections"],
      additionalProperties: false
    }
  });
  await Promise.all(out.objections.map((o) => saveObjection(o.quote, byId[o.id], "email")));
  return out.objections.map(({ quote }) => ({ quote }));
}

// Live call: is this line an objection? Fast path, library card as is.
export async function detect(line) {
  const out = await askJSON({
    model: FAST,
    task: `The <input> is one line a customer said on a live call. Is it an objection or worry about AI? If yes, pick the matching library entry, or "none" if it is an objection that no entry covers.`,
    input: line,
    schema: {
      type: "object",
      properties: {
        is_objection: { type: "boolean" },
        id: { type: "string", enum: [...ids, "none"] }
      },
      required: ["is_objection", "id"],
      additionalProperties: false
    }
  });
  if (!out.is_objection) return null;
  await saveObjection(line, byId[out.id], "live");
  return toCard(byId[out.id] || DATA.fallback, line);
}

// Practice: score the CSM's reply out of 10.
export async function score(objection, reply) {
  const out = await askJSON({
    model: SMART,
    effort: "low",
    task: `A CSM is practicing. The customer objection was: "${objection}"
The CSM's reply is in <input>. Pick the matching library entry, then score the reply from 1 to 10 on three things: did they acknowledge the worry, was the answer accurate to the library, and did they offer a concrete next step.
Give one short thing they did well and one short, specific tip. Write like a friendly coach, under 15 words each.`,
    input: reply,
    schema: {
      type: "object",
      properties: {
        id: { type: "string", enum: [...ids, "none"] },
        score: { type: "integer" },
        good: { type: "string" },
        tip: { type: "string" }
      },
      required: ["id", "score", "good", "tip"],
      additionalProperties: false
    }
  });
  const entry = byId[out.id] || DATA.fallback;
  return {
    score: Math.max(1, Math.min(10, out.score)),
    good: out.good,
    tip: out.tip,
    model: entry.answer
  };
}
