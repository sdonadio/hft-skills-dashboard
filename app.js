"use strict";
/* ═══════════════════════════════════════════════════════════════════════
   HFT Skills Dashboard — shared page logic.
   Every page renders entirely from window.SKILLS (see README / SCHEMA).
   All data text reaches the DOM through textContent; never innerHTML.
   Progress lives in localStorage under  hft-skills:<skill id>
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
  var SVGNS = "http://www.w3.org/2000/svg";
  function mk(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag), k;
    for (k in attrs) { if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]); }
    return e;
  }
  function stext(x, y, s, size, fill, anchor, weight) {
    var t = mk("text", { x: x, y: y, fill: fill || "#9aa0a6",
      "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace" });
    if (size) t.setAttribute("font-size", size);
    if (anchor) t.setAttribute("text-anchor", anchor);
    if (weight) t.setAttribute("font-weight", weight);
    t.textContent = s;
    return t;
  }

  /* ── progress store (localStorage, with an in-memory fallback so the
        page still works from file:// in a locked-down browser) ──────── */
  var PREFIX = "hft-skills:";
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

  /* ── data model ─────────────────────────────────────────────────── */
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

  var CATS = S.categories.slice();
  var SESS = S.sessions.slice().sort(function (a, b) { return a.n - b.n; });
  var byId = {}, byCat = {}, i, j;
  for (i = 0; i < CATS.length; i++) byCat[CATS[i].id] = CATS[i];
  for (i = 0; i < S.skills.length; i++) byId[S.skills[i].id] = S.skills[i];
  var sessByN = {};
  for (i = 0; i < SESS.length; i++) sessByN[SESS[i].n] = SESS[i];

  function catOf(id) { return byCat[id] || { id: id, name: id, color: "#9aa0a6" }; }
  function skillsOf(session) {
    var out = [], k;
    var ids = Array.isArray(session.skills) ? session.skills : [];
    for (k = 0; k < ids.length; k++) if (byId[ids[k]]) out.push(byId[ids[k]]);
    return out;
  }
  /* short axis label, derived from the category name (no hard-coding) */
  function shortCat(name) {
    var t = String(name).split(/\s*[&/,]\s*/)[0].trim();
    return t.split(/\s+/)[0];
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
  /* highest session number whose date is on or before today; 0 before term */
  function latestTaught() {
    var n = 0;
    for (var k = 0; k < SESS.length; k++) {
      if (SESS[k].date && String(SESS[k].date) <= TODAY) n = Math.max(n, SESS[k].n);
    }
    return n;
  }
  var TAUGHT_N = latestTaught();

  /* ── counting ───────────────────────────────────────────────────── */
  /* a skill counts as "taught through n" when its introduced session <= n */
  function taughtThrough(n) {
    var out = [], k;
    for (k = 0; k < S.skills.length; k++) if (S.skills[k].introduced <= n) out.push(S.skills[k]);
    return out;
  }
  function tally(list) {
    var t = { total: list.length, checked: 0, byCat: {} }, k, c;
    for (k = 0; k < CATS.length; k++) t.byCat[CATS[k].id] = { total: 0, checked: 0 };
    for (k = 0; k < list.length; k++) {
      c = t.byCat[list[k].category] || (t.byCat[list[k].category] = { total: 0, checked: 0 });
      c.total++;
      if (store.get(list[k].id)) { c.checked++; t.checked++; }
    }
    return t;
  }
  function pct(a, b) { return b > 0 ? Math.round((a / b) * 100) : 0; }

  /* ── radar ──────────────────────────────────────────────────────── */
  /* rows: [{cat, total, taught, checked, checkedAll}]
     scale "total"  — outer ring is every skill in the category (course overview)
     scale "taught" — outer ring is what has been taught so far (session page) */
  function radar(host, rows, scale, titleTxt) {
    clear(host);
    var W = 420, H = 312, cx = 210, cy = 152, R = 102;
    var svg = mk("svg", { viewBox: "0 0 " + W + " " + H, role: "img" });
    var n = rows.length || 1, k, q;
    var lab = [];
    for (k = 0; k < rows.length; k++) {
      lab.push(rows[k].cat.name + ": " + (scale === "taught"
        ? rows[k].checked + " checked of " + rows[k].taught + " taught so far"
        : rows[k].checkedAll + " checked of " + rows[k].total + " in the course, " +
          rows[k].taught + " taught so far"));
    }
    svg.setAttribute("aria-label", (titleTxt ? titleTxt + ". " : "") +
      "Radar chart with one axis per skill category. " + lab.join(". ") + ".");
    function pt(idx, v) {
      var a = -Math.PI / 2 + (2 * Math.PI * idx) / n;
      var r = R * Math.max(0, Math.min(1, v));
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    }
    function poly(vals) {
      var d = [], p;
      for (var i2 = 0; i2 < vals.length; i2++) {
        p = pt(i2, vals[i2]);
        d.push(p[0].toFixed(1) + "," + p[1].toFixed(1));
      }
      return d.join(" ");
    }
    /* grid rings */
    var rings = [0.25, 0.5, 0.75, 1];
    for (k = 0; k < rings.length; k++) {
      var vs = [], last = (k === rings.length - 1);
      for (q = 0; q < n; q++) vs.push(rings[k]);
      var ring = mk("polygon", { points: poly(vs), fill: "none",
        stroke: last ? (scale === "taught" ? "#b9d9eb" : "#333a47") : "#272c36",
        "stroke-width": last ? 1.5 : 1 });
      if (last && scale === "taught") ring.setAttribute("stroke-dasharray", "5 4");
      svg.appendChild(ring);
    }
    for (k = 0; k < n; k++) {
      var e2 = pt(k, 1);
      svg.appendChild(mk("line", { x1: cx, y1: cy, x2: e2[0], y2: e2[1],
        stroke: "#272c36", "stroke-width": 1 }));
    }
    /* the two shapes */
    var vT = [], vC = [], num = [], den = [];
    for (k = 0; k < rows.length; k++) {
      if (scale === "taught") {
        num.push(rows[k].checked); den.push(rows[k].taught);
        vT.push(rows[k].taught > 0 ? 1 : 0);
        vC.push(rows[k].taught > 0 ? rows[k].checked / rows[k].taught : 0);
      } else {
        num.push(rows[k].checkedAll); den.push(rows[k].total);
        vT.push(rows[k].total > 0 ? rows[k].taught / rows[k].total : 0);
        vC.push(rows[k].total > 0 ? rows[k].checkedAll / rows[k].total : 0);
      }
    }
    /* checked first, then the dashed "taught" outline on top, so a small
       taught polygon is never hidden underneath the fill */
    svg.appendChild(mk("polygon", { points: poly(vC), fill: "rgba(46,109,180,.55)",
      stroke: "#7fb2dd", "stroke-width": 1.6 }));
    if (scale !== "taught") {
      svg.appendChild(mk("polygon", { points: poly(vT), fill: "none",
        stroke: "#b9d9eb", "stroke-width": 1.5, "stroke-dasharray": "5 4" }));
    }
    /* vertices + axis labels */
    for (k = 0; k < rows.length; k++) {
      var pc = pt(k, vC[k]);
      svg.appendChild(mk("circle", { cx: pc[0], cy: pc[1], r: 3.4,
        fill: rows[k].cat.color || "#b9d9eb", stroke: "#0f1115", "stroke-width": 1.2 }));
      var ang = -Math.PI / 2 + (2 * Math.PI * k) / n;
      var dx = Math.cos(ang), dy = Math.sin(ang);
      var lx = cx + (R + 22) * dx, ly = cy + (R + 22) * dy;
      var anchor = Math.abs(dx) < 0.25 ? "middle" : (dx > 0 ? "start" : "end");
      if (Math.abs(dy) > 0.9) ly += dy > 0 ? 10 : -8;
      var t1 = stext(lx, ly, shortCat(rows[k].cat.name), null,
        rows[k].cat.color || "#b9d9eb", anchor, 700);
      t1.setAttribute("class", "rl1");
      var t2 = stext(lx, ly + 15, num[k] + "/" + den[k], null, "#9aa0a6", anchor);
      t2.setAttribute("class", "rl2");
      var tt = mk("title", {});
      tt.textContent = rows[k].cat.name + " — " + lab[k];
      t1.appendChild(tt);
      svg.appendChild(t1);
      svg.appendChild(t2);
    }
    host.appendChild(svg);
  }
  function radarRows(taughtList) {
    var all = tally(S.skills), th = tally(taughtList), out = [], k, id, a, t;
    for (k = 0; k < CATS.length; k++) {
      id = CATS[k].id;
      a = all.byCat[id] || { total: 0, checked: 0 };
      t = th.byCat[id] || { total: 0, checked: 0 };
      out.push({ cat: CATS[k], total: a.total, checkedAll: a.checked,
        taught: t.total, checked: t.checked });
    }
    return out;
  }
  function radarKey(host, rows, scale, ringTxt) {
    clear(host);
    var k = el("div", "radarkey"), taught = 0, total = 0, q;
    for (q = 0; q < rows.length; q++) { taught += rows[q].taught; total += rows[q].total; }
    var a = add(k, el("div"));
    add(a, el("i", "fill"));
    add(a, el("span", null, "Skills you have checked"));
    if (scale === "taught") {
      var b = add(k, el("div"));
      add(b, el("i", "dash"));
      add(b, el("span", null, "Outer ring · " + ringTxt + " (" + taught + " skills)"));
    } else {
      var c = add(k, el("div"));
      add(c, el("i", "dash"));
      add(c, el("span", null, ringTxt + " (" + taught + " of " + total + " skills)"));
      var d = add(k, el("div"));
      add(d, el("i", null));
      add(d, el("span", null, "Outer ring · every skill in that category"));
    }
    host.appendChild(k);
    return k;
  }

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
  function dots(depth) {
    var names = ["", "aware of it", "can use it", "can design with it"];
    var d = el("span", "dots"), k, b;
    var lvl = Math.max(1, Math.min(3, Number(depth) || 1));
    for (k = 1; k <= 3; k++) { b = add(d, el("b", k <= lvl ? "on" : null)); }
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

  /* ── skill card (session page) ──────────────────────────────────── */
  function skillCard(skill, sessionN, onToggle) {
    var card = el("div", "sk");
    var cat = catOf(skill.category);
    card.style.borderLeftColor = cat.color || "#333a47";
    var cb = el("input");
    cb.type = "checkbox";
    cb.id = "cb-" + skill.id;
    cb.checked = store.get(skill.id);
    cb.setAttribute("aria-label", "I can do this: " + skill.name);
    if (cb.checked) card.className = "sk done";
    cb.addEventListener("change", function () {
      store.set(skill.id, cb.checked);
      card.className = cb.checked ? "sk done" : "sk";
      if (onToggle) onToggle();
    });
    card.appendChild(cb);
    var bd = add(card, el("div", "bd"));
    var hd = add(bd, el("div", "hd"));
    var lab = add(hd, el("label", "nm", skill.name));
    lab.setAttribute("for", cb.id);
    if (skill.interview) add(hd, el("span", "pill iv", "interview"));
    if (sessionN !== undefined && skill.introduced === sessionN) add(hd, el("span", "pill new", "new this week"));
    else if (sessionN !== undefined) add(hd, el("span", "pill", "practised again"));
    add(bd, el("div", "can", skill.can));
    var ft = add(bd, el("div", "ft"));
    ft.appendChild(dots(skill.depth));
    var seen = [];
    if (skill.introduced) seen.push(skill.introduced);
    if (Array.isArray(skill.practised)) {
      for (var k = 0; k < skill.practised.length; k++) {
        if (seen.indexOf(skill.practised[k]) < 0) seen.push(skill.practised[k]);
      }
    }
    seen.sort(function (a, b) { return a - b; });
    add(ft, el("span", "pill", "sessions " + seen.join(", ")));
    bd.appendChild(chipsFor(skill));
    card.__cb = cb;
    return card;
  }

  /* ═══════════════ PAGE: index ═════════════════════════════════════ */
  function renderIndex() {
    document.title = S.course.code + " · Skills Dashboard";
    buildNav([{ label: "Skills dashboard" }], { label: "All skills →", href: "skills.html" });
    buildFooter();

    /* header */
    $("hKicker").textContent = S.course.institution + " · " + S.course.term +
      " · " + SESS.length + " sessions";
    $("hCode").textContent = S.course.code;
    $("hTitle").textContent = S.course.title;

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
    hlink("CourseWorks", "Course site", S.course.sessions_url);
    hlink("GitHub", "Starter repository", S.course.starter_url);
    hlink("Companion", "Interactive course companion", S.course.companion_url);

    function refresh() {
      var all = tally(S.skills);
      var taught = taughtThrough(TAUGHT_N);
      var tt = tally(taught);

      /* stats */
      $("stChecked").textContent = all.checked + " / " + all.total;
      $("stPct").textContent = pct(all.checked, all.total) + "%";
      $("stTaught").textContent = tt.checked + " / " + tt.total;
      $("stSession").textContent = TAUGHT_N > 0 ? "Session " + TAUGHT_N : "Not started";
      var ivT = 0, ivC = 0, k;
      for (k = 0; k < S.skills.length; k++) {
        if (S.skills[k].interview) { ivT++; if (store.get(S.skills[k].id)) ivC++; }
      }
      $("stInterview").textContent = ivC + " / " + ivT;
      $("barAll").style.width = pct(all.checked, all.total) + "%";
      $("barTxt").textContent = pct(all.checked, all.total) + "% of all " + all.total +
        " skills in the course · " + tt.checked + " of the " + tt.total +
        " taught so far (" + pct(tt.checked, tt.total) + "%)";

      /* radar */
      var rows = radarRows(taught);
      radar($("radar"), rows, "total", "Skills checked against skills taught so far");
      radarKey($("radarKey"), rows, "total",
        "Skills taught so far, through session " + (TAUGHT_N || 0));

      /* category legend */
      var cs = $("cats");
      clear(cs);
      for (k = 0; k < CATS.length; k++) {
        var c = CATS[k], cc = all.byCat[c.id] || { total: 0, checked: 0 };
        var tc = tt.byCat[c.id] || { total: 0, checked: 0 };
        var card = add(cs, el("div", "catcard"));
        card.style.borderLeftColor = c.color || "#333a47";
        add(card, el("div", "cn", c.name));
        add(card, el("div", "cc", cc.checked + " checked · " + tc.total + " taught · " +
          cc.total + " total"));
        var bar = add(card, el("div", "bar thin"));
        add(bar, el("i")).style.width = pct(cc.checked, cc.total) + "%";
      }

      /* session grid */
      var g = $("sessions");
      clear(g);
      for (k = 0; k < SESS.length; k++) {
        var s = SESS[k], list = skillsOf(s), t = tally(list);
        var a = add(g, el("a", "sx" + (s.n > TAUGHT_N ? " future" : "")));
        a.href = "session-" + s.n + ".html";
        var top = add(a, el("div", "top"));
        add(top, el("span", "n", "Session " + s.n));
        add(top, el("span", "dt", fmtDate(s.date)));
        add(a, el("div", "ti", s.title));
        var meta = add(a, el("div", "meta"));
        meta.textContent = list.length + " skill" + (list.length === 1 ? "" : "s");
        var nnew = 0;
        for (var q = 0; q < list.length; q++) if (list[q].introduced === s.n) nnew++;
        if (nnew) meta.textContent += " · " + nnew + " new";
        if (s.exam) {
          meta.appendChild(document.createTextNode(" · "));
          add(meta, el("span", "pill warn", String(s.exam)));
        }
        var bar = add(a, el("div", "bar"));
        add(bar, el("i")).style.width = pct(t.checked, t.total) + "%";
        var pr = add(a, el("div", "prog"));
        add(pr, el("span", null, t.checked + " / " + t.total + " checked"));
        add(pr, el("span", null, pct(t.checked, t.total) + "%"));
        add(a, el("div", "go", "Open checklist"));
      }
    }

    refresh();

    $("btnReset").addEventListener("click", function () {
      if (window.confirm("Clear every skill you have checked on this device? This cannot be undone.")) {
        store.reset();
        refresh();
      }
    });
    if (!store.available()) {
      $("lsWarn").hidden = false;
    }
    window.addEventListener("storage", function (ev) {
      if (!ev.key || ev.key.indexOf(PREFIX) === 0) refresh();
    });
  }

  /* ═══════════════ PAGE: session ═══════════════════════════════════ */
  function sessionNumber() {
    var n = null;
    if (window.HFT_SESSION !== undefined && window.HFT_SESSION !== null) n = window.HFT_SESSION;
    var q = String(window.location.search || "");
    var m = /[?&]n=([^&#]*)/.exec(q);
    if (m) n = decodeURIComponent(m[1]);
    var v = parseInt(n, 10);
    if (!isFinite(v) || String(v) !== String(n).trim() || !sessByN[v]) return null;
    return v;
  }

  function renderSession() {
    var n = sessionNumber();
    if (n === null) { window.location.replace("index.html"); return; }
    var s = sessByN[n];
    var list = skillsOf(s);

    document.title = "Session " + n + " · " + s.title + " — " + S.course.code + " skills";
    var crumbs = [];
    if (sessByN[n - 1]) crumbs.push({ label: "← Session " + (n - 1), href: "session-" + (n - 1) + ".html" });
    crumbs.push({ label: "Session " + n + " · " + s.title });
    if (sessByN[n + 1]) crumbs.push({ label: "Session " + (n + 1) + " →", href: "session-" + (n + 1) + ".html" });
    buildNav(crumbs, { label: "All skills →", href: "skills.html" });
    buildFooter();

    $("hKicker").textContent = "Session " + n + " of " + SESS.length + " · " + fmtDate(s.date) +
      " · " + S.course.code;
    $("hTitle").textContent = s.title;
    var badges = $("hBadges");
    clear(badges);
    if (s.exam) add(badges, el("span", "pill warn", String(s.exam) + " exam in this session"));
    var nnew = 0, k;
    for (k = 0; k < list.length; k++) if (list[k].introduced === n) nnew++;
    add(badges, el("span", "pill acc", list.length + " skills · " + nnew + " new this week"));

    /* links */
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
      box("Deck (on CourseWorks)", "Deck " + String(decks[k]).toUpperCase(), null, null);
    }
    if (s.lab) box("Lab", s.lab.label || "Lab", s.lab.url, s.lab.due);
    if (s.hw) box("Homework", s.hw.label || "Homework", s.hw.url, s.hw.due);
    if (s.project) box("Project", s.project.label || "Project", s.project.url, s.project.due);
    if (s.companion_url) box("Companion", "Interactive page for this session", s.companion_url, null);

    var hosts = {};
    function refresh() {
      var t = tally(list);
      $("stHere").textContent = t.checked + " / " + t.total;
      $("stHerePct").textContent = pct(t.checked, t.total) + "%";
      var cum = taughtThrough(n), ct = tally(cum);
      $("stCum").textContent = ct.checked + " / " + ct.total;
      var ivT = 0, ivC = 0, q;
      for (q = 0; q < list.length; q++) {
        if (list[q].interview) { ivT++; if (store.get(list[q].id)) ivC++; }
      }
      $("stIv").textContent = ivC + " / " + ivT;
      $("barHere").style.width = pct(t.checked, t.total) + "%";
      var rows = radarRows(cum);
      radar($("radar"), rows, "taught",
        "Skills checked among the skills taught in sessions 1 to " + n);
      radarKey($("radarKey"), rows, "taught", "everything taught through session " + n);
      /* keep any checkboxes in sync */
      for (q = 0; q < list.length; q++) {
        var cb = $("cb-" + list[q].id);
        if (cb) {
          cb.checked = store.get(list[q].id);
          var card = cb.parentNode;
          if (card) card.className = cb.checked ? "sk done" : "sk";
        }
      }
    }

    /* skills grouped by category, categories in SKILLS.categories order */
    var host = $("skills");
    clear(host);
    for (k = 0; k < CATS.length; k++) {
      var c = CATS[k], mine = [], q;
      for (q = 0; q < list.length; q++) if (list[q].category === c.id) mine.push(list[q]);
      if (!mine.length) continue;
      var block = add(host, el("section", "catblock"));
      block.style.borderTop = "none";
      block.style.padding = "0";
      block.style.maxWidth = "none";
      var bar = add(block, el("div", "catbar"));
      var an = add(bar, el("div", "an", c.name));
      an.style.color = c.color || "#b9d9eb";
      add(bar, el("div", "ad", mine.length + " skill" + (mine.length === 1 ? "" : "s")));
      var wrap = add(block, el("div", "skills"));
      for (q = 0; q < mine.length; q++) wrap.appendChild(skillCard(mine[q], n, refresh));
    }
    if (!list.length) add(host, el("p", "empty", "No skills are listed for this session yet."));

    refresh();

    $("btnAll").addEventListener("click", function () {
      for (var q = 0; q < list.length; q++) store.set(list[q].id, true);
      refresh();
    });
    $("btnNone").addEventListener("click", function () {
      for (var q = 0; q < list.length; q++) store.set(list[q].id, false);
      refresh();
    });
    $("btnPrint").addEventListener("click", function () { window.print(); });

    /* prev / next */
    var pn = $("pn");
    clear(pn);
    function nav(dir, m) {
      if (!sessByN[m]) return;
      var a = add(pn, el("a", "pncard"));
      a.href = "session-" + m + ".html";
      add(a, el("div", "nl", dir === -1 ? "← Previous session" : "Next session →"));
      add(a, el("div", "nt", "Session " + m + " · " + sessByN[m].title));
      add(a, el("div", "sub", fmtDate(sessByN[m].date)));
    }
    nav(-1, n - 1);
    nav(1, n + 1);
    if (!pn.firstChild) {
      var a = add(pn, el("a", "pncard"));
      a.href = "index.html";
      add(a, el("div", "nl", "Back"));
      add(a, el("div", "nt", "Course overview"));
    }
    window.addEventListener("storage", function (ev) {
      if (!ev.key || ev.key.indexOf(PREFIX) === 0) refresh();
    });
  }

  /* ═══════════════ PAGE: catalogue ═════════════════════════════════ */
  function renderCatalogue() {
    document.title = "All skills · " + S.course.code;
    buildNav([{ label: "All skills" }], { label: "← Course overview", href: "index.html" });
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
      if (sk.introduced) seen.push(sk.introduced);
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
