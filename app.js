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
  const SVG = "http://www.w3.org/2000/svg";
  function svg(tag, attrs) {
    const n = document.createElementNS(SVG, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function ring(score) {
    const r = 58, c = 2 * Math.PI * r;
    const color = score >= 7 ? "var(--good)" : score >= 4 ? "var(--warn)" : "var(--live)";
    const wrap = el("div", "ring");
    const s = svg("svg", { viewBox: "0 0 140 140" });
    s.append(svg("circle", { cx: 70, cy: 70, r, fill: "none", stroke: "var(--fill)", "stroke-width": 12 }));
    const arc = svg("circle", { cx: 70, cy: 70, r, fill: "none", stroke: color, "stroke-width": 12, "stroke-linecap": "round", "stroke-dasharray": c, "stroke-dashoffset": c });
    s.append(arc);
    wrap.append(s);
    const num = el("div", "num", String(score));
    num.append(el("small", null, "/10"));
    wrap.append(num);
    requestAnimationFrame(() => requestAnimationFrame(() => arc.setAttribute("stroke-dashoffset", c * (1 - score / 10))));
    return wrap;
  }
  function point(cls, icon, text) {
    const p = el("p", "point " + cls);
    p.append(el("i", null, icon), document.createTextNode(text));
    return p;
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
      const verdict = r.score >= 8 ? "Great answer!" : r.score >= 6 ? "Nice work." : r.score >= 4 ? "Almost there." : "Let's try again.";
      fb.append(el("p", "verdict", verdict), point("ok", "✓", r.good), point("tip", "→", r.tip));
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

  // ---------- Analytics ----------
  let insightsLoaded = false;

  function lineChart(host, series) {
    const W = 680, H = 230, L = 36, R = 20, T = 18, B = 30;
    const step = 40;
    const max = Math.ceil(Math.max(...series.map((d) => d.count)) / step) * step;
    const x = (i) => L + (i * (W - L - R)) / (series.length - 1);
    const y = (v) => T + (1 - v / max) * (H - T - B);

    const s = svg("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Objections per week" });
    const defs = svg("defs", {});
    const grad = svg("linearGradient", { id: "areaFill", x1: 0, y1: 0, x2: 0, y2: 1 });
    grad.append(svg("stop", { offset: "0%", style: "stop-color: var(--accent); stop-opacity: 0.22" }));
    grad.append(svg("stop", { offset: "100%", style: "stop-color: var(--accent); stop-opacity: 0" }));
    defs.append(grad);
    s.append(defs);

    for (let v = 0; v <= max; v += step) {
      s.append(svg("line", { class: "grid", x1: L, x2: W - R, y1: y(v), y2: y(v) }));
      const t = svg("text", { x: L - 10, y: y(v) + 4, "text-anchor": "end" });
      t.textContent = v;
      s.append(t);
    }
    series.forEach((d, i) => {
      if (i % 2 && i !== series.length - 1) return;
      const t = svg("text", { x: x(i), y: H - 6, "text-anchor": "middle" });
      t.textContent = d.label;
      s.append(t);
    });

    const pts = series.map((d, i) => [x(i), y(d.count)]);
    const line = pts.map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join(" ");
    s.append(svg("path", { class: "area", d: line + ` L${x(series.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z` }));
    s.append(svg("path", { class: "line", d: line }));
    const cross = svg("line", { class: "cross", y1: T, y2: y(0), x1: 0, x2: 0, visibility: "hidden" });
    s.append(cross);
    pts.forEach((p, i) => {
      const last = i === pts.length - 1;
      s.append(svg("circle", { class: last ? "end" : "dot", cx: p[0], cy: p[1], r: last ? 7 : 4.5 }));
    });

    host.append(s);
    const tip = el("div", "chart-tip");
    tip.hidden = true;
    host.append(tip);

    const colW = (W - L - R) / (series.length - 1);
    series.forEach((d, i) => {
      const hit = svg("rect", { class: "hit", x: x(i) - colW / 2, y: 0, width: colW, height: H });
      hit.addEventListener("mouseenter", () => {
        cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i));
        cross.setAttribute("visibility", "visible");
        tip.textContent = "Week of " + d.label + ": " + d.count;
        const box = s.getBoundingClientRect();
        tip.style.left = (x(i) / W) * box.width + "px";
        tip.style.top = (y(d.count) / H) * box.height - 12 + "px";
        tip.hidden = false;
      });
      hit.addEventListener("mouseleave", () => { tip.hidden = true; cross.setAttribute("visibility", "hidden"); });
      s.append(hit);
    });
  }

  function donut(host, cats) {
    const total = cats.reduce((n, c) => n + c.count, 0);
    const r = 66, C = 2 * Math.PI * r, gap = 3;
    const wrap = el("div", "donut");
    const s = svg("svg", { viewBox: "0 0 168 168", role: "img", "aria-label": "Objections by topic" });
    const center = el("div", "center");
    const big = el("strong", null, String(total));
    const small = el("span", null, "objections");
    center.append(big, small);
    const legend = el("ul", "legend");
    let offset = 0;
    const arcs = [];
    cats.forEach((c) => {
      const len = (c.count / total) * C;
      const arc = svg("circle", {
        cx: 84, cy: 84, r, fill: "none", "stroke-width": 24,
        style: "stroke: var(--c)", "data-cat": c.label,
        "stroke-dasharray": `${Math.max(len - gap, 0)} ${C}`, "stroke-dashoffset": -offset
      });
      offset += len;
      arcs.push(arc);
      s.append(arc);

      const li = el("li");
      li.dataset.cat = c.label;
      li.append(el("span", null, c.label), el("b", null, Math.round((c.count / total) * 100) + "%"));
      legend.append(li);

      const on = () => {
        arcs.forEach((a) => (a.style.opacity = a === arc ? 1 : 0.3));
        big.textContent = c.count;
        small.textContent = c.label;
      };
      const off = () => {
        arcs.forEach((a) => (a.style.opacity = 1));
        big.textContent = total;
        small.textContent = "objections";
      };
      [arc, li].forEach((n) => { n.addEventListener("mouseenter", on); n.addEventListener("mouseleave", off); });
    });
    wrap.append(s, center);
    host.append(wrap, legend);
  }

  async function loadInsights() {
    if (insightsLoaded) return;
    insightsLoaded = true;
    const d = await api.insights();
    $("ins-period").textContent = "Objections heard, " + d.period.toLowerCase();
    $("ins-heard").textContent = d.heard.toLocaleString();
    $("ins-delta").textContent = "↑ " + d.change + "% vs last month";
    lineChart($("ins-line"), d.weekly);
    donut($("ins-donut"), d.categories);

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
      fill.dataset.cat = t.category;
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
