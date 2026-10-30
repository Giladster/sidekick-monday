import { askJSON, searchSources, FAST, SMART } from "./claude.js";
import { DATA, byId, toCard } from "./library.js";
import { saveObjection } from "./db.js";

const ids = DATA.library.map((e) => e.id);

// Answer one objection with a full card, tailored to how the customer said it.
export async function answer(text, source = "ask") {
  const out = await askJSON({
    model: SMART,
    effort: "low",
    task: `A customer said the text in <input>. Pick the library entry that best matches the worry behind it, or "none" if no entry fits.
Then write what the CSM should say: 2 to 3 short, warm sentences that answer this customer's exact words, using only facts from that entry.
Also write "short": the one line the CSM says first, conversational, under 15 words (for example "There's a monthly cap, so AI just pauses when you hit it.").
If "none": do not state any product facts. Make "short" the exact discovery question to ask this customer, written out in full and in quotes, tailored to their words. Make "answer" 1 to 2 sentences on why to ask it and what to listen for.
Also write one next step for this exact situation: a quick, practical tip for the CSM, under 15 words, starting with a verb.`,
    input: text,
    schema: {
      type: "object",
      properties: {
        id: { type: "string", enum: [...ids, "none"] },
        short: { type: "string" },
        answer: { type: "string" },
        next: { type: "string" }
      },
      required: ["id", "short", "answer", "next"],
      additionalProperties: false
    }
  });
  const entry = byId[out.id] || DATA.fallback;
  // Not in the library: look up real help articles on the web instead.
  const [web] = await Promise.all([
    entry === DATA.fallback ? searchSources(text).catch(() => []) : null,
    saveObjection(text, byId[out.id], source)
  ]);
  const card = { ...toCard(entry, text), short: out.short || entry.short, answer: out.answer, next: out.next || entry.next };
  if (web && web.length) card.sources = web;
  return card;
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

// Rewrite one answer the way the CSM asks ("shorter", "more reasons", "warmer").
export async function rewrite(quote, answer, request) {
  const out = await askJSON({
    model: SMART,
    effort: "low",
    task: `A customer said: "${quote}"
The current answer is: "${answer}"
The CSM wants it changed like this (in <input>). Rewrite the answer. Keep it short and warm, 2 to 4 sentences, and use only facts from the library.`,
    input: request,
    schema: {
      type: "object",
      properties: { answer: { type: "string" } },
      required: ["answer"],
      additionalProperties: false
    }
  });
  return { answer: out.answer };
}

// Draft one reply email that answers every objection in the customer's email.
// Each answer part points back to the objection it answers, so the app can link them.
export async function draft(email, objections) {
  const out = await askJSON({
    model: SMART,
    effort: "low",
    task: `The <input> is a customer's email. The objections in it, numbered from 0, are: ${JSON.stringify(objections)}.
Write the CSM's reply email: a short friendly greeting, then one short paragraph per objection (in order, using only library facts, conversational), then a closing with one clear next step (usually a small pilot). Plain text, under 180 words in total. Sign off as "Hen".`,
    input: email,
    schema: {
      type: "object",
      properties: {
        subject: { type: "string" },
        greeting: { type: "string" },
        parts: {
          type: "array",
          items: {
            type: "object",
            properties: { objection: { type: "integer" }, text: { type: "string" } },
            required: ["objection", "text"],
            additionalProperties: false
          }
        },
        closing: { type: "string" }
      },
      required: ["subject", "greeting", "parts", "closing"],
      additionalProperties: false
    }
  });
  return out;
}
