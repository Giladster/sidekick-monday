// Owner-only text editing. Double-click any text to edit it.
// Enter or clicking away saves, Escape cancels, an empty text restores the original.
// Edits are stored as { original -> new text } and applied to the page for every viewer.
// Runs only inside a claude.ai artifact (needs the user + db capabilities); elsewhere it does nothing.
(function () {
  if (!window.claude || !window.claude.use) return;

  let overrides = new Map();       // original text -> edited text
  const originals = new WeakMap(); // text node -> its original text
  let ref = null;
  let canEdit = false;
  let saving = Promise.resolve();

  const SKIP = "script, style, textarea, input, .editing";

  function textNodes(root) {
    const out = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      if (!n.nodeValue.trim()) continue;
      if (n.parentElement && n.parentElement.closest(SKIP)) continue;
      out.push(n);
    }
    return out;
  }

  function setText(node, text) {
    const raw = node.nodeValue;
    const lead = raw.match(/^\s*/)[0];
    const trail = raw.match(/\s*$/)[0];
    const next = lead + text + trail;
    if (raw !== next) node.nodeValue = next;
  }

  function apply() {
    for (const node of textNodes(document.body)) {
      const current = node.nodeValue.trim();
      const orig = originals.has(node) ? originals.get(node) : current;
      const want = overrides.get(orig);
      if (want !== undefined) {
        originals.set(node, orig);
        if (want !== current) setText(node, want);
      } else if (originals.has(node) && current !== orig) {
        setText(node, orig);
      }
    }
  }

  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; apply(); });
  }).observe(document.body, { childList: true, subtree: true, characterData: true });

  function save() {
    if (!ref) return;
    const items = [...overrides].map(([from, to]) => ({ from, to }));
    saving = saving
      .then(() => ref.set({ items }))
      .catch(() => toast("Couldn't save the edit. Check your connection and try again."));
  }

  function toast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => (t.hidden = true), 2600);
  }

  function nodeAt(x, y) {
    if (document.caretPositionFromPoint) {
      const p = document.caretPositionFromPoint(x, y);
      return p && p.offsetNode;
    }
    const r = document.caretRangeFromPoint && document.caretRangeFromPoint(x, y);
    return r && r.startContainer;
  }

  function startEdit(node) {
    const orig = originals.has(node) ? originals.get(node) : node.nodeValue.trim();
    const span = document.createElement("span");
    span.className = "editing";
    span.textContent = node.nodeValue.trim();
    try { span.contentEditable = "plaintext-only"; } catch (e) { span.contentEditable = "true"; }
    if (span.contentEditable !== "plaintext-only") span.contentEditable = "true";
    node.replaceWith(span);

    let done = false;
    const finish = (keep) => {
      if (done) return;
      done = true;
      const text = span.textContent.replace(/\s+/g, " ").trim();
      if (keep) {
        if (!text || text === orig) overrides.delete(orig);
        else overrides.set(orig, text);
      }
      const shown = overrides.get(orig);
      node.nodeValue = node.nodeValue.replace(/\S[\s\S]*\S|\S/, () => (shown !== undefined ? shown : orig));
      originals.set(node, orig);
      span.replaceWith(node);
      if (keep) save();
    };

    // Keep keys and clicks inside the editor from triggering buttons or forms.
    ["keyup", "keypress", "click", "mousedown", "dblclick"].forEach((t) =>
      span.addEventListener(t, (e) => e.stopPropagation())
    );
    span.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") { e.preventDefault(); finish(true); }
      if (e.key === "Escape") { e.preventDefault(); finish(false); }
    });
    span.addEventListener("blur", () => finish(true));

    span.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(span);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  document.addEventListener("dblclick", (e) => {
    if (!canEdit) return;
    const node = nodeAt(e.clientX, e.clientY);
    if (!node || node.nodeType !== Node.TEXT_NODE || !node.nodeValue.trim()) return;
    if (node.parentElement.closest(SKIP)) return;
    e.preventDefault();
    e.stopPropagation();
    startEdit(node);
  }, true);

  (async () => {
    const user = await window.claude.use("user");
    canEdit = user ? await user.isOwner() : false;
    const db = await window.claude.use("db");
    if (db) {
      ref = db.doc("content/text");
      ref.onSnapshot((snap) => {
        const items = (snap.exists && snap.data().items) || [];
        overrides = new Map(items.filter((i) => i && typeof i.from === "string" && typeof i.to === "string").map((i) => [i.from, i.to]));
        apply();
      }, () => {});
    }
    if (canEdit) {
      document.documentElement.classList.add("can-edit");
      toast(ref ? "Double-click any text to edit it." : "Edits can't be saved here.");
    }
  })();
})();
