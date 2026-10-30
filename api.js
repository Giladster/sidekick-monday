// CoachAPI: the only place the UI talks to the "engine".
// On the deployed site it calls the real backend (/api on Vercel).
// Opened as a local file, or with ?mock in the URL, it runs on mock data.
// If a real call fails, that one call falls back to the mock so the demo never breaks.
(function () {
  const API_BASE = ""; // same origin when served from Vercel
  const D = window.COACH_DATA;

  // Card shape returned everywhere:
  // { id, category, worry, answer, next, sources: [{ title, url }], quote? }

  async function post(path, body) {
    const res = await fetch(API_BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error("Server error " + res.status);
    return res.json();
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  function score(text, entry) {
    const t = text.toLowerCase();
    return entry.keywords.reduce((n, k) => n + (new RegExp("\\b" + esc(k) + "\\b").test(t) ? 1 : 0), 0);
  }

  function bestMatch(text) {
    let best = null, top = 0;
    for (const e of D.library) {
      const s = score(text, e);
      if (s > top) { top = s; best = e; }
    }
    return best;
  }

  function toCard(entry, quote) {
    const { keywords, keyPoints, ...card } = entry;
    return quote ? { ...card, quote } : card;
  }

  const mock = {
    // Chat: one objection in, one card out.
    async answer(text) {
      await wait(700);
      return toCard(bestMatch(text) || D.fallback, text);
    },

    // Email / transcript: find every objection, no answers yet.
    async findObjections(text) {
      await wait(600);
      const sentences = text.replace(/\s+/g, " ").match(/[^.!?]+[.!?]?/g) || [];
      return sentences
        .map((s) => s.trim())
        .filter((s) => s.length > 8 && bestMatch(s))
        .map((quote) => ({ quote }));
    },

    // Live call: one transcript line in, a card or null out.
    async detect(line) {
      await wait(300);
      const m = bestMatch(line);
      return m ? toCard(m, line) : null;
    },

    // Practice: a random objection from the collected pool.
    async practiceNext(exclude) {
      await wait(250);
      const pool = D.objections.map((o) => o.text).filter((q) => q !== exclude);
      return { objection: pool[Math.floor(Math.random() * pool.length)] };
    },

    // Practice: score the CSM's reply out of 10.
    async scorePractice(objection, reply) {
      await wait(900);
      const entry = bestMatch(objection) || D.fallback;
      const r = reply.toLowerCase();
      const hits = entry.keyPoints.filter((alts) => alts.some((a) => r.includes(a)));
      const missed = entry.keyPoints.filter((p) => !hits.includes(p));
      const mentionsNext = /pilot|next step|let's|lets|book|send|show/.test(r);
      let s = 3 + hits.length * 2 + (mentionsNext ? 2 : 0) + (reply.length > 80 ? 1 : 0);
      s = Math.max(1, Math.min(10, s));
      return {
        score: s,
        good: hits.length ? "You hit the key point." : reply.length > 40 ? "Clear and calm tone." : "You kept it short.",
        tip: missed.length
          ? "Mention “" + missed[0][0] + "”."
          : mentionsNext ? "Strong. Keep it this short." : "End with a next step, like a small pilot.",
        model: entry.answer
      };
    },

    // Rewrite an answer the way the CSM asks.
    async rewrite(quote, answer, request) {
      await wait(800);
      const e = bestMatch(quote) || D.fallback;
      return { answer: e.answer + " " + e.next };
    },

    // Draft one reply email covering every objection.
    async draft(email, objections) {
      await wait(900);
      const name = (email.match(/^\s*(?:Hi|Hello|Hey)?\s*[\s\S]*?\n\s*([A-Z][a-z]+)\s*$/) || [])[1] || "there";
      const parts = objections.map((q) => (bestMatch(q) || D.fallback).answer);
      return {
        subject: "Re: your questions about monday AI",
        body: "Hi " + name + ",\n\nThanks for the honest questions. Here are quick answers.\n\n" +
          parts.map((p) => "\u2022 " + p).join("\n\n") +
          "\n\nWould a small 2-week pilot with 2 to 5 people and a credit cap work as a next step? Happy to set it up together.\n\nBest,\nHen"
      };
    },

    // Most common objections right now (from analytics), for the Ask chips.
    async common() {
      await wait(150);
      return D.insights.trending.slice(0, 4).map((t) => ({ text: t.example, category: t.category }));
    },

    // Analytics (mock).
    async insights() {
      await wait(200);
      return D.insights;
    }
  };

  const real = {
    answer: (text) => post("/api/answer", { text }),
    findObjections: (text) => post("/api/find", { text }),
    detect: (line) => post("/api/detect", { line }),
    practiceNext: (exclude) => post("/api/practice/next", { exclude }),
    scorePractice: (objection, reply) => post("/api/practice/score", { objection, reply }),
    rewrite: (quote, answer, request) => post("/api/rewrite", { quote, answer, request }),
    draft: (email, objections) => post("/api/draft", { email, objections }),
    common: () => post("/api/common", {}),
    insights: () => post("/api/insights", {})
  };

  const useReal = location.protocol.startsWith("http") && !/[?&]mock\b/.test(location.search);
  const withFallback = Object.fromEntries(Object.keys(real).map((k) => [k, (...args) =>
    real[k](...args).catch((e) => { console.warn("Using mock for " + k, e); return mock[k](...args); })
  ]));

  // Instant, free answer from the approved library (no AI call). Used for chips
  // and to show a card right away while the AI writes its tailored version.
  const match = (text) => toCard(bestMatch(text) || D.fallback, text);

  window.CoachAPI = { ...(useReal ? withFallback : mock), match, live: useReal };
})();
