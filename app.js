"use strict";
/* ═══════════════════════════════════════════════════════════════════════
   Skills Dashboard — shared page logic. One shell, any course: nothing here
   names a course, a language, an institution or a session count.

   Two data files, both plain <script> globals (so file:// works):
     skills.js  → window.SKILLS   course, categories, sessions, skills
     focus.js   → window.FOCUS    optional meta + per-session technical focus,
                                  the "why it matters" link, interview questions

   A session page is a short technical page about ONE main technical focus:
     header → the focus → the checklist → why it matters → interview.
   If focus.js has no entry for a session, the checklist still renders and the
   page says the focus content is coming.

   Everything course-specific comes from SKILLS.course:
     code, title, institution, term            header, nav brand, footer
     sessions_url, starter_url, companion_url  header links
     lms          (default "CourseWorks")      LMS name in link labels
     lang         (default "C++")              chip on an unlabelled code block
     accent, accent_2 [, accent_3, accent_deep]  theme, applied to :root
     storage_prefix (default "hft-skills")     localStorage namespace
   and from the optional FOCUS.meta: link_title, link_kicker, link_phrase,
   link_short, interview_title, interview_kicker.

   Categories are whatever skills.js lists — any ids, any number; the colour of
   a row or dot is the category's own `color`. Sessions are whatever skills.js
   lists — any numbers (0-based is fine), any dates, any count.

   All data text reaches the DOM through textContent; never innerHTML.
   Progress lives in localStorage under  <storage_prefix>:<skill id>
   ═══════════════════════════════════════════════════════════════════════ */
(function () {

  /* ── tiny DOM helpers ───────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = String(text);
    return e;
  }
  function clear(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
  function add(parent, child) { parent.appendChild(child); return child; }
  function show(node, on) { if (node) node.hidden = !on; }
  function txt(v) { return v === undefined || v === null ? "" : String(v); }
  /* a DOM-id-safe form of a skill id ("cpp.pointers" → "cpp-pointers") */
  function domId(id) { return txt(id).replace(/[^A-Za-z0-9_-]+/g, "-"); }

  /* ── data model ───────────────────────────────────── */
  var S = window.SKILLS;
  function fail(msg) {
    var host = $("app") || document.body;
    clear(host);
    var s = add(host, el("section"));
    add(s, el("div", "kicker", "Data problem"));
    add(s, el("h1", null, "The skills data could not be loaded"));
    add(s, el("p", "lead", msg));
    add(s, el("p", "sub", "skills.js must define window.SKILLS — see README.md."));
  }
  if (!S || !S.course || !Array.isArray(S.categories) || !Array.isArray(S.sessions)
      || !Array.isArray(S.skills)) {
    fail("skills.js did not define a valid window.SKILLS object.");
    return;
  }

  /* Everything course-specific lives in SKILLS.course, so one shell can serve
     several courses from the same origin. cstr() = trimmed string or default. */
  var COURSE = S.course;
  function cstr(v, dflt) {
    var t = txt(v).replace(/^\s+/, "").replace(/\s+$/, "");
    return t ? t : dflt;
  }
  var LMS  = cstr(COURSE.lms, "CourseWorks");   /* Canvas/CourseWorks/Blackboard… */
  var LANG = cstr(COURSE.lang, "C++");          /* chip on a code block with no deck */

  /* ── accent colours → CSS custom properties on :root ────────────
        SKILLS.course.accent / .accent_2 (hex). With neither set, the stylesheet
        defaults (Columbia blue) are re-applied verbatim. accent_3 (pale ink on
        code) and accent_deep are derived unless given explicitly. */
  var DEFAULT_ACCENTS = {
    accent: "#2e6db4", accent_2: "#b9d9eb", accent_3: "#e8f3fa", accent_deep: "#0b3d6e"
  };
  function parseHex(v) {
    var h = txt(v).replace(/^\s+/, "").replace(/\s+$/, "").replace(/^#/, "");
    if (/^[0-9a-fA-F]{3}$/.test(h)) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function toHex(rgb) {
    var out = "#", k, s;
    for (k = 0; k < 3; k++) {
      s = Math.max(0, Math.min(255, Math.round(rgb[k]))).toString(16);
      out += s.length < 2 ? "0" + s : s;
    }
    return out;
  }
  function tint(rgb, t) {   /* toward white */
    return [rgb[0] + (255 - rgb[0]) * t, rgb[1] + (255 - rgb[1]) * t, rgb[2] + (255 - rgb[2]) * t];
  }
  function shade(rgb, t) {  /* toward black */
    return [rgb[0] * (1 - t), rgb[1] * (1 - t), rgb[2] * (1 - t)];
  }
  function applyAccents() {
    var root = document.documentElement;
    if (!root || !root.style || !root.style.setProperty) return;
    var a1 = parseHex(COURSE.accent), a2 = parseHex(COURSE.accent_2);
    var a3 = parseHex(COURSE.accent_3), ad = parseHex(COURSE.accent_deep);
    var custom = !!(a1 || a2);
    if (!a1) a1 = parseHex(DEFAULT_ACCENTS.accent);
    if (!a2) a2 = custom ? tint(a1, 0.62) : parseHex(DEFAULT_ACCENTS.accent_2);
    if (!a3) a3 = custom ? tint(a2, 0.70) : parseHex(DEFAULT_ACCENTS.accent_3);
    if (!ad) ad = custom ? shade(a1, 0.55) : parseHex(DEFAULT_ACCENTS.accent_deep);
    function set(name, value) { try { root.style.setProperty(name, value); } catch (e) { /* ignore */ } }
    function rgbList(c) {
      return Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]);
    }
    set("--accent", toHex(a1));
    set("--accent-2", toHex(a2));
    set("--accent-3", toHex(a3));
    set("--accent-deep", toHex(ad));
    set("--accent-rgb", rgbList(a1));
    set("--accent-2-rgb", rgbList(a2));
  }
  applyAccents();

  /* ── progress store (localStorage, with an in-memory fallback so the
        page still works from file:// in a locked-down browser)
        The namespace comes from SKILLS.course.storage_prefix, so sibling
        courses published on the same github.io origin never collide. ──── */
  var PREFIX = cstr(COURSE.storage_prefix, "hft-skills") + ":";
  var mem = {}, useLS = true;
  try {
    var probe = PREFIX + "__probe";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
  } catch (e) { useLS = false; }

  var store = {
    get: function (id) {
      if (!useLS) return !!mem[id];
      try { return window.localStorage.getItem(PREFIX + id) === "1"; } catch (e) { return !!mem[id]; }
    },
    set: function (id, on) {
      mem[id] = !!on;
      if (!useLS) return;
      try {
        if (on) window.localStorage.setItem(PREFIX + id, "1");
        else window.localStorage.removeItem(PREFIX + id);
      } catch (e) { useLS = false; }
    },
    reset: function () {
      mem = {};
      if (!useLS) return;
      try {
        var kill = [], i, k;
        for (i = 0; i < window.localStorage.length; i++) {
          k = window.localStorage.key(i);
          if (k && k.indexOf(PREFIX) === 0) kill.push(k);
        }
        for (i = 0; i < kill.length; i++) window.localStorage.removeItem(kill[i]);
      } catch (e) { /* ignore */ }
    },
    available: function () { return useLS; }
  };

  var CATS = S.categories.slice();
  var SESS = S.sessions.slice().sort(function (a, b) { return a.n - b.n; });
  var byId = {}, byCat = {}, i;
  for (i = 0; i < CATS.length; i++) byCat[CATS[i].id] = CATS[i];
  for (i = 0; i < S.skills.length; i++) byId[S.skills[i].id] = S.skills[i];
  var sessByN = {}, sessIdx = {};
  for (i = 0; i < SESS.length; i++) { sessByN[SESS[i].n] = SESS[i]; sessIdx[SESS[i].n] = i; }
  /* the highest session number in the data — sessions may start at 0 (or any n),
     so never use SESS.length as "the last session number" */
  var LAST_N = SESS.length ? SESS[SESS.length - 1].n : 0;
  var WORD = (S.course && S.course.session_word) || "Session";   // "Week" for courses that count weeks
  var DECK_WORD = (S.course && S.course.deck_word) || "";          // "Week" → "Deck Week 2" instead of "Deck W2"
  function deckName(d) { var m = /^w(\d+)$/i.exec(String(d)); return m && DECK_WORD ? "Deck " + DECK_WORD + " " + m[1] : "Deck " + String(d).toUpperCase(); }
  /* neighbours by position in the sorted list, so gaps in numbering are fine */
  function neighbour(n, dir) {
    var k = sessIdx[n];
    if (k === undefined) return null;
    return SESS[k + dir] || null;
  }

  /* focus.js is optional, and may be missing individual sessions */
  var FOCUS = (window.FOCUS && Array.isArray(window.FOCUS.sessions)) ? window.FOCUS : null;
  var focusByN = {};
  if (FOCUS) {
    for (i = 0; i < FOCUS.sessions.length; i++) {
      var fs = FOCUS.sessions[i];
      if (fs && fs.n !== undefined && fs.n !== null) focusByN[Number(fs.n)] = fs;
    }
  }
  /* focus.js may also carry a `meta` object that renames the two standing
     sections. Every field is optional; the defaults are the HFT wording. */
  var FMETA = (window.FOCUS && window.FOCUS.meta && typeof window.FOCUS.meta === "object")
    ? window.FOCUS.meta : {};
  var META = {
    link_title:      cstr(FMETA.link_title, "Why this matters in HFT"),
    link_kicker:     cstr(FMETA.link_kicker, "The link with HFT"),
    link_phrase:     cstr(FMETA.link_phrase, "why it matters in an HFT system"),
    link_short:      cstr(FMETA.link_short, "HFT link"),
    interview_title: cstr(FMETA.interview_title, "Interview questions"),
    interview_kicker: cstr(FMETA.interview_kicker, "Interview")
  };

  function focusOf(n) { return focusByN[n] || null; }
  function conceptsOf(f) { return f && Array.isArray(f.concepts) ? f.concepts : []; }
  function ivOf(f) { return f && Array.isArray(f.interview) ? f.interview : []; }
  function hftParas(f) {
    if (!f || !f.hft) return [];
    var h = f.hft;
    if (Array.isArray(h.paragraphs)) return h.paragraphs;
    if (h.text) return [h.text];
    return [];
  }
  function ivCountAll() {
    var t = 0, k;
    for (k = 0; k < SESS.length; k++) t += ivOf(focusOf(SESS[k].n)).length;
    return t;
  }

  function catOf(id) { return byCat[id] || { id: id, name: id, color: "#9aa0a6" }; }
  function skillsOf(session) {
    var out = [], k;
    var ids = Array.isArray(session.skills) ? session.skills : [];
    for (k = 0; k < ids.length; k++) if (byId[ids[k]]) out.push(byId[ids[k]]);
    return out;
  }

  /* ── dates: "today" on the US Eastern course clock ──────────────── */
  function easternToday() {
    try {
      return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York",
        year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    } catch (e) {
      return new Date().toISOString().slice(0, 10);
    }
  }
  var TODAY = easternToday();
  function fmtDate(iso) {
    if (!iso) return "";
    var d = new Date(String(iso) + "T12:00:00Z");
    if (isNaN(d.getTime())) return String(iso);
    try {
      return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short",
        month: "short", day: "numeric", year: "numeric" }).format(d);
    } catch (e) { return String(iso); }
  }
  /* highest session number whose date is on or before today; null before the
     term starts (null, not 0 — session numbering may legitimately start at 0) */
  function latestTaught() {
    var n = null;
    for (var k = 0; k < SESS.length; k++) {
      if (SESS[k].date && String(SESS[k].date) <= TODAY) {
        if (n === null || SESS[k].n > n) n = SESS[k].n;
      }
    }
    return n;
  }
  var TAUGHT_N = latestTaught();
  function isFuture(n) { return TAUGHT_N === null || n > TAUGHT_N; }

  /* ── counting ───────────────────────────────────────────────────── */
  function tally(list) {
    var t = { total: list.length, checked: 0 }, k;
    for (k = 0; k < list.length; k++) if (store.get(list[k].id)) t.checked++;
    return t;
  }
  function pct(a, b) { return b > 0 ? Math.round((a / b) * 100) : 0; }

  /* ── shared bits of chrome ──────────────────────────────────────── */
  function courseName() { return S.course.code + " · " + S.course.title; }
  function buildNav(crumbs, right) {
    var nav = $("nav");
    if (!nav) return;
    clear(nav);
    var home = add(nav, el("a", null, S.course.code + " Skills"));
    home.href = "index.html";
    var c = add(nav, el("span", "crumbs"));
    for (var k = 0; k < crumbs.length; k++) {
      if (k) add(c, document.createTextNode(" · "));
      if (crumbs[k].href) {
        var a = add(c, el("a", null, crumbs[k].label)); a.href = crumbs[k].href;
      } else add(c, el("b", null, crumbs[k].label));
    }
    add(nav, el("span", "spacer"));
    if (right) {
      var r = add(nav, el("a", "crumbs", right.label));
      r.href = right.href;
    }
  }
  function buildFooter() {
    var f = $("foot");
    if (!f) return;
    clear(f);
    f.appendChild(document.createTextNode(courseName() + " · " + S.course.institution +
      " · " + S.course.term + " · skills dashboard. Progress is stored in this browser only."));
  }
  /* set the text of a node if the page has it (headings differ per page) */
  function setText(id, value) {
    var node = $(id);
    if (node) node.textContent = value;
  }
  function setDescription(text) {
    var m = document.querySelector ? document.querySelector('meta[name="description"]') : null;
    if (m) m.setAttribute("content", text);
  }
  function dots(depth) {
    var names = ["", "aware of it", "can use it", "can design with it"];
    var d = el("span", "dots"), k;
    var lvl = Math.max(1, Math.min(3, Number(depth) || 1));
    for (k = 1; k <= 3; k++) add(d, el("b", k <= lvl ? "on" : null));
    add(d, el("span", "dl", "depth " + lvl));
    d.title = "Depth " + lvl + " of 3 — " + names[lvl];
    d.setAttribute("aria-label", "Depth " + lvl + " of 3: " + names[lvl]);
    return d;
  }
  function chipsFor(skill) {
    var c = el("div", "chips"), k, w, node;
    var list = Array.isArray(skill.where) ? skill.where : [];
    for (k = 0; k < list.length; k++) {
      w = list[k] || {};
      var kind = String(w.type || "link");
      var label = String(w.label || kind);
      // "Deck W2 · slides 7-10" already names its kind: drop the duplicate word.
      if (label.toLowerCase().indexOf(kind.toLowerCase() + " ") === 0) label = label.slice(kind.length + 1);
      if (w.url) {
        node = el("a", "chip");
        node.href = w.url;
        node.target = "_blank";
        node.rel = "noopener noreferrer";
      } else {
        node = el("span", "chip");
      }
      add(node, el("span", "ck", kind));
      add(node, document.createTextNode(label));
      if (w.url) node.setAttribute("aria-label", kind + ": " + label + " (opens in a new tab)");
      c.appendChild(node);
    }
    return c;
  }

  /* ── code blocks (dark, monospace, newlines preserved, copy button) ─ */
  function copyToClipboard(text, btn) {
    var original = "copy";
    function done(ok) {
      btn.textContent = ok ? "copied" : "copy failed";
      btn.className = "btn tiny copy noprint" + (ok ? " ok" : "");
      window.setTimeout(function () {
        btn.textContent = original;
        btn.className = "btn tiny copy noprint";
      }, 1600);
    }
    function legacy() {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "readonly");
        ta.style.position = "fixed";
        ta.style.left = "-2000px";
        ta.style.top = "0";
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        done(!!ok);
      } catch (e) { done(false); }
    }
    if (window.navigator && window.navigator.clipboard && window.navigator.clipboard.writeText) {
      try {
        window.navigator.clipboard.writeText(text).then(function () { done(true); }, legacy);
        return;
      } catch (e) { /* fall through */ }
    }
    legacy();
  }
  /* code: string · chipLabel: optional small chip (deck) · what: for a11y label */
  function codeBlock(code, chipLabel, what) {
    var body = txt(code).replace(/\s+$/, "");
    var wrap = el("div", "cb");
    var head = add(wrap, el("div", "cbh"));
    if (chipLabel) add(head, el("span", "chip deck", txt(chipLabel)));
    else add(head, el("span", "chip deck dimchip", LANG));
    var btn = add(head, el("button", "btn tiny copy noprint", "copy"));
    btn.type = "button";
    btn.setAttribute("aria-label", "Copy the code" + (what ? " for " + what : ""));
    var pre = add(wrap, el("pre", "code"));
    add(pre, el("code", null, body));
    btn.addEventListener("click", function () { copyToClipboard(body, btn); });
    return wrap;
  }

  /* ── answer text: plain text, except a ``` fenced block → code card ─ */
  function renderRichText(host, source, what) {
    var s = txt(source);
    var parts = s.split("```"), k, q;
    for (k = 0; k < parts.length; k++) {
      if (k % 2 === 1) {
        /* inside a fence: drop an optional language tag on the first line */
        var code = parts[k];
        if (/\r?\n/.test(code)) code = code.replace(/^[ \t]*[A-Za-z0-9+#.\-]*[ \t]*\r?\n/, "");
        code = code.replace(/^[\r\n]+/, "").replace(/\s+$/, "");
        if (code) host.appendChild(codeBlock(code, null, what));
      } else {
        var paras = parts[k].split(/\n{2,}/);
        for (q = 0; q < paras.length; q++) {
          var t = paras[q].replace(/^\s+/, "").replace(/\s+$/, "");
          if (t) add(host, el("p", "ap", t));
        }
      }
    }
  }

  /* ── a skill row: one compact line, evidence behind a toggle ─────── */
  function skillRow(skill, sessionN, onToggle) {
    var row = el("div", "srow");
    row.id = "skill-" + domId(skill.id);
    var cat = catOf(skill.category);
    row.style.borderLeftColor = cat.color || "#333a47";

    var cb = el("input");
    cb.type = "checkbox";
    cb.id = "cb-" + skill.id;
    cb.checked = store.get(skill.id);
    cb.setAttribute("aria-label", "I can do this: " + skill.name);
    cb.addEventListener("change", function () {
      store.set(skill.id, cb.checked);
      row.className = cb.checked ? "srow done" : "srow";
      if (onToggle) onToggle();
    });
    if (cb.checked) row.className = "srow done";
    row.appendChild(cb);

    var bd = add(row, el("div", "bd"));
    var line = add(bd, el("div", "ln"));
    var lab = add(line, el("label", "nm", skill.name));
    lab.setAttribute("for", cb.id);
    add(line, el("span", "can", skill.can));
    var tags = add(line, el("span", "tgs"));
    if (skill.interview) add(tags, el("span", "pill iv", "interview"));
    if (sessionN !== undefined && skill.introduced === sessionN) add(tags, el("span", "pill new", "new"));

    var det = add(bd, el("details", "where noprint"));
    var sm = add(det, el("summary", null, "where it's practised"));
    sm.setAttribute("aria-label", "Where " + skill.name + " is practised");
    var inner = add(det, el("div", "wb"));
    var meta = add(inner, el("div", "wmeta"));
    meta.appendChild(dots(skill.depth));
    var seen = [], k;
    /* `introduced` can be 0 — compare against null, never test truthiness */
    if (skill.introduced !== undefined && skill.introduced !== null) seen.push(skill.introduced);
    if (Array.isArray(skill.practised)) {
      for (k = 0; k < skill.practised.length; k++) {
        if (seen.indexOf(skill.practised[k]) < 0) seen.push(skill.practised[k]);
      }
    }
    seen.sort(function (a, b) { return a - b; });
    add(meta, el("span", "pill", "sessions " + seen.join(", ")));
    add(meta, el("span", "pill", catOf(skill.category).name));
    inner.appendChild(chipsFor(skill));
    row.__cb = cb;
    return row;
  }

  /* ═══════════════ PAGE: index — the focus timeline ════════════════ */
  function renderIndex() {
    document.title = S.course.code + " · Skills Dashboard";
    buildNav([{ label: "Session focus" }], { label: "All skills →", href: "skills.html" });
    buildFooter();

    $("hKicker").textContent = S.course.institution + " · " + S.course.term +
      " · " + SESS.length + " sessions";
    $("hCode").textContent = S.course.code;
    $("hTitle").textContent = S.course.title;

    /* the standing lead: the only course-specific words in it are the name of
       the "why it matters" section, which comes from FOCUS.meta.link_phrase */
    var lead = $("hLead");
    if (lead) {
      clear(lead);
      lead.appendChild(document.createTextNode("Every session of this course is built around "));
      add(lead, el("em", "hi", "one main technical focus"));
      lead.appendChild(document.createTextNode(". Each session page reads top to bottom: the focus " +
        "explained in code, the skills you should then be able to claim, " + META.link_phrase +
        ", and the interview questions that follow from it."));
    }
    setDescription("One technical focus per session: what it is, " + META.link_phrase +
      ", and the interview questions that follow.");

    var hl = $("hLinks");
    clear(hl);
    function hlink(kind, label, url) {
      if (!url) return;
      var a = add(hl, el("a", "lk"));
      a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
      add(a, el("span", "lt", kind));
      add(a, el("span", "lv", label));
      a.setAttribute("aria-label", kind + ": " + label + " (opens in a new tab)");
    }
    hlink(LMS, "Course site", S.course.sessions_url);
    hlink("GitHub", "Starter repository", S.course.starter_url);
    hlink("Companion", "Interactive course companion", S.course.companion_url);

    var NQ = ivCountAll();

    function refresh() {
      var all = tally(S.skills), k;
      var ivT = 0, ivC = 0;
      for (k = 0; k < S.skills.length; k++) {
        if (S.skills[k].interview) { ivT++; if (store.get(S.skills[k].id)) ivC++; }
      }
      $("progLine").textContent = all.checked + " / " + all.total + " skills checked (" +
        pct(all.checked, all.total) + "%) · " + ivC + " / " + ivT + " interview skills · " +
        NQ + " interview question" + (NQ === 1 ? "" : "s") + " across the term" +
        (TAUGHT_N === null ? " · term not started" : " · latest session " + TAUGHT_N);
      $("barAll").style.width = pct(all.checked, all.total) + "%";

      var ol = $("timeline");
      clear(ol);
      for (k = 0; k < SESS.length; k++) {
        var s = SESS[k], f = focusOf(s.n), list = skillsOf(s), t = tally(list);
        var li = add(ol, el("li", "tli"));
        var a = add(li, el("a", "trow" + (isFuture(s.n) ? " future" : "")));
        a.href = "session-" + s.n + ".html";
        a.setAttribute("aria-label", WORD + " " + s.n + ": " +
          (f && f.focus ? f.focus : s.title) + ". " + t.checked + " of " + t.total +
          " skills checked.");

        var c1 = add(a, el("div", "tn"));
        add(c1, el("span", "num", String(s.n)));
        add(c1, el("span", "dt", fmtDate(s.date)));

        var c2 = add(a, el("div", "tf"));
        add(c2, el("div", "fo", f && f.focus ? f.focus : s.title));
        /* the session title in small type under the focus — unless the focus is
           missing, in which case the title is already the big line */
        if (f && f.focus) add(c2, el("div", "ti", s.title));
        var tags = add(c2, el("div", "tt"));
        if (s.exam) add(tags, el("span", "pill warn", String(s.exam)));
        if (!f) add(tags, el("span", "pill", "focus content coming"));
        else if (ivOf(f).length) {
          add(tags, el("span", "pill", ivOf(f).length + " interview questions"));
        }

        var c3 = add(a, el("div", "tp"));
        var bar = add(c3, el("div", "bar thin"));
        add(bar, el("i")).style.width = pct(t.checked, t.total) + "%";
        add(c3, el("div", "pg", t.checked + " / " + t.total + " skills · " +
          pct(t.checked, t.total) + "%"));

        add(a, el("div", "tg", "Open session"));
      }
    }

    refresh();

    $("btnReset").addEventListener("click", function () {
      if (window.confirm("Clear every skill you have checked on this device? This cannot be undone.")) {
        store.reset();
        refresh();
      }
    });
    if (!store.available()) $("lsWarn").hidden = false;
    window.addEventListener("storage", function (ev) {
      if (!ev.key || ev.key.indexOf(PREFIX) === 0) refresh();
    });
  }

  /* ═══════════════ PAGE: session ═══════════════════════════════════ */
  function sessionNumber() {
    var n = null;
    /* a static wrapper sets window.SESSION_N (window.HFT_SESSION is the older
       name and is still honoured); ?n= wins over both */
    if (window.HFT_SESSION !== undefined && window.HFT_SESSION !== null) n = window.HFT_SESSION;
    if (window.SESSION_N !== undefined && window.SESSION_N !== null) n = window.SESSION_N;
    var q = String(window.location.search || "");
    var m = /[?&]n=([^&#]*)/.exec(q);
    if (m) n = decodeURIComponent(m[1]);
    var v = parseInt(n, 10);
    if (!isFinite(v) || String(v) !== String(n).trim() || !sessByN[v]) return null;
    return v;
  }

  function levelInfo(level) {
    var raw = txt(level).toLowerCase();
    if (raw.indexOf("warm") >= 0) return { cls: "lv-warm", label: "warm-up" };
    if (raw.indexOf("senior") >= 0) return { cls: "lv-senior", label: "senior" };
    if (raw.indexOf("core") >= 0) return { cls: "lv-core", label: "core" };
    return { cls: "lv-core", label: raw ? txt(level) : "core" };
  }

  function renderSession() {
    var n = sessionNumber();
    if (n === null) { window.location.replace("index.html"); return; }
    var s = sessByN[n];
    var f = focusOf(n);
    var list = skillsOf(s);
    var concepts = conceptsOf(f);
    var questions = ivOf(f);
    var paras = hftParas(f);
    var headline = (f && f.focus) ? String(f.focus) : s.title;

    document.title = WORD + " " + n + " · " + headline + " — " + S.course.code + " skills";
    var crumbs = [];
    var prev = neighbour(n, -1), next = neighbour(n, 1);
    if (prev) crumbs.push({ label: "← " + WORD + " " + prev.n, href: "session-" + prev.n + ".html" });
    crumbs.push({ label: WORD + " " + n + " · " + headline });
    if (next) crumbs.push({ label: WORD + " " + next.n + " →", href: "session-" + next.n + ".html" });
    buildNav(crumbs, { label: "All skills →", href: "skills.html" });
    buildFooter();

    /* ── 1 · header ─────────────────────────────────────────────── */
    $("hKicker").textContent = WORD + " " + n + " of " + SESS.length + " · " + fmtDate(s.date);
    /* the session title sits small above the focus; with no focus the title IS
       the big title, so don't print it twice */
    if (f && f.focus) { $("hSession").textContent = s.title; show($("hSession"), true); }
    else show($("hSession"), false);
    $("hFocus").textContent = headline;
    var tag = $("hTag");
    if (f && f.tagline) { tag.textContent = String(f.tagline); show(tag, true); }
    else show(tag, false);

    var badges = $("hBadges");
    clear(badges);
    if (f && f.focus) add(badges, el("span", "pill acc", "main focus"));
    if (s.exam) add(badges, el("span", "pill warn", String(s.exam) + " exam in this session"));
    var nnew = 0, k;
    for (k = 0; k < list.length; k++) if (list[k].introduced === n) nnew++;
    add(badges, el("span", "pill", list.length + " skills · " + nnew + " new this week"));
    if (questions.length) add(badges, el("span", "pill", questions.length + " interview questions"));

    var hl = $("hLinks");
    clear(hl);
    function box(kind, label, url, due) {
      var node = url ? el("a", "lk") : el("span", "lk plain");
      if (url) { node.href = url; node.target = "_blank"; node.rel = "noopener noreferrer"; }
      add(node, el("span", "lt", kind));
      add(node, el("span", "lv", label));
      if (due) add(node, el("span", "ld", "due " + fmtDate(due)));
      if (url) node.setAttribute("aria-label", kind + ": " + label + " (opens in a new tab)");
      hl.appendChild(node);
    }
    var decks = Array.isArray(s.decks) ? s.decks : [];
    for (k = 0; k < decks.length; k++) {
      box("Deck (on " + LMS + ")", deckName(decks[k]), null, null);
    }
    if (s.lab) box("Lab", s.lab.label || "Lab", s.lab.url, s.lab.due);
    if (s.hw) box("Homework", s.hw.label || "Homework", s.hw.url, s.hw.due);
    if (s.project) box("Project", s.project.label || "Project", s.project.url, s.project.due);
    if (s.companion_url) box("Companion", "Interactive page for this session", s.companion_url, null);

    /* ── 2 · the focus ──────────────────────────────────────────── */
    var ch = $("concepts");
    clear(ch);
    if (!f) {
      var note = add(ch, el("div", "note"));
      add(note, el("b", null, "Focus content coming. "));
      note.appendChild(document.createTextNode(
        "The main technical focus, the " + META.link_short + " and the interview questions for this " +
        "session are not written yet. The checklist below is live and your ticks are kept."));
      $("focusH").textContent = "The focus";
    } else if (!concepts.length) {
      add(ch, el("p", "sub", "No concepts are listed for this focus yet."));
    } else {
      for (k = 0; k < concepts.length; k++) {
        var c = concepts[k] || {};
        var card = add(ch, el("article", "concept"));
        var hd = add(card, el("div", "chd"));
        add(hd, el("div", "cnum", String(k + 1)));
        var ht = add(hd, el("div", "ctt"));
        add(ht, el("h3", "cti", txt(c.title) || "Concept " + (k + 1)));
        if (c.text) add(ht, el("p", "ctx", txt(c.text)));
        if (c.code) card.appendChild(codeBlock(c.code, c.deck, txt(c.title)));
        else if (c.deck) add(card, el("div", "chips")).appendChild(el("span", "chip deck", txt(c.deck)));
      }
    }
    show($("focus-sec"), true);

    /* ── 3 · the checklist ──────────────────────────────────────── */
    var host = $("skills");
    clear(host);
    function afterToggle() { refreshCounts(); }
    for (k = 0; k < list.length; k++) host.appendChild(skillRow(list[k], n, afterToggle));
    if (!list.length) add(host, el("p", "empty", "No skills are listed for this session yet."));

    function refreshCounts() {
      var t = tally(list), q;
      $("barHere").style.width = pct(t.checked, t.total) + "%";
      $("ckCount").textContent = t.checked + " of " + t.total + " ticked (" +
        pct(t.checked, t.total) + "%) · tick one only when the sentence is true of you";
      for (q = 0; q < list.length; q++) {
        var cb = $("cb-" + list[q].id);
        if (cb) {
          cb.checked = store.get(list[q].id);
          var row = cb.parentNode;
          if (row) row.className = cb.checked ? "srow done" : "srow";
        }
      }
    }
    refreshCounts();

    $("btnAll").addEventListener("click", function () {
      for (var q = 0; q < list.length; q++) store.set(list[q].id, true);
      refreshCounts();
    });
    $("btnNone").addEventListener("click", function () {
      for (var q = 0; q < list.length; q++) store.set(list[q].id, false);
      refreshCounts();
    });
    $("btnPrint").addEventListener("click", function () { window.print(); });

    /* ── 4 · the link section (titled from FOCUS.meta) ──────────── */
    setText("hftH", META.link_title);
    setText("hftK", META.link_kicker);
    setText("ivH", META.interview_title);
    setText("ivK", META.interview_kicker);
    var hh = $("hft");
    clear(hh);
    if (paras.length || (f && f.hft && f.hft.example)) {
      for (k = 0; k < paras.length; k++) add(hh, el("p", "hp", txt(paras[k])));
      var ex = f && f.hft ? f.hft.example : null;
      if (ex && (ex.code || ex.text)) {
        var card = add(hh, el("div", "arena"));
        add(card, el("h3", "ath", txt(ex.title) || "In the arena"));
        if (ex.text) add(card, el("p", "ctx", txt(ex.text)));
        if (ex.code) card.appendChild(codeBlock(ex.code, null, txt(ex.title) || "the arena example"));
      }
      show($("hft-sec"), true);
    } else {
      show($("hft-sec"), false);
    }

    /* ── 5 · interview questions ────────────────────────────────── */
    function jumpToSkill(id) {
      var row = $("skill-" + domId(id));
      if (!row) return;
      try { row.scrollIntoView({ block: "center", behavior: "smooth" }); }
      catch (e) { row.scrollIntoView(); }
      var base = row.className.replace(/\s*flash/g, "");
      row.className = base + " flash";
      window.setTimeout(function () { row.className = row.className.replace(/\s*flash/g, ""); }, 2400);
      if (row.__cb && row.__cb.focus) { try { row.__cb.focus({ preventScroll: true }); } catch (e2) { /* ignore */ } }
    }

    var ih = $("iv");
    clear(ih);
    if (questions.length) {
      for (k = 0; k < questions.length; k++) {
        (function (item, idx) {
          var d = add(ih, el("details", "qa"));
          var sm = add(d, el("summary"));
          add(sm, el("span", "qn", String(idx + 1)));
          add(sm, el("span", "qt", txt(item.q)));
          var li2 = levelInfo(item.level);
          add(sm, el("span", "pill lv " + li2.cls, li2.label));
          var body = add(d, el("div", "qb"));
          renderRichText(body, item.a, "the answer to question " + (idx + 1));
          if (item.skill && byId[item.skill]) {
            var rel = add(body, el("a", "rel"));
            rel.href = "#skill-" + domId(item.skill);
            add(rel, el("span", "rl", "related skill"));
            add(rel, document.createTextNode(byId[item.skill].name));
            rel.addEventListener("click", function (ev) {
              if (ev.preventDefault) ev.preventDefault();
              jumpToSkill(item.skill);
            });
          }
        }(questions[k] || {}, k));
      }
      $("ivLead").textContent = "Answer each one out loud, then open it and compare. " +
        questions.length + " questions, from warm-up to senior.";
      show($("iv-sec"), true);
    } else {
      show($("iv-sec"), false);
    }

    function setAll(open) {
      var ds = ih.getElementsByTagName("details"), q;
      for (q = 0; q < ds.length; q++) ds[q].open = !!open;
    }
    $("btnRevealAll").addEventListener("click", function () { setAll(true); });
    $("btnHideAll").addEventListener("click", function () { setAll(false); });

    /* printing: answers expanded, then restore what the reader had open */
    var wasOpen = null;
    window.addEventListener("beforeprint", function () {
      var ds = ih.getElementsByTagName("details"), q;
      wasOpen = [];
      for (q = 0; q < ds.length; q++) { wasOpen.push(ds[q].open); ds[q].open = true; }
    });
    window.addEventListener("afterprint", function () {
      if (!wasOpen) return;
      var ds = ih.getElementsByTagName("details"), q;
      for (q = 0; q < ds.length && q < wasOpen.length; q++) ds[q].open = wasOpen[q];
      wasOpen = null;
    });

    /* ── 6 · prev / next ────────────────────────────────────────── */
    var pn = $("pn");
    clear(pn);
    function nav(dir, target) {
      if (!target) return;
      var m = target.n;
      var a = add(pn, el("a", "pncard"));
      a.href = "session-" + m + ".html";
      add(a, el("div", "nl", dir === -1 ? "← Previous session" : "Next session →"));
      var fm = focusOf(m);
      add(a, el("div", "nt", fm && fm.focus ? String(fm.focus) : target.title));
      add(a, el("div", "sub", "Session " + m + " · " + fmtDate(target.date)));
    }
    nav(-1, prev);
    nav(1, next);
    if (!pn.firstChild) {
      var a2 = add(pn, el("a", "pncard"));
      a2.href = "index.html";
      add(a2, el("div", "nl", "Back"));
      add(a2, el("div", "nt", "Course overview"));
    }
    window.addEventListener("storage", function (ev) {
      if (!ev.key || ev.key.indexOf(PREFIX) === 0) refreshCounts();
    });
  }

  /* ═══════════════ PAGE: catalogue ═════════════════════════════════ */
  function renderCatalogue() {
    document.title = "All skills · " + S.course.code;
    buildNav([{ label: "All skills" }], { label: "← Session focus timeline", href: "index.html" });
    buildFooter();
    $("hKicker").textContent = S.course.code + " · " + S.course.term + " · " +
      S.skills.length + " skills across " + SESS.length + " sessions";
    $("hTitle").textContent = "The whole skill catalogue";

    var fCat = $("fCat"), fSess = $("fSess"), fIv = $("fIv"), fChk = $("fChk"), fQ = $("fQ");
    function opt(sel, value, label) {
      var o = el("option", null, label);
      o.value = value;
      sel.appendChild(o);
    }
    clear(fCat); opt(fCat, "", "All categories");
    for (var k = 0; k < CATS.length; k++) opt(fCat, CATS[k].id, CATS[k].name);
    clear(fSess); opt(fSess, "", "All sessions");
    for (k = 0; k < SESS.length; k++) {
      opt(fSess, String(SESS[k].n), "Session " + SESS[k].n + " · " + SESS[k].title);
    }

    var tbody = $("tbody");

    function sessionsOfSkill(sk) {
      var seen = [], q;
      if (sk.introduced !== undefined && sk.introduced !== null) seen.push(sk.introduced);
      if (Array.isArray(sk.practised)) {
        for (q = 0; q < sk.practised.length; q++) if (seen.indexOf(sk.practised[q]) < 0) seen.push(sk.practised[q]);
      }
      seen.sort(function (a, b) { return a - b; });
      return seen;
    }

    function matches(sk) {
      if (fCat.value && sk.category !== fCat.value) return false;
      if (fSess.value && sessionsOfSkill(sk).indexOf(parseInt(fSess.value, 10)) < 0) return false;
      if (fIv.value === "yes" && !sk.interview) return false;
      if (fIv.value === "no" && sk.interview) return false;
      var on = store.get(sk.id);
      if (fChk.value === "yes" && !on) return false;
      if (fChk.value === "no" && on) return false;
      var q = fQ.value.trim().toLowerCase();
      if (q) {
        var hay = (sk.name + " " + sk.can).toLowerCase();
        var words = q.split(/\s+/);
        for (var i2 = 0; i2 < words.length; i2++) if (hay.indexOf(words[i2]) < 0) return false;
      }
      return true;
    }

    function td(row, cls, label) {
      var c = add(row, el("td", cls));
      if (label) c.setAttribute("data-l", label);
      return c;
    }

    function draw() {
      clear(tbody);
      var shown = 0, chk = 0, k2, sk;
      for (k2 = 0; k2 < S.skills.length; k2++) {
        sk = S.skills[k2];
        if (!matches(sk)) continue;
        shown++;
        if (store.get(sk.id)) chk++;
        (function (sk) {
          var tr = add(tbody, el("tr", store.get(sk.id) ? "done" : null));
          var c0 = td(tr, "chk");
          var cb = el("input");
          cb.type = "checkbox";
          cb.checked = store.get(sk.id);
          cb.setAttribute("aria-label", "I can do this: " + sk.name);
          cb.addEventListener("change", function () {
            store.set(sk.id, cb.checked);
            tr.className = cb.checked ? "done" : "";
            summary();
          });
          c0.appendChild(cb);

          var c1 = td(tr, "nm", "Skill");
          var cat = catOf(sk.category);
          var dot = add(c1, el("span", "catdot"));
          dot.style.background = cat.color || "#9aa0a6";
          dot.setAttribute("title", cat.name);
          add(c1, document.createTextNode(sk.name));
          if (sk.interview) {
            c1.appendChild(document.createTextNode(" "));
            add(c1, el("span", "pill iv", "interview"));
          }

          td(tr, "can", "You can").textContent = sk.can;
          td(tr, "c", "Category").textContent = cat.name;
          var cs = sessionsOfSkill(sk);
          td(tr, "c", "Sessions").textContent = "intro " + sk.introduced +
            (cs.length > 1 ? " · again " + cs.slice(1).join(", ") : "");
          var cd = td(tr, "c", "Depth");
          cd.appendChild(dots(sk.depth));
          var co = td(tr, "c", "Open");
          var a = add(co, el("a", null, "Session " + sk.introduced + " →"));
          a.href = "session-" + sk.introduced + ".html";
        }(sk));
      }
      if (!shown) {
        var tr = add(tbody, el("tr"));
        var c = add(tr, el("td", "empty"));
        c.colSpan = 7;
        c.textContent = "No skill matches these filters.";
      }
      $("stShown").textContent = shown + " / " + S.skills.length;
      $("stShownChk").textContent = chk + " / " + shown;
    }
    function summary() {
      var all = tally(S.skills);
      $("stAll").textContent = all.checked + " / " + all.total;
      var shown = 0, chk = 0;
      for (var k2 = 0; k2 < S.skills.length; k2++) {
        if (!matches(S.skills[k2])) continue;
        shown++;
        if (store.get(S.skills[k2].id)) chk++;
      }
      $("stShown").textContent = shown + " / " + S.skills.length;
      $("stShownChk").textContent = chk + " / " + shown;
    }
    function redraw() { draw(); summary(); }

    var ctrls = [fCat, fSess, fIv, fChk];
    for (k = 0; k < ctrls.length; k++) ctrls[k].addEventListener("change", redraw);
    fQ.addEventListener("input", redraw);
    $("btnClearF").addEventListener("click", function () {
      fCat.value = ""; fSess.value = ""; fIv.value = ""; fChk.value = ""; fQ.value = "";
      redraw();
    });
    redraw();
    window.addEventListener("storage", function (ev) {
      if (!ev.key || ev.key.indexOf(PREFIX) === 0) redraw();
    });
  }

  /* ── dispatch ───────────────────────────────────────────────────── */
  function boot() {
    var page = document.body.getAttribute("data-page");
    try {
      if (page === "index") renderIndex();
      else if (page === "session") renderSession();
      else if (page === "skills") renderCatalogue();
    } catch (err) {
      fail("Rendering failed: " + (err && err.message ? err.message : String(err)));
      if (window.console && window.console.error) window.console.error(err);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
}());
