(function () {
  const api = window.CoachAPI;
  const D = window.COACH_DATA;
  const $ = (id) => document.getElementById(id);

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => (t.hidden = true), 2200);
  }

  function thinking() {
    const t = el("div", "thinking");
    t.setAttribute("aria-label", "Thinking");
    t.append(el("span"), el("span"), el("span"));
    return t;
  }

  function tag(category) {
    const t = el("span", "tag", category);
    t.dataset.cat = category;
    return t;
  }

  // The one answer card used everywhere.
  function renderCard(c) {
    const card = el("article", "card");

    const top = el("div", "card-top tag-row");
    top.append(tag(c.category));
    const copy = el("button", "copy", "Copy");
    copy.type = "button";
    copy.addEventListener("click", () => {
      const text = c.answer + "\n\nNext step: " + c.next;
      navigator.clipboard.writeText(text).then(() => toast("Copied"), () => toast("Copy isn't allowed here. Select the text instead."));
    });
    top.append(copy);
    card.append(top);

    // The customer's own words are the title.
    card.append(el("h3", "worry", c.quote ? "“" + c.quote + "”" : c.worry));
    card.append(el("p", "answer", c.answer));

    const next = el("div", "next");
    next.append(el("span", "label", "Next step"), el("p", null, c.next));
    card.append(next);

    if (c.sources && c.sources.length) {
      const s = el("div", "sources");
      c.sources.forEach((src) => {
        const a = el("a", null, src.title + " ↗");
        a.href = src.url; a.target = "_blank"; a.rel = "noopener";
        s.append(a);
      });
      card.append(s);
    }
    return card;
  }

  // ---------- Router ----------
  const views = ["ask", "email", "live", "practice", "analytics"];
  function route() {
    let name = location.hash.slice(1);
    if (name === "insights") name = "analytics";
    if (!views.includes(name)) name = "ask";
    document.querySelectorAll("[data-view]").forEach((v) => (v.hidden = v.dataset.view !== name));
    document.querySelectorAll(".seg a").forEach((a) => {
      if (a.getAttribute("href") === "#" + name) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    if (name === "analytics") loadInsights();
    if (name === "practice" && !$("practice-q").textContent) nextPractice();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  // ---------- Ask ----------
  async function ask(text) {
    text = text.trim();
    if (!text) return;
    const results = $("ask-results");
    const wait = thinking();
    results.prepend(wait);
    try {
      const card = await api.answer(text);
      wait.replaceWith(renderCard(card));
    } catch (e) {
      wait.remove();
      toast("Couldn't get an answer. Check your connection and try again.");
    }
  }
  $("ask-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("ask-input");
    ask(input.value);
    input.value = "";
  });
  // Chips show the most common objections, straight from analytics.
  const commonReady = api.common().then((list) => {
    list.forEach((c) => {
      const b = el("button", "chip", c.text);
      b.type = "button";
      b.dataset.cat = c.category;
      b.addEventListener("click", () => ask(b.textContent));
      $("ask-chips").append(b);
    });
    return list;
  });

  // ---------- Email ----------
  async function findInEmail() {
    const out = $("email-results");
    const text = $("email-input").value.trim();
    out.innerHTML = "";
    if (!text) { toast("Paste an email first."); return; }
    const wait = thinking();
    out.append(wait);
    try {
      const found = await api.findObjections(text);
      wait.remove();
      if (!found.length) {
        out.append(el("p", "empty", "No objections found."));
        return;
      }
      out.append(el("span", "label", found.length + (found.length === 1 ? " objection" : " objections")));
      found.forEach((f) => out.append(foundItem(f.quote)));
    } catch (e) {
      wait.remove();
      toast("Couldn't read the email. Try again.");
    }
  }
  function foundItem(quote) {
    const item = el("div", "found-item");
    const head = el("div", "found-head");
    head.append(el("p", null, "“" + quote + "”"));
    const btn = el("button", "btn btn-quiet", "Get answer");
    btn.type = "button";
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      const wait = thinking();
      item.append(wait);
      try {
        const card = await api.answer(quote);
        wait.replaceWith(renderCard(card));
        btn.remove();
      } catch (e) {
        wait.remove();
        btn.disabled = false;
        toast("Couldn't get an answer. Try again.");
      }
    });
    head.append(btn);
    item.append(head);
    return item;
  }
  $("email-find").addEventListener("click", findInEmail);
  $("email-clear").addEventListener("click", () => {
    $("email-input").value = "";
    $("email-results").innerHTML = "";
    $("email-input").focus();
  });
  $("email-input").value = D.sampleEmail;

  // ---------- Live call ----------
  let listening = false, recognizer = null, demoTimer = null;

  function setLive(on, status) {
    listening = on;
    $("live-mic").classList.toggle("on", on);
    $("live-mic").setAttribute("aria-label", on ? "Stop listening" : "Start listening");
    $("live-status").textContent = status;
  }
  function addLine(who, text) {
    const t = $("live-transcript");
    const p = el("p");
    p.append(el("b", null, who + ": "), document.createTextNode(text));
    t.append(p);
    while (t.children.length > 3) t.firstChild.remove();
  }
  async function hear(line) {
    const card = await api.detect(line);
    if (!card) return;
    const cards = $("live-cards");
    const empty = cards.querySelector(".empty");
    if (empty) empty.remove();

    const pop = el("div", "pop");
    pop.append(tag(card.category));
    pop.append(el("h3", "worry", "“" + card.quote + "”"));
    const btn = el("button", "btn btn-primary", "Get answer");
    btn.type = "button";
    btn.style.alignSelf = "flex-start";
    btn.addEventListener("click", () => btn.replaceWith(renderCard(card)));
    pop.append(btn);
    cards.prepend(pop);
  }
  function resetLive() {
    $("live-transcript").innerHTML = "";
    $("live-cards").innerHTML = "";
    $("live-cards").append(el("p", "empty", "Objections will show up here."));
  }
  function stopAll(status) {
    clearTimeout(demoTimer);
    demoTimer = null;
    if (recognizer) { recognizer.onend = null; recognizer.stop(); recognizer = null; }
    setLive(false, status || "Stopped.");
    $("live-demo").textContent = "Play demo call";
  }
  function playDemo() {
    if (listening) { stopAll(); return; }
    resetLive();
    setLive(true, "Listening to demo call…");
    $("live-demo").textContent = "Stop";
    let i = 0;
    const step = () => {
      if (i >= D.demoCall.length) { stopAll("Call ended."); return; }
      const line = D.demoCall[i++];
      addLine(line.who, line.text);
      if (line.who === "Customer") hear(line.text);
      demoTimer = setTimeout(step, 2400);
    };
    step();
  }
  function startMic() {
    if (listening) { stopAll(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast("Live listening needs Chrome. Try the demo call."); return; }
    resetLive();
    recognizer = new SR();
    recognizer.continuous = true;
    recognizer.interimResults = false;
    recognizer.lang = "en-US";
    recognizer.onresult = (e) => {
      const r = e.results[e.results.length - 1];
      if (!r.isFinal) return;
      const text = r[0].transcript.trim();
      addLine("Call", text);
      hear(text);
    };
    recognizer.onerror = (e) => {
      stopAll(e.error === "not-allowed" ? "Mic is blocked. Try the demo call." : "Listening stopped.");
    };
    recognizer.onend = () => { if (listening && recognizer) recognizer.start(); };
    try {
      recognizer.start();
      setLive(true, "Listening…");
    } catch (e) {
      stopAll("Mic is blocked. Try the demo call.");
    }
  }
  $("live-mic").addEventListener("click", startMic);
  $("live-demo").addEventListener("click", playDemo);

  // ---------- Practice ----------
  async function nextPractice() {
    const current = $("practice-q").textContent;
    const { objection } = await api.practiceNext(current);
    $("practice-q").textContent = "“" + objection.replace(/^“|”$/g, "") + "”";
    $("practice-q").dataset.raw = objection;
    $("practice-input").value = "";
    $("practice-result").innerHTML = "";
    $("practice-submit").hidden = false;
    $("practice-skip").textContent = "Skip";
  }
  function ring(score) {
    const r = 52, c = 2 * Math.PI * r;
    const wrap = el("div", "ring");
    wrap.innerHTML =
      '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="' + r + '" fill="none" stroke="var(--fill)" stroke-width="10"/>' +
      '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="' + (score >= 7 ? "var(--good)" : score >= 4 ? "var(--warn)" : "var(--live)") +
      '" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + c * (1 - score / 10) + '"/></svg>';
    const num = el("div", "num");
    num.innerHTML = score + "<small>/10</small>";
    wrap.append(num);
    return wrap;
  }
  async function submitPractice() {
    const reply = $("practice-input").value.trim();
    if (!reply) { toast("Type your answer first."); return; }
    const out = $("practice-result");
    out.innerHTML = "";
    out.append(thinking());
    $("practice-submit").disabled = true;
    try {
      const r = await api.scorePractice($("practice-q").dataset.raw, reply);
      out.innerHTML = "";
      const box = el("div", "result");
      box.append(ring(r.score));
      const fb = el("div", "feedback");
      fb.append(el("p", "ok", r.good), el("p", "tip", r.tip));
      box.append(fb);
      const model = el("div", "model");
      model.append(el("span", "label", "A strong answer"), el("p", null, r.model));
      box.append(model);
      out.append(box);
      $("practice-submit").hidden = true;
      $("practice-skip").textContent = "Next objection";
    } catch (e) {
      out.innerHTML = "";
      toast("Couldn't score that. Try again.");
    } finally {
      $("practice-submit").disabled = false;
    }
  }
  $("practice-submit").addEventListener("click", submitPractice);
  $("practice-skip").addEventListener("click", nextPractice);

  // ---------- Insights ----------
  let insightsLoaded = false;
  async function loadInsights() {
    if (insightsLoaded) return;
    insightsLoaded = true;
    const d = await api.insights();
    $("ins-period").textContent = d.period + ".";
    $("ins-heard").textContent = d.heard.toLocaleString();
    $("ins-answered").textContent = d.answered + "%";

    const max = Math.max(...d.trending.map((t) => t.count));
    const bars = $("ins-trending");
    d.trending.forEach((t) => {
      const row = el("div", "bar-row");
      row.append(el("span", "name", t.label));
      const val = el("span", "val", t.count + " ");
      const ch = el("span", t.change > 0 ? "up" : null, (t.change > 0 ? "↑ " : "↓ ") + Math.abs(t.change) + "%");
      val.append(ch);
      row.append(val);
      const track = el("div", "bar-track");
      const fill = el("div", "bar-fill");
      fill.style.width = (t.count / max) * 100 + "%";
      track.append(fill);
      row.append(track);
      bars.append(row);
    });

    const gaps = $("ins-gaps");
    d.unanswered.forEach((g) => {
      const row = el("div", "gap-row");
      const p = el("p", null, g.text);
      p.append(el("small", null, "Heard " + g.count + " times"));
      const b = el("button", "btn btn-quiet", "Add answer");
      b.type = "button";
      b.addEventListener("click", () => toast("Sent to the enablement team."));
      row.append(p, b);
      gaps.append(row);
    });
  }

  // ---------- Start ----------
  route();
  // Open with one example answer so the page shows what it does.
  commonReady.then((list) => list.length && api.answer(list[0].text)).then((c) => c && $("ask-results").append(renderCard(c)));
})();
