(function () {
  const api = window.CoachAPI;
  const D = window.COACH_DATA;
  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CATS = ["Data", "Cost", "Control", "Trust", "Value", "Change"];

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // Per-browser saved state (board, practice). Never required: everything works without it.
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage off */ }
    }
  };

  // ---------- Motion ----------
  // Anything that becomes visible fades and rises in. Anything that leaves fades out
  // first (use hide()). Segmented controls get a sliding pill.
  function hide(node, on = true) {
    if (!on) { node.hidden = false; return; }
    if (node.hidden || reduceMotion || !node.offsetParent) { node.hidden = true; return; }
    node.classList.remove("appear");
    node.classList.add("vanish");
    node.addEventListener("animationend", () => { node.classList.remove("vanish"); node.hidden = true; }, { once: true });
  }
  const NO_APPEAR = "#drawer, .chart-tip, .sheet, .sheet-backdrop";
  if (!reduceMotion) {
    new MutationObserver((list) => {
      for (const m of list) {
        const n = m.target;
        if (m.oldValue === null || n.hidden || n.matches(NO_APPEAR)) continue;
        n.classList.remove("appear", "vanish");
        void n.offsetWidth;
        n.classList.add("appear");
        n.addEventListener("animationend", () => n.classList.remove("appear"), { once: true });
      }
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["hidden"], attributeOldValue: true });
  }
  function pill(group) {
    const p = el("div", "pill");
    p.setAttribute("aria-hidden", "true");
    group.prepend(p);
    group.classList.add("has-pill");
    let first = true;
    const place = () => {
      const on = group.querySelector('[aria-current="page"], [aria-pressed="true"]');
      if (!on || !group.offsetParent) return;
      if (first || reduceMotion) p.style.transition = "none";
      p.style.width = on.offsetWidth + "px";
      p.style.transform = `translateX(${on.offsetLeft}px)`;
      if (first || reduceMotion) { void p.offsetWidth; p.style.transition = ""; }
      first = false;
    };
    new MutationObserver(place).observe(group, { subtree: true, attributes: true, attributeFilter: ["aria-current", "aria-pressed", "hidden"], childList: true, characterData: true });
    new ResizeObserver(place).observe(group);
    place();
  }

  // Fade a freshly drawn list in, one item after another.
  function stagger(nodes, step = 35, max = 12) {
    if (reduceMotion) return;
    [...nodes].forEach((n, i) => {
      n.style.animationDelay = Math.min(i, max) * step + "ms";
      n.classList.add("appear");
      n.addEventListener("animationend", () => { n.classList.remove("appear"); n.style.animationDelay = ""; }, { once: true });
    });
  }

  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => hide(t), 2200);
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

  const ICONS = {
    x: '<svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    trash: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4h11M6.5 4V2.8h3V4M4 4l.7 9.2h6.6L12 4M6.7 6.8v4M9.3 6.8v4"/></svg>',
    star: '<svg viewBox="0 0 16 16"><path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z" fill="currentColor"/></svg>',
    pin: '<svg viewBox="0 0 16 16"><path d="M10.4 1.3l4.3 4.3-1.5.6-2.6 2.6.3 3.5-1.4 1.4-2.9-2.9-4.3 4.3-.9-.9 4.3-4.3-2.9-2.9 1.4-1.4 3.5.3 2.6-2.6z" fill="currentColor"/></svg>',
    copy: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="5.5" y="5.5" width="8" height="8" rx="2"/><path d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5"/></svg>',
    spark: '<svg viewBox="0 0 16 16"><path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5zM13 11l.6 1.4L15 13l-1.4.6L13 15l-.6-1.4L11 13l1.4-.6z" fill="currentColor"/></svg>'
  };

  function iconButton(label, icon, cls) {
    const b = el("button", "icon-btn" + (cls ? " " + cls : ""));
    b.type = "button";
    b.setAttribute("aria-label", label);
    b.dataset.tip = label;
    b.innerHTML = ICONS[icon];
    return b;
  }

  // Smoothly move siblings when one is added, removed or moved.
  function flip(container, change) {
    const key = (n) => n.dataset.id || n;
    const before = new Map([...container.children].map((n) => [key(n), n.getBoundingClientRect()]));
    change();
    if (reduceMotion) return;
    const fresh = [];
    [...container.children].forEach((n) => {
      const r = before.get(key(n));
      if (!r) { if (!n.classList.contains("enter")) fresh.push(n); return; }
      if (n.classList.contains("leave") || n.classList.contains("dragging")) return;
      const now = n.getBoundingClientRect();
      const dx = r.left - now.left, dy = r.top - now.top;
      if (!dx && !dy) return;
      n.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
        { duration: 380, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
    });
    stagger(fresh);
  }

  // Drag and drop to reorder the children of a grid (mouse and trackpad).
  function sortable(container, selector, onEnd) {
    let drag = null;
    container.addEventListener("dragstart", (e) => {
      const t = e.target.closest(selector);
      if (!t || t.parentElement !== container) return;
      drag = t;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", "");
      requestAnimationFrame(() => t.classList.add("dragging"));
    });
    container.addEventListener("dragover", (e) => {
      if (!drag) return;
      e.preventDefault();
      const over = e.target.closest(selector);
      if (!over || over === drag || over.parentElement !== container) return;
      const r = over.getBoundingClientRect();
      const after = e.clientY > r.bottom - r.height / 3 || (e.clientY > r.top + r.height / 3 && e.clientX > r.left + r.width / 2);
      if (after ? over.nextElementSibling === drag : over.previousElementSibling === drag) return;
      flip(container, () => (after ? over.after(drag) : over.before(drag)));
    });
    container.addEventListener("drop", (e) => { if (drag) e.preventDefault(); });
    container.addEventListener("dragend", () => {
      if (!drag) return;
      drag.classList.remove("dragging");
      drag = null;
      onEnd();
    });
  }

  // ---------- Pop-up sheet (opens from where you clicked, closes back to it) ----------
  let sheetOpen = null;
  function openSheet(fromEl, content, opts = {}) {
    if (sheetOpen) sheetOpen(true);
    const backdrop = el("div", "backdrop");
    const sheet = el("div", "sheet");
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    const close = iconButton("Close", "x", "close");
    content.style.position = "relative";
    sheet.append(content, close);
    document.body.append(backdrop, sheet);

    const w = sheet.offsetWidth, h = sheet.offsetHeight;
    sheet.style.left = (innerWidth - w) / 2 + "px";
    sheet.style.top = Math.max(32, (innerHeight - h) / 2) + "px";
    const from = fromEl && fromEl.isConnected ? fromEl.getBoundingClientRect() : null;
    const ease = "cubic-bezier(0.2, 0.85, 0.25, 1)";
    if (opts.hideSource && fromEl) fromEl.style.visibility = "hidden";
    requestAnimationFrame(() => backdrop.classList.add("show"));
    if (!reduceMotion) {
      const to = sheet.getBoundingClientRect();
      const start = from
        ? `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`
        : "translateY(16px) scale(0.97)";
      sheet.animate([{ transform: start, opacity: 0.6 }, { transform: "none", opacity: 1 }], { duration: 440, easing: ease });
      content.animate([{ opacity: 0 }, { opacity: 0, offset: 0.25 }, { opacity: 1 }], { duration: 440 });
    }
    close.focus({ preventScroll: true });

    const shut = (instant) => {
      if (sheetOpen !== shut) return;
      sheetOpen = null;
      document.removeEventListener("keydown", onKey);
      backdrop.classList.remove("show");
      // closeTo() lets the caller make the element the sheet should shrink into
      // (a new card in the grid), so closing shows where the answer went.
      if (opts.closeTo) fromEl = opts.closeTo();
      const done = () => {
        sheet.remove(); backdrop.remove();
        if (opts.hideSource && fromEl) fromEl.style.visibility = "";
        opts.onClose && opts.onClose(fromEl);
      };
      if (reduceMotion || instant) return done();
      const back = fromEl && fromEl.isConnected ? fromEl.getBoundingClientRect() : null;
      const cur = sheet.getBoundingClientRect();
      const end = back
        ? `translate(${back.left - cur.left}px, ${back.top - cur.top}px) scale(${back.width / cur.width}, ${back.height / cur.height})`
        : "translateY(12px) scale(0.97)";
      content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" });
      sheet.animate([{ transform: "none", opacity: 1 }, { transform: end, opacity: back ? 1 : 0 }], { duration: 360, easing: ease, fill: "forwards" }).onfinish = done;
    };
    const onKey = (e) => { if (e.key === "Escape") shut(); };
    document.addEventListener("keydown", onKey);
    backdrop.addEventListener("click", () => shut());
    close.addEventListener("click", () => shut());
    sheetOpen = shut;
    return { shut, sheet };
  }

  // ---------- The answer card used everywhere ----------
  // opts.onChange(card) is called after a rewrite so the caller can save it.
  function renderCard(c, opts = {}) {
    const card = el("article", "card");

    const top = el("div", "card-top tag-row");
    top.append(tag(c.category));
    const actions = el("div", "card-actions");
    const ai = el("button", "ai-btn");
    ai.type = "button";
    ai.innerHTML = ICONS.spark + "<span>Rewrite</span>";
    const copy = el("button", "copy", "Copy");
    copy.type = "button";
    copy.addEventListener("click", () => {
      const text = c.short + "\n\n" + c.answer + "\n\nNext step: " + c.next;
      navigator.clipboard.writeText(text).then(() => toast("Copied"), () => toast("Copy isn't allowed here. Select the text instead."));
    });
    actions.append(ai, copy);
    top.append(actions);
    card.append(top);

    card.append(el("h3", "worry", c.quote ? "“" + c.quote + "”" : c.worry));
    if (c.short) {
      const s = el("p", "short");
      s.append(el("i", null, "✓"), document.createTextNode(c.short));
      card.append(s);
    }
    const answer = el("p", "answer", c.answer);
    card.append(answer);
    const status = el("div", "tailoring");
    status.hidden = true;
    status.append(thinking(), el("span", null, "Tailoring the answer to their words…"));
    card.append(status);

    // Rewrite: one short box, the AI rewrites the answer the way you ask.
    const form = el("form", "rewrite");
    form.hidden = true;
    const input = el("input");
    input.placeholder = "How should it change? e.g. shorter, warmer, more reasons";
    input.setAttribute("aria-label", "How should the answer change");
    const go = el("button", "btn btn-primary", "Rewrite");
    go.type = "submit";
    form.append(input, go);
    answer.after(form);
    ai.addEventListener("click", () => {
      form.hidden = !form.hidden;
      if (!form.hidden) input.focus();
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const request = input.value.trim();
      if (!request) { input.focus(); return; }
      go.disabled = true;
      status.hidden = false;
      status.lastChild.textContent = "Rewriting…";
      try {
        const r = await api.rewrite(c.quote || c.worry, c.answer, request);
        c.answer = r.answer;
        answer.textContent = r.answer;
        answer.classList.remove("fade-swap"); void answer.offsetWidth; answer.classList.add("fade-swap");
        form.hidden = true;
        input.value = "";
        opts.onChange && opts.onChange(c);
      } catch (err) {
        toast("Couldn't rewrite it. Try again.");
      } finally {
        go.disabled = false;
        status.hidden = true;
      }
    });

    const next = el("div", "next");
    const nextP = el("p", null, c.next);
    next.append(el("span", "label", "Next step"), nextP);
    card.append(next);

    // Sources stay folded behind one quiet button, then slide open.
    const sources = el("div", "sources");
    card.append(sources);
    const fillSources = (list) => {
      sources.innerHTML = "";
      sources.hidden = !(list && list.length);
      if (sources.hidden) return;
      const btn = el("button", "src-toggle", "See sources (" + list.length + ")");
      btn.type = "button";
      btn.setAttribute("aria-expanded", "false");
      const wrap = el("div", "expand");
      const ul = el("ul", "src-list");
      list.forEach((src) => {
        const li = el("li");
        const a = el("a", null, src.title + " ↗");
        a.href = src.url; a.target = "_blank"; a.rel = "noopener";
        li.append(a);
        ul.append(li);
      });
      wrap.append(ul);
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = !sources.classList.contains("open");
        sources.classList.toggle("open", open);
        btn.setAttribute("aria-expanded", String(open));
      });
      sources.append(btn, wrap);
    };
    fillSources(c.sources);

    // Lets callers show "tailoring" and swap in the AI's version when it arrives.
    card.setTailoring = (on) => {
      status.lastChild.textContent = "Tailoring the answer to their words…";
      status.hidden = !on;
    };
    card.setSources = (list) => {
      if (!list || !list.length || JSON.stringify(list) === JSON.stringify(c.sources)) return;
      c.sources = list;
      fillSources(list);
    };
    card.setAnswer = (text, nextText) => {
      c.answer = text;
      answer.textContent = text;
      answer.classList.remove("fade-swap"); void answer.offsetWidth; answer.classList.add("fade-swap");
      if (nextText) {
        c.next = nextText;
        nextP.textContent = nextText;
        nextP.classList.remove("fade-swap"); void nextP.offsetWidth; nextP.classList.add("fade-swap");
      }
    };
    return card;
  }

  // Instant card from the library, then (only when typed and the backend is live)
  // the AI's tailored wording replaces the answer when it arrives.
  function getAnswer(text, { typed }, onCard, onRefined) {
    const card = api.match(text);
    onCard(card);
    if (!typed || !api.live) return;
    api.answer(text).then((ai) => onRefined(ai), () => onRefined(null));
  }

  // ---------- Router ----------
  const views = ["ask", "email", "live", "objections", "practice", "analytics"];
  function route() {
    let name = location.hash.slice(1);
    if (name === "insights") name = "analytics";
    if (!views.includes(name)) name = "ask";
    if (sheetOpen) sheetOpen(true);
    document.querySelectorAll("[data-view]").forEach((v) => (v.hidden = v.dataset.view !== name));
    document.querySelectorAll(".seg a").forEach((a) => {
      if (a.getAttribute("href") === "#" + name) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    if (name === "analytics") loadInsights();
    if (name === "practice") enterPractice();
    if (name === "objections") renderObjections();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  // ---------- Ask: a board of saved answer cards ----------
  let board = store.get("sk.board", null);
  let filter = "all";
  const saveBoard = () => store.set("sk.board", board);
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // Pinned cards first, then the rest in the order you arranged them.
  function ordered() {
    return [...board.filter((i) => i.pin), ...board.filter((i) => !i.pin)];
  }

  function renderTile(item, animate) {
    const t = el("div", "tile" + (animate ? " enter" : "") + (item.pin ? " pinned" : ""));
    t.dataset.id = item.id;
    t.tabIndex = 0;
    t.draggable = true;
    t.setAttribute("role", "button");
    t.setAttribute("aria-label", "Open answer");

    const top = el("div", "tile-top");
    top.append(tag(item.card.category));
    const star = iconButton(item.star ? "Remove star" : "Star", "star", "act" + (item.star ? " on" : ""));
    star.dataset.a = "star";
    const pin = iconButton(item.pin ? "Unpin" : "Pin to top", "pin", "act" + (item.pin ? " on" : ""));
    pin.dataset.a = "pin";
    const del = iconButton("Delete card", "trash", "act");
    del.dataset.a = "del";
    top.append(star, pin, del);
    t.append(top);
    t.append(el("h3", null, item.card.quote ? "“" + item.card.quote + "”" : item.card.worry));
    t.append(el("span", "open-hint", "See answer"));

    star.addEventListener("click", (e) => {
      e.stopPropagation();
      item.star = !item.star;
      saveBoard();
      if (filter === "star" && !item.star) { removeTileEl(t); updateFilterCount(); return; }
      t.replaceWith(renderTile(item));
      updateFilterCount();
    });
    pin.addEventListener("click", (e) => {
      e.stopPropagation();
      item.pin = !item.pin;
      // A newly pinned card goes to the top; an unpinned one goes back to the top of the rest.
      board = [item, ...board.filter((i) => i !== item)];
      saveBoard();
      renderBoard(true);
      toast(item.pin ? "Pinned to the top" : "Unpinned");
    });
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      board = board.filter((i) => i !== item);
      saveBoard();
      removeTileEl(t);
      updateFilterCount();
    });
    const open = () => openItem(t, item);
    t.addEventListener("click", open);
    t.addEventListener("keydown", (e) => {
      if (e.target === t && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(); }
    });
    t.addEventListener("animationend", () => t.classList.remove("enter"), { once: true });
    return t;
  }

  function removeTileEl(t) {
    const host = $("ask-results");
    t.classList.add("leave");
    setTimeout(() => { flip(host, () => t.remove()); updateEmpty(); }, reduceMotion ? 0 : 260);
  }

  function updateFilterCount() {
    $("star-count").textContent = board.filter((i) => i.star).length;
  }
  function updateEmpty() {
    $("board-empty").hidden = !(filter === "star" && !board.some((i) => i.star));
  }

  function renderBoard(animateMoves) {
    const host = $("ask-results");
    const draw = () => {
      host.innerHTML = "";
      ordered().filter((i) => filter === "all" || i.star).forEach((i) => host.append(renderTile(i)));
    };
    animateMoves ? flip(host, draw) : draw();
    updateFilterCount();
    updateEmpty();
  }

  let openCard = null; // { item, cardEl } while a card is open
  function openItem(tile, item) {
    const cardEl = renderCard(item.card, { onChange: saveBoard });
    openCard = { item, cardEl };
    openSheet(tile, cardEl, { hideSource: true, onClose: () => { openCard = null; } });
    if (item.tailoring) cardEl.setTailoring(true);
  }

  // Asking opens the answer right away. Closing it makes room in the grid,
  // shrinks into the new spot, and the card settles in with a small bounce.
  function ask(text, typed, sourceEl) {
    text = text.trim();
    if (!text) return;
    const host = $("ask-results");
    if (filter === "star") setFilter("all");
    const item = { id: newId(), star: false, pin: false };
    getAnswer(text, { typed }, (card) => {
      item.card = card;
      item.tailoring = typed && api.live;
      const lastPinned = board.filter((i) => i.pin).pop();
      board.splice(lastPinned ? board.indexOf(lastPinned) + 1 : 0, 0, item);
      saveBoard();
      updateFilterCount();
      updateEmpty();
      const cardEl = renderCard(card, { onChange: saveBoard });
      openCard = { item, cardEl };
      openSheet(sourceEl || $("ask-form"), cardEl, {
        closeTo: () => {
          const t = renderTile(item);
          t.style.visibility = "hidden";
          const firstFree = [...host.children].find((n) => !n.classList.contains("pinned"));
          flip(host, () => (firstFree ? firstFree.before(t) : host.append(t)));
          return t;
        },
        onClose: (t) => {
          openCard = null;
          t.style.visibility = "";
          if (!reduceMotion) {
            t.classList.add("enter");
            t.addEventListener("animationend", () => t.classList.remove("enter"), { once: true });
          }
        }
      });
      if (item.tailoring) cardEl.setTailoring(true);
    }, (ai) => {
      item.tailoring = false;
      if (ai && ai.answer) { item.card = { ...item.card, answer: ai.answer, next: ai.next || item.card.next }; saveBoard(); }
      if (openCard && openCard.item === item) {
        openCard.cardEl.setTailoring(false);
        if (ai && ai.answer) { openCard.cardEl.setAnswer(ai.answer, ai.next); openCard.cardEl.setSources(ai.sources); }
      }
    });
  }

  function setFilter(f) {
    filter = f;
    $("board-filter").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.f === f)));
    renderBoard(true);
  }
  $("board-filter").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) setFilter(b.dataset.f);
  });

  sortable($("ask-results"), ".tile", () => {
    // Read the new order from the grid, keep pinned cards above the rest.
    const ids = [...$("ask-results").children].map((n) => n.dataset.id);
    const shown = ids.map((id) => board.find((i) => i.id === id)).filter(Boolean);
    const hidden = board.filter((i) => !ids.includes(i.id));
    board = [...shown, ...hidden];
    saveBoard();
    renderBoard(true);
  });

  $("ask-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("ask-input");
    ask(input.value, true, $("ask-form"));
    input.value = "";
  });

  // Chips show the most common objections, straight from analytics.
  // They answer from the library only, so they never cost an AI call.
  const commonReady = api.common().then((list) => {
    list.forEach((c) => {
      const b = el("button", "chip", c.text);
      b.type = "button";
      b.dataset.cat = c.category;
      b.addEventListener("click", () => ask(b.textContent, false, b));
      $("ask-chips").append(b);
    });
    return list;
  });

  if (!board) {
    // First visit: one example card so the board shows what it does.
    board = [];
    commonReady.then((list) => {
      if (!list.length || board.length) return;
      board.push({ id: newId(), card: api.match(list[0].text), star: false, pin: false });
      saveBoard();
      renderBoard();
    });
  }
  renderBoard();

  // ---------- Email ----------
  let emailItems = []; // { quote, el, mark, card }
  let openFound = null;

  function setEmailMode(view) {
    $("email-input").hidden = view;
    $("email-view").hidden = !view;
    $("email-edit").hidden = !view;
    $("email-find").hidden = view;
  }

  // Show the email with each objection highlighted where it appears.
  function renderEmailView(text, items) {
    const v = $("email-view");
    v.innerHTML = "";
    const lower = text.toLowerCase();
    const spots = [];
    items.forEach((it, i) => {
      const q = it.quote.replace(/^[“"]|[”"]$/g, "").trim();
      const at = lower.indexOf(q.toLowerCase());
      if (at >= 0 && !spots.some((s) => at < s.end && at + q.length > s.start)) spots.push({ start: at, end: at + q.length, i });
    });
    spots.sort((a, b) => a.start - b.start);
    let pos = 0;
    spots.forEach((s) => {
      v.append(document.createTextNode(text.slice(pos, s.start)));
      const m = el("mark", null, text.slice(s.start, s.end));
      m.dataset.cat = items[s.i].card.category;
      items[s.i].mark = m;
      m.addEventListener("mouseenter", () => highlight(items[s.i], true));
      m.addEventListener("mouseleave", () => highlight(items[s.i], false));
      m.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFound(items[s.i], true);
        items[s.i].el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
      });
      v.append(m);
      pos = s.end;
    });
    v.append(document.createTextNode(text.slice(pos)));
  }

  function highlight(item, on) {
    item.el.classList.toggle("hl", on);
    if (item.mark) item.mark.classList.toggle("hl", on);
  }

  function toggleFound(item, forceOpen) {
    const opening = forceOpen || !item.el.classList.contains("open");
    if (openFound && openFound !== item) openFound.el.classList.remove("open");
    item.el.classList.toggle("open", opening);
    openFound = opening ? item : null;
    if (opening && !item.filled) {
      item.filled = true;
      const body = item.el.querySelector(".expand > div");
      getAnswer(item.quote, { typed: true }, (card) => {
        item.card = card;
        item.cardEl = renderCard(card);
        body.append(item.cardEl);
        if (api.live) item.cardEl.setTailoring(true);
      }, (ai) => {
        item.cardEl.setTailoring(false);
        if (ai && ai.answer) { item.cardEl.setAnswer(ai.answer, ai.next); item.cardEl.setSources(ai.sources); }
      });
    }
  }

  function foundItem(item, i) {
    const box = el("div", "found-item enter");
    box.dataset.cat = item.card.category;
    box.style.animationDelay = (reduceMotion ? 0 : i * 90) + "ms";
    const head = el("div", "found-head");
    const q = el("div", "q");
    q.append(tag(item.card.category), el("p", null, "“" + item.quote + "”"));
    const btn = el("button", "btn btn-quiet get", "Get answer");
    btn.type = "button";
    head.append(q, btn);
    const expand = el("div", "expand");
    expand.append(el("div"));
    box.append(head, expand);
    item.el = box;
    head.addEventListener("click", () => toggleFound(item));
    box.addEventListener("click", (e) => { if (!box.classList.contains("open")) toggleFound(item, true); e.stopPropagation(); });
    box.addEventListener("mouseenter", () => highlight(item, true));
    box.addEventListener("mouseleave", () => highlight(item, false));
    box.addEventListener("animationend", () => box.classList.remove("enter"), { once: true });
    return box;
  }

  // Clicking anywhere outside the open objection folds it back.
  document.addEventListener("click", (e) => {
    if (!openFound || sheetOpen) return;
    if (e.target.closest(".found-item, mark")) return;
    openFound.el.classList.remove("open");
    openFound = null;
  });

  async function findInEmail() {
    const out = $("email-results");
    const text = $("email-input").value.trim();
    if (!text) { toast("Paste an email first."); return; }
    out.innerHTML = "";
    $("email-bar").hidden = true;
    const wait = thinking();
    out.append(wait);
    $("email-find").disabled = true;
    try {
      const found = await api.findObjections(text);
      wait.remove();
      openFound = null;
      emailItems = found.map((f) => ({ quote: f.quote, card: api.match(f.quote) }));
      if (!emailItems.length) {
        out.append(el("p", "empty", "No objections found."));
        return;
      }
      $("email-count").textContent = emailItems.length + (emailItems.length === 1 ? " objection" : " objections");
      $("email-draft-tab").hidden = true;
      $("email-draft-view").innerHTML = "";
      setEmailTab("list");
      $("email-bar").hidden = false;
      emailItems.forEach((it, i) => out.append(foundItem(it, i)));
      renderEmailView(text, emailItems);
      setEmailMode(true);
    } catch (e) {
      wait.remove();
      toast("Couldn't read the email. Try again.");
    } finally {
      $("email-find").disabled = false;
    }
  }

  // Draft reply: shown inline. Each answer part is tinted by its objection,
  // hover shows which objection it answers, and each part can be copied.
  const copyText = (t) => navigator.clipboard.writeText(t)
    .then(() => toast("Copied"), () => toast("Copy isn't allowed here. Select the text instead."));

  function setEmailTab(t) {
    $("email-tabs").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.t === t)));
    $("email-results").hidden = t !== "list";
    $("email-draft-view").hidden = t !== "draft";
    $("email-results").classList.remove("vanish"); $("email-draft-view").classList.remove("vanish");
  }
  $("email-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) setEmailTab(b.dataset.t);
  });

  function renderDraft(r) {
    const host = $("email-draft-view");
    host.innerHTML = "";
    const card = el("article", "card draft enter");
    const top = el("div", "card-top");
    top.append(el("span", "label", "Draft reply"));
    card.append(top, el("h3", "worry", r.subject), el("p", "draft-text", r.greeting));
    const parts = r.parts || [];
    parts.forEach((pt) => {
      const item = emailItems[pt.objection];
      const box = el("div", "part");
      if (item) {
        box.dataset.cat = item.card.category;
        box.append(el("span", "part-link", "Answers: “" + item.quote + "”"));
        box.addEventListener("mouseenter", () => highlight(item, true));
        box.addEventListener("mouseleave", () => highlight(item, false));
      }
      box.append(el("p", "draft-text", pt.text));
      const copy = iconButton("Copy this answer", "copy");
      copy.addEventListener("click", () => copyText(pt.text));
      box.append(copy);
      card.append(box);
    });
    card.append(el("p", "draft-text", r.closing));
    const acts = el("div", "draft-actions");
    const all = el("button", "btn btn-primary", "Copy the whole email");
    all.type = "button";
    const full = [r.greeting, ...parts.map((p) => p.text), r.closing].join("\n\n");
    all.addEventListener("click", () => copyText("Subject: " + r.subject + "\n\n" + full));
    acts.append(all);
    card.append(acts);
    card.addEventListener("animationend", () => card.classList.remove("enter"), { once: true });
    host.append(card);
  }

  async function draftReply() {
    const btn = $("email-draft");
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = "Drafting…";
    try {
      const r = await api.draft($("email-input").value, emailItems.map((i) => i.quote));
      renderDraft(r);
      $("email-draft-tab").hidden = false;
      setEmailTab("draft");
    } catch (e) {
      toast("Couldn't draft the reply. Try again.");
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  }

  $("email-find").addEventListener("click", findInEmail);
  $("email-draft").addEventListener("click", draftReply);
  $("email-edit").addEventListener("click", () => { setEmailMode(false); $("email-input").focus(); });
  $("email-clear").addEventListener("click", () => {
    $("email-input").value = "";
    setEmailMode(false);
    emailItems = [];
    $("email-bar").hidden = true;
    $("email-draft-view").innerHTML = "";
    setEmailTab("list");
    $("email-results").innerHTML = '<p class="empty">Objections will show up here.</p>';
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
    if (card.short) {
      const s = el("p", "short");
      s.append(el("i", null, "✓"), document.createTextNode(card.short));
      pop.append(s);
    }
    const btn = el("button", "btn btn-primary", "Full answer");
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

  // ---------- Objections: the full list ----------
  let practiceList = store.get("sk.list", []);
  let objCat = "All";
  const saveList = () => { store.set("sk.list", practiceList); updateListCounts(); };

  function updateListCounts() {
    $("obj-list-count").textContent = "Practice list: " + practiceList.length;
    $("pr-list-n").textContent = practiceList.length;
    hide($("obj-practice"), !practiceList.length);
  }

  ["All", ...CATS].forEach((c) => {
    const b = el("button", "chip", c);
    b.type = "button";
    b.setAttribute("aria-pressed", String(c === objCat));
    b.addEventListener("click", () => {
      objCat = c;
      $("obj-cats").querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      renderObjections();
    });
    $("obj-cats").append(b);
  });
  $("obj-search").addEventListener("input", () => renderObjections());
  let pendingList = false;
  $("obj-practice").addEventListener("click", () => { pendingList = true; });
  $("obj-list-count").addEventListener("click", () => openDrawer());

  // ---------- Practice list side panel ----------
  let listDone = store.get("sk.listDone", []);
  const saveDone = () => store.set("sk.listDone", listDone);
  const listLeft = () => practiceList.filter((t) => !listDone.includes(t));

  function renderDrawer(fresh) {
    const ul = $("dr-list");
    const done = practiceList.filter((t) => listDone.includes(t)).length;
    const total = practiceList.length;
    $("dr-progress").textContent = total ? done + " of " + total + " practiced" : "";
    $("dr-bar").style.width = (total ? (done / total) * 100 : 0) + "%";
    $("dr-bar").parentElement.hidden = !total;
    $("dr-empty").hidden = !!total;
    ul.innerHTML = "";
    practiceList.forEach((t) => {
      const li = el("li", listDone.includes(t) ? "done" : null);
      if (t === fresh && !reduceMotion) li.classList.add("new");
      li.append(el("span", "tick", listDone.includes(t) ? "✓" : ""), el("span", "t", t));
      const rm = iconButton("Remove", "trash");
      rm.addEventListener("click", () => {
        practiceList = practiceList.filter((x) => x !== t);
        listDone = listDone.filter((x) => x !== t);
        saveList(); saveDone();
        renderObjections();
        renderDrawer();
      });
      li.append(rm);
      ul.append(li);
    });
    const foot = $("dr-foot");
    foot.innerHTML = "";
    if (!total) return;
    const go = (label, cls, fn) => {
      const b = el("button", "btn " + cls, label);
      b.type = "button";
      b.addEventListener("click", fn);
      foot.append(b);
    };
    if (done === total) {
      const n = el("p", "note-done");
      n.append(el("span", "banner-icon", "✓"), document.createTextNode("All done. Nice work!"));
      foot.append(n);
      go("Practice the list again", "btn-primary", () => { resetList(); startList(); });
      go("Practice all objections", "btn-quiet", () => { closeDrawer(); location.hash = "#practice"; setPracticeMode("all"); });
    } else {
      go("Practice this list", "btn-primary", startList);
    }
  }

  function startList() {
    closeDrawer();
    if (location.hash === "#practice") setPracticeMode("list", true);
    else { pendingList = true; location.hash = "#practice"; }
  }

  function resetList() {
    listDone = [];
    saveDone();
    hide($("pr-done"));
    renderDrawer();
  }

  function openDrawer(fresh) {
    const d = $("drawer");
    renderDrawer(fresh);
    if (d.classList.contains("show")) return;
    d.hidden = false;
    d.offsetWidth; // let the panel start off screen, then slide in
    d.classList.add("show");
  }
  function closeDrawer() {
    const d = $("drawer");
    if (!d.classList.contains("show")) return;
    d.classList.remove("show");
    if (reduceMotion) d.hidden = true;
    else d.addEventListener("transitionend", () => { if (!d.classList.contains("show")) d.hidden = true; }, { once: true });
  }
  $("dr-close").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
  document.addEventListener("click", (e) => {
    if (!$("drawer").classList.contains("show") || sheetOpen || !e.target.isConnected) return;
    if (e.target.closest("#drawer, .obj-actions, #obj-list-count, #pr-view-list")) return;
    closeDrawer();
  });

  function renderObjections() {
    const q = $("obj-search").value.trim().toLowerCase();
    const rows = $("obj-rows");
    rows.innerHTML = "";
    const max = Math.max(...D.objections.map((o) => o.count));
    const list = D.objections
      .filter((o) => objCat === "All" || o.category === objCat)
      .filter((o) => !q || o.text.toLowerCase().includes(q))
      .sort((a, b) => b.count - a.count);
    if (!list.length) rows.append(el("p", "empty", "No objections match."));
    list.forEach((o) => {
      const row = el("div", "obj-row");
      const qd = el("div", "q");
      qd.append(tag(o.category), el("p", null, o.text));
      const freq = el("div", "freq");
      const track = el("div", "bar-track");
      const fill = el("div", "bar-fill");
      fill.style.width = (o.count / max) * 100 + "%";
      track.append(fill);
      freq.append(el("span", null, "Heard " + o.count + " times"), track);
      const acts = el("div", "obj-actions");
      const see = el("button", "btn btn-quiet", "See answer");
      see.type = "button";
      see.addEventListener("click", () => openSheet(row, renderCard(api.match(o.text))));
      const add = el("button", "btn");
      add.type = "button";
      const paint = () => {
        const on = practiceList.includes(o.text);
        add.className = "btn btn-quiet" + (on ? " btn-added" : "");
        add.textContent = on ? "✓ In my list" : "+ Practice";
      };
      paint();
      add.addEventListener("click", () => {
        if (practiceList.includes(o.text)) {
          practiceList = practiceList.filter((t) => t !== o.text);
          saveList();
          paint();
          renderDrawer();
          return;
        }
        practiceList = [...practiceList, o.text];
        saveList();
        paint();
        openDrawer(o.text);
      });
      acts.append(see, add);
      row.append(qd, freq, acts);
      rows.append(row);
    });
    stagger(rows.children, 25);
  }
  updateListCounts();

  // ---------- Practice ----------
  // Your results are kept in this browser. History before this month and the team board are sample data.
  let attempts = store.get("sk.attempts", []);
  let practiceMode = "all";
  const BASE_XP = 2140, XP_LEVEL = 500;
  const LEVELS = ["Rookie", "Listener", "Problem solver", "Objection handler", "Trusted advisor", "Objection pro", "Closer", "Legend"];
  const thisMonth = () => new Date().toISOString().slice(0, 7);
  const monthName = (d = new Date()) => d.toLocaleString("en-US", { month: "long" });

  function practiceStats() {
    const mine = attempts.filter((a) => a.t.slice(0, 7) === thisMonth());
    const sum = 7.0 * 6 + mine.reduce((n, a) => n + a.score, 0); // 6 sample attempts earlier this month
    const count = 6 + mine.length;
    const xp = BASE_XP + attempts.reduce((n, a) => n + a.score * 10, 0);
    const days = new Set(attempts.map((a) => a.t.slice(0, 10)));
    const today = new Date().toISOString().slice(0, 10);
    return { avg: sum / count, count, xp, streak: 4 + (days.has(today) ? 1 : 0) };
  }

  function stat(label, value, foot) {
    const s = el("div", "stat");
    s.append(el("span", "label", label));
    const v = el("strong", null, value);
    s.append(v);
    if (foot) s.append(foot);
    return s;
  }

  function renderPracticeStats() {
    const st = practiceStats();
    const last = D.practiceHistory[D.practiceHistory.length - 1];
    const level = Math.floor(st.xp / XP_LEVEL) + 1;
    const into = st.xp % XP_LEVEL;
    const host = $("pr-stats");
    host.innerHTML = "";

    const xp = el("div", "xp");
    const bar = el("div");
    bar.style.width = (into / XP_LEVEL) * 100 + "%";
    xp.append(bar);
    const lvlFoot = el("div");
    lvlFoot.style.display = "grid"; lvlFoot.style.gap = "6px";
    lvlFoot.append(xp, el("small", null, (XP_LEVEL - into) + " XP to level " + (level + 1)));
    host.append(stat("Level " + level, LEVELS[Math.min(level - 1, LEVELS.length - 1)], lvlFoot));

    host.append(stat("Streak", st.streak + " days", el("small", null, "Practice today to keep it going")));

    const diff = st.avg - last.avg;
    const foot = el("small");
    const d = el("span", diff >= 0 ? "up" : null, (diff >= 0 ? "↑ " : "↓ ") + Math.abs(diff).toFixed(1));
    foot.append(d, document.createTextNode(" vs " + last.month));
    host.append(stat("Average score, " + monthName(), st.avg.toFixed(1), foot));

    host.append(stat("Practiced this month", String(st.count), el("small", null, "objections answered")));
  }

  const SVG = "http://www.w3.org/2000/svg";
  function svg(tagName, attrs) {
    const n = document.createElementNS(SVG, tagName);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function renderMonthly() {
    const st = practiceStats();
    const data = [...D.practiceHistory, { month: monthName().slice(0, 3), avg: st.avg, now: true }];
    const W = 560, H = 220, L = 28, R = 8, T = 22, B = 28;
    const bw = (W - L - R) / data.length;
    const y = (v) => T + (1 - v / 10) * (H - T - B);
    const s = svg("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Average practice score per month" });
    [0, 5, 10].forEach((v) => {
      s.append(svg("line", { class: "grid", x1: L, x2: W - R, y1: y(v), y2: y(v) }));
      const t = svg("text", { x: L - 8, y: y(v) + 4, "text-anchor": "end" });
      t.textContent = v;
      s.append(t);
    });
    data.forEach((d, i) => {
      const x = L + i * bw + bw * 0.22, w = bw * 0.56;
      s.append(svg("rect", { class: "bar" + (d.now ? " now" : ""), x, y: y(d.avg), width: w, height: y(0) - y(d.avg), rx: 6 }));
      const v = svg("text", { class: "val", x: x + w / 2, y: y(d.avg) - 7, "text-anchor": "middle" });
      v.textContent = d.avg.toFixed(1);
      const m = svg("text", { x: x + w / 2, y: H - 8, "text-anchor": "middle" });
      m.textContent = d.month;
      s.append(v, m);
    });
    $("pr-chart").innerHTML = "";
    $("pr-chart").append(s);
  }

  function renderLeaderboard() {
    const st = practiceStats();
    const colors = ["var(--c-data)", "var(--c-control)", "var(--c-trust)", "var(--c-cost)", "var(--c-change)"];
    const rows = D.leaderboard.map((p, i) => ({ ...p, color: colors[i % colors.length] }));
    rows.push({ name: D.user.name + " (you)", initials: D.user.initials, avg: st.avg, count: st.count, you: true, color: "var(--c-value)" });
    rows.sort((a, b) => b.avg - a.avg);
    $("lb-title").textContent = "Team leaderboard, " + monthName();
    const host = $("pr-board");
    host.innerHTML = "";
    rows.forEach((p, i) => {
      const li = el("li", p.you ? "you" : null);
      const av = el("span", "av", p.initials);
      av.style.background = p.color;
      const who = el("div", "who");
      who.append(el("strong", null, p.name), el("small", null, p.count + " practiced"));
      li.append(el("span", "rank", String(i + 1)), av, who, el("span", "sc", p.avg.toFixed(1)));
      host.append(li);
    });
  }

  function enterPractice() {
    renderPracticeStats();
    renderMonthly();
    renderLeaderboard();
    updateListCounts();
    const fresh = !$("practice-q").textContent || pendingList;
    setPracticeMode(pendingList ? "list" : practiceMode === "list" && practiceList.length ? "list" : "all", fresh);
    pendingList = false;
  }

  function setPracticeMode(m, fetchNew) {
    if (m === "list" && !practiceList.length) {
      toast("Your practice list is empty. Add objections from the Objections tab.");
      m = "all";
    }
    if (m === "list") {
      if (!listLeft().length) resetList();
      hide($("pr-done"));
    }
    const changed = m !== practiceMode;
    practiceMode = m;
    $("pr-mode").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.m === m)));
    if (changed || fetchNew) nextPractice();
  }
  $("pr-mode").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) setPracticeMode(b.dataset.m);
  });

  async function nextPractice() {
    const current = $("practice-q").dataset.raw || "";
    let objection;
    if (practiceMode === "list" && practiceList.length) {
      const left = listLeft();
      const pool = left.length > 1 ? left.filter((t) => t !== current) : left.length ? left : practiceList;
      objection = pool[Math.floor(Math.random() * pool.length)];
    } else {
      objection = (await api.practiceNext(current)).objection;
    }
    $("practice-q").textContent = "“" + objection.replace(/^“|”$/g, "") + "”";
    $("practice-q").dataset.raw = objection;
    const pq = $("practice-q");
    if (!reduceMotion) { pq.classList.remove("appear"); void pq.offsetWidth; pq.classList.add("appear"); }
    $("practice-input").value = "";
    growInput();
    showPracticePlaceholder();
    $("practice-submit").hidden = false;
    $("practice-skip").textContent = "Skip";
  }
  function showPracticePlaceholder() {
    const out = $("practice-result");
    out.innerHTML = "";
    const ph = el("div", "placeholder");
    ph.innerHTML = '<svg viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="18" stroke="currentColor" stroke-width="3" opacity=".25"/><path d="M22 4a18 18 0 0 1 18 18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
    ph.append(el("p", null, "Your score and tips show up here."));
    out.append(ph);
  }
  // The answer box starts as one line and grows with the text.
  function growInput() {
    const t = $("practice-input");
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 300) + "px";
    t.style.overflowY = t.scrollHeight > 300 ? "auto" : "hidden";
  }
  $("practice-input").addEventListener("input", growInput);
  $("practice-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (!$("practice-submit").hidden) submitPractice(); }
  });

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
    const wait = el("div", "placeholder");
    wait.append(thinking(), el("p", null, "Scoring your answer…"));
    out.append(wait);
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
      attempts.push({ t: new Date().toISOString(), score: r.score });
      store.set("sk.attempts", attempts);
      markPracticed($("practice-q").dataset.raw);
      const before = Math.floor((practiceStats().xp - r.score * 10) / XP_LEVEL);
      renderPracticeStats();
      renderMonthly();
      renderLeaderboard();
      if (Math.floor(practiceStats().xp / XP_LEVEL) > before) toast("Level up! You reached level " + (before + 2) + ".");
      else toast("+" + r.score * 10 + " XP");
      $("practice-submit").hidden = true;
      $("practice-skip").textContent = "Next objection";
    } catch (e) {
      showPracticePlaceholder();
      toast("Couldn't score that. Try again.");
    } finally {
      $("practice-submit").disabled = false;
    }
  }
  // A list item counts as practiced once it's scored. When the whole list is done,
  // say so and move on to the full library.
  function markPracticed(text) {
    if (practiceMode !== "list" || !practiceList.includes(text) || listDone.includes(text)) return;
    listDone.push(text);
    saveDone();
    renderDrawer();
    if (!listLeft().length) {
      $("pr-done").hidden = false;
      practiceMode = "all";
      $("pr-mode").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.m === "all")));
    }
  }
  $("pr-again").addEventListener("click", () => { resetList(); setPracticeMode("list", true); });
  $("pr-view-list").addEventListener("click", () => openDrawer());
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

  // Each person can arrange the dashboard; the order is saved in this browser.
  const dash = document.querySelector(".dash");
  dash.querySelectorAll(".panel").forEach((p) => (p.draggable = true));
  (store.get("sk.dash", []) || []).forEach((id) => {
    const p = dash.querySelector(`[data-id="${id}"]`);
    if (p) dash.append(p);
  });
  sortable(dash, ".panel", () => store.set("sk.dash", [...dash.children].map((p) => p.dataset.id)));

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

  // ---------- Greeting: a small wave runs through the letters when Hen arrives ----------
  (function hello() {
    const h = $("hello");
    const text = h.textContent;
    h.textContent = "";
    h.setAttribute("aria-label", text);
    [...text].forEach((ch, i) => {
      const span = el("span", "ch", ch);
      span.setAttribute("aria-hidden", "true");
      span.style.animationDelay = 300 + i * 32 + "ms";
      if (i >= 3 && i <= 5) span.classList.add("hen");
      h.append(span);
    });
    if (!reduceMotion) h.classList.add("wave");
  })();

  // ---------- Start ----------
  route();
  document.querySelectorAll(".seg, .mini-seg").forEach(pill);
})();
