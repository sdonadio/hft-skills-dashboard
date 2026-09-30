/* Progress dashboard — IEOR E4741 High-Frequency Trading in C++, Fall 2026.
   Vanilla JS, no build, no CDN. Everything date-dependent is computed from "now"
   (Eastern Time) against the hard-coded schedule below, so the page keeps working
   after tonight. Skills/concepts are read from skills.js / focus.js at load time.
   The student checklist is READ from localStorage ("hft-skills:<skill id>" === "1")
   and never written. Test hook: progress.html?now=2026-09-30T18:00 (ET wall clock). */
(function () {
  "use strict";

  var COMPANION = "https://sdonadio.github.io/low-latency-trading-arena/";
  var S = window.SKILLS || { sessions: [], skills: [], categories: [], course: {} };
  var F = window.FOCUS || { sessions: [] };
  var START_MIN = 19 * 60 + 10, END_MIN = 22 * 60 + 10;   /* 7:10 - 10:10 pm ET */

  /* ── the 13-session schedule (hard-coded, ET) ─────────────────────────── */
  var SCHED = [
    { n: 1, d: "2026-09-09", s: "Landscape", t: "HFT landscape & market microstructure" },
    { n: 2, d: "2026-09-16", s: "C++ perf", t: "C++ performance foundations (pointers, references, the cost of a copy)" },
    { n: 3, d: "2026-09-23", s: "Memory & RAII", t: "Memory management, classes/RAII & smart pointers" },
    { n: 4, d: "2026-09-30", s: "Allocators", t: "Custom allocators & memory pools + runtime polymorphism" },
    { n: 5, d: "2026-10-07", s: "Templates", t: "Templates & generic programming + compile-time, policy-based design & CRTP" },
    { n: 6, d: "2026-10-14", s: "Order book", t: "The order book" },
    { n: 7, d: "2026-10-21", s: "Complexity", t: "Complexity & time-series" },
    { n: 8, d: "2026-10-28", s: "Midterm + atomics", t: "Midterm + Concurrency I (atomics & memory models)", tag: "Midterm" },
    { n: 9, d: "2026-11-04", s: "Lock-free", t: "Lock-free pipelines" },
    { n: 10, d: "2026-11-11", s: "Network & I/O", t: "Network protocols & market data + async I/O & serialization" },
    { n: 11, d: "2026-11-18", s: "SIMD & colo", t: "SIMD, kernel bypass & colocation" },
    { n: 12, d: "2026-12-02", s: "Profiling", t: "Profiling, the tail & production" },
    { n: 13, d: "2026-12-09", s: "Tournament", t: "Latency arbitrage, multi-venue & the tournament", tag: "Final" }
  ];
  var MIDTERM = "2026-10-28", FINAL_START = "2026-12-17", FINAL_END = "2026-12-23";

  /* ── recap content for finished sessions, from the decks + speaker guides ─ */
  var DETAIL = {
    1: {
      focus: "Learn the game before you optimise it: a limit order book, and one number that grades you.",
      ideas: [
        "HFT is speed in service of a decision: a race, not a forecast",
        "The latency arms race (colocation, microwave, custom hardware): know which microseconds are yours to win",
        "The CLOB is two sorted sides; price-time priority; a trade prints at the resting order's price",
        "Orders, fills & fees: taker fee and maker rebate can outweigh the whole spread",
        "Tail latency is the grade: p50 / p99 / p99.9 tick-to-trade",
        "AlgoArena: your C++ bot is just another client, and on_book is the hot path"
      ],
      nums: [
        ["2 bps", "a 2-cent spread on a $100 name"],
        ["$15 / $10 / $2", "taker fee, maker rebate, and the entire spread on 100 shares at $100"],
        ["38 → 210 µs", "example p50 vs p99.9 (max 5.2 ms): the average lies"],
        ["200 ms vs 20 ms", "default vs colocated outbound delay: a 10x you can buy, not code"]
      ],
      built: [
        "Cloned and built the arena C++ client, registered, connected, and landed on the LATENCY board",
        "Ran make test: almost everything red on purpose, the map of the term",
        "Hand-computed mid, spread, microprice and OBI from a snapshot (100.01, 0.02, 100.016, +0.60)"
      ],
      hw: "HW 1: Order-book metrics in C++ (due Thu Oct 1)"
    },
    2: {
      focus: "Addresses, layout and measurement: the first place microseconds hide.",
      ideas: [
        "Memory hierarchy: the CPU is fast, memory is far; a miss to RAM is about 100 ns",
        "Stack vs heap, pointers vs references, and pointer arithmetic (p + 1 is one element)",
        "malloc / calloc / new / delete, and a matrix as one contiguous block",
        "Data layout is a latency decision: AoS vs SoA, the 64-byte cache line, false sharing",
        "Branch prediction and the pipeline",
        "Benchmark honestly: warm up, release build, percentiles, and beware micro-benchmark traps"
      ],
      nums: [
        ["9.3 / 26.9 / 66.8 µs", "p50 / p99 / p99.9 of the do-nothing echo bot: the floor"],
        ["53x", "heap new/delete 12.33 ns vs stack 0.23 ns (1.2x if you sink it wrong)"],
        ["11.4x", "one million ints: vector scan 66,875 ns vs linked list 764,114 ns"],
        ["3.8x", "false sharing: 306.1 ms vs 81.1 ms with alignas(64)"]
      ],
      built: [
        "A steady_clock micro-benchmark with warm-up, the same shape as the autograder's bench.hpp",
        "Stack vs heap, and the sink that makes it honest",
        "Cache-friendly scan vs pointer-chasing, and alignas(64) erasing false sharing",
        "Read a metric out of report.json"
      ],
      hw: "HW 2: Pointers, references & the cost of a copy (due Thu Oct 1)"
    },
    3: {
      focus: "Who owns this object, and when does it die? Make the answer a compile-time contract.",
      ideas: [
        "Manual new/delete: the classic four bugs, plus fragmentation and non-deterministic timing",
        "A class is data plus the functions that keep it valid: constructors, destructors, const, encapsulation",
        "Copy vs move semantics, the Rule of Zero and Rule of Five (noexcept matters)",
        "RAII: acquire in the constructor, release in the destructor",
        "unique_ptr by default, shared_ptr only when you mean it, weak_ptr to break cycles",
        "Ownership as an API contract, and no allocation on the hot path"
      ],
      nums: [
        ["0.49 ns", "unique_ptr get(): the same as a raw pointer; sizeof equals sizeof(T*)"],
        ["3.31 ns", "copying a shared_ptr, about 7x a unique deref: the atomic refcount tax"],
        ["40 → 32 bytes", "the same five Order fields, members reordered widest first"],
        ["20 ns vs 20 µs", "the same new call on two different ticks: unschedulable"]
      ],
      built: [
        "Found a raw new/delete leak with the right tool for your OS",
        "Converted a leaky raw pointer to unique_ptr, and wrote the Rule of Three/Five by hand once",
        "Wrote a small RAII guard (a ScopedTimer) and measured the shared_ptr refcount tax",
        "Showed why on_book must never allocate"
      ],
      hw: "HW 3: Dynamic allocation, RAII & smart pointers (due Sat Oct 3)"
    }
  };

  /* ── agenda cards (hard-coded for sessions 4 and 5, the re-arranged ones) ─ */
  var AGENDA = {
    4: {
      title: "Custom allocators & memory pools + runtime polymorphism",
      items: [
        ["Allocators & memory pools", "Why malloc's slow path is unschedulable; a free-list object pool and a bump/arena allocator; alloc() returns nullptr at capacity."],
        ["std::pmr", "Polymorphic memory resources: monotonic_buffer_resource and pmr containers on a buffer you own."],
        ["Runtime polymorphism", "Inheritance, virtual, the vtable, and what a virtual call costs on the hot path."],
        ["Lab: build the pool + pooled polymorphic strategies", "Implement the pool, measure it against new/delete (about 0.56 ns vs 12–18 ns per op on the instructor's laptop), then pool your strategy objects."]
      ],
      hw: "HW 4: A high-performance allocator + runtime polymorphism (due Sat Oct 10)",
      recap: "Last week: who owns memory. Tonight: stop asking the heap for it."
    },
    5: {
      title: "Templates & generic programming + compile-time, policy-based design & CRTP",
      items: [
        ["Templates & generic programming", "Function and class templates, and the STL you will use all term."],
        ["Compile-time computation", "constexpr and compile-time evaluation: do the work before the market opens."],
        ["Policy-based design & CRTP", "Polymorphism without the vtable: static dispatch that the compiler can inline."],
        ["Lab", "Generic, zero-overhead building blocks for the Phase 1 hot path."]
      ],
      hw: "HW 5 and HW 6 (due Sat Oct 17)",
      recap: "Polymorphism without the vtable."
    }
  };

  var LAYERS = [
    { r: [1, 1], t: "Market microstructure", f: "You know what you are trading: the book, the queue, the fees, and that p99.9 tick-to-trade is the grade." },
    { r: [2, 2], t: "C++ performance foundations", f: "You know where the microseconds go (cache, layout, branches) and how to measure them honestly." },
    { r: [3, 3], t: "Memory & ownership", f: "RAII and smart pointers make lifetimes a contract; the hot path learns to allocate nothing." },
    { r: [4, 4], t: "Allocators + runtime polymorphism", f: "Pre-allocated pools replace the heap; virtual dispatch is understood and priced." },
    { r: [5, 5], t: "Templates, compile-time & CRTP", f: "Static dispatch and compile-time work: abstraction with no vtable and no runtime cost." },
    { r: [6, 7], t: "Order book & complexity", f: "A cache-friendly local book and the right data structure per operation." },
    { r: [8, 9], t: "Concurrency & lock-free", f: "Atomics, memory models and SPSC rings: threads without locks." },
    { r: [10, 11], t: "Network, SIMD & kernel bypass", f: "Wire formats, async I/O, vectorisation and colocation: the last microseconds." },
    { r: [12, 13], t: "Profiling, the tail & the tournament", f: "Find and kill the tail; race other venues and other teams." }
  ];

  var PHASES = [
    ["Connect & Baseline", "Connect the client, react in on_book, place and cancel; record your honest p50 / p99 / p99.9."],
    ["The Fast Hot Path", "No allocation between the book arriving and the order leaving; a compile-time codec."],
    ["The Local Order Book", "A cache-friendly local book that tracks queue_ahead."],
    ["Threading to Accelerate", "A threaded pipeline with your own SPSC ring, checked by ThreadSanitizer."],
    ["Multi-Process System", "Gateway and strategy processes joined by shared-memory lock-free IPC."],
    ["Wire & Hardware Tuning", "SIMD, prefetch, LTO and the colocation trade-off."],
    ["Profile & Kill the Tail", "Profile the run and cut p99.9 measurably."],
    ["The Tournament", "A real strategy in the tournament scenario, scored on latency, queue, fill and markout."]
  ];

  /* deliverables (ET, due 11:59 pm the given day unless "at" is set) */
  var DELIV = [
    { d: "2026-09-08", t: "Welcome Survey", k: "Survey" },
    { d: "2026-09-23", t: "Project Phase 0: Connect & Baseline", k: "Project" },
    { d: "2026-09-27", t: "Participation Quiz 2: heap matrix & matrix multiply", k: "Quiz" },
    { d: "2026-10-01", t: "HW 1: Order-book metrics in C++", k: "Homework" },
    { d: "2026-10-01", t: "HW 2: Pointers, references & the cost of a copy", k: "Homework" },
    { d: "2026-10-03", t: "HW 3: Dynamic allocation, RAII & smart pointers", k: "Homework" },
    { d: "2026-10-10", t: "HW 4: A high-performance allocator + runtime polymorphism", k: "Homework" },
    { d: "2026-10-14", t: "Project Phase 1: The Fast Hot Path", k: "Project" },
    { d: "2026-10-17", t: "HW 5: Generic programming with the STL", k: "Homework" },
    { d: "2026-10-17", t: "HW 6: CRTP & compile-time computation", k: "Homework" },
    { d: "2026-10-24", t: "HW 7: Fast order book + symbol map", k: "Homework" },
    { d: "2026-10-28", t: "Midterm (in class; covers sessions 1–7)", k: "Exam", cls: true }
  ];

  /* ── tiny DOM helpers ─────────────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }
  function add(p, c) { p.appendChild(c); return c; }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function link(cls, text, href, ext) {
    var a = el("a", cls, text); a.href = href;
    if (ext) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
    return a;
  }

  /* ── time: everything in America/New_York ─────────────────────────────── */
  function dayNum(ymd) {
    var p = ymd.split("-");
    return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000);
  }
  function etNow() {
    var q = /[?&]now=(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}))?/.exec(location.search);
    if (q) return { ymd: q[1], min: (+q[2] || 0) * 60 + (+q[3] || 0) };
    var parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date());
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    return { ymd: o.year + "-" + o.month + "-" + o.day, min: (+o.hour) * 60 + (+o.minute) };
  }
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  function fmt(ymd, withDow) {
    var p = ymd.split("-"), dt = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    return (withDow ? DOW[dt.getUTCDay()] + " " : "") + MON[+p[1] - 1] + " " + (+p[2]);
  }
  function plural(n, w) { return n + " " + w + (n === 1 ? "" : "s"); }
  function rel(diff) {
    if (diff === 0) return "today";
    if (diff === 1) return "tomorrow";
    if (diff === -1) return "yesterday";
    return diff > 0 ? "in " + plural(diff, "day") : plural(-diff, "day") + " ago";
  }

  var NOW = etNow(), TD = dayNum(NOW.ymd);

  function stateOf(s) {
    var dd = dayNum(s.d);
    if (dd < TD) return "done";
    if (dd === TD) {
      if (NOW.min >= END_MIN) return "done";
      return NOW.min >= START_MIN ? "live" : "tonight";
    }
    return "future";
  }
  var i, doneCount = 0, cur = null;
  SCHED.forEach(function (s) { s.st = stateOf(s); });
  for (i = 0; i < SCHED.length; i++) {
    if (SCHED[i].st === "done") doneCount++;
    else if (!cur) { cur = SCHED[i]; if (cur.st === "future") cur.st = "next"; }
  }
  var NEXT = cur ? SCHED[SCHED.indexOf(cur) + 1] || null : null;
  function isCur(s) { return cur && s.n === cur.n; }

  /* ── data from skills.js / focus.js ───────────────────────────────────── */
  var sessBy = {}, skillBy = {}, focusBy = {};
  (S.sessions || []).forEach(function (x) { sessBy[x.n] = x; });
  (S.skills || []).forEach(function (x) { skillBy[x.id] = x; });
  (F.sessions || []).forEach(function (x) { focusBy[x.n] = x; });
  function skillsOfSession(n) { return (sessBy[n] && sessBy[n].skills) || []; }

  var covered = {};          /* skill id -> true for every skill in a finished session */
  var added = {};            /* skills the current session adds */
  SCHED.forEach(function (s) {
    if (s.st === "done") skillsOfSession(s.n).forEach(function (id) { covered[id] = true; });
  });
  if (cur) skillsOfSession(cur.n).forEach(function (id) { if (!covered[id]) added[id] = true; });

  /* read-only checklist */
  var PREFIX = ((S.course && S.course.storage_prefix) || "hft-skills") + ":";
  var ticked = {}, anyTick = false, lsOK = true;
  try {
    for (i = 0; i < window.localStorage.length; i++) {
      var k = window.localStorage.key(i);
      if (k && k.indexOf(PREFIX) === 0 && window.localStorage.getItem(k) === "1") {
        ticked[k.slice(PREFIX.length)] = true; anyTick = true;
      }
    }
  } catch (e) { lsOK = false; }

  function weeksOf(n) {
    var d = (sessBy[n] && sessBy[n].decks) || [], out = [];
    d.forEach(function (x) { var w = parseInt(String(x).replace(/\D/g, ""), 10); if (w) out.push(w); });
    return out.length ? out : (n <= 4 ? [n] : []);
  }

  /* ── 1 · hero ─────────────────────────────────────────────────────────── */
  function renderHero() {
    var h = $("heroH"), sub = $("heroSub");
    clear(h);
    if (cur) {
      add(h, document.createTextNode("Where we are — "));
      add(h, el("em", null, "Session " + cur.n + " of 13"));
      var when = cur.st === "live" ? "In session now" : cur.st === "tonight" ? "Tonight" : "Next class";
      clear(sub);
      add(sub, el("b", null, when + ": "));
      sub.appendChild(document.createTextNode(fmt(cur.d, true) + ", 7:10–10:10 pm ET — " + cur.t + ". " +
        plural(doneCount, "session") + " done."));
    } else {
      add(h, document.createTextNode("Where we are — "));
      add(h, el("em", null, "all 13 sessions taught"));
      sub.textContent = "Class is finished. Final exam window: " + fmt(FINAL_START) + "–" + fmt(FINAL_END) + ".";
    }

    var seg = $("seg"); clear(seg);
    SCHED.forEach(function (s) {
      var a = link(s.st === "done" ? "done" : isCur(s) ? "cur" : "", String(s.n), "#j" + s.n);
      a.setAttribute("role", "listitem");
      a.title = "Session " + s.n + " · " + fmt(s.d) + " · " + s.t;
      a.setAttribute("aria-label", "Session " + s.n + ": " + (s.st === "done" ? "done" : isCur(s) ? "current" : "upcoming"));
      a.addEventListener("click", function (ev) { ev.preventDefault(); select(s.n, true); });
      add(seg, a);
    });
    $("segL").textContent = doneCount + " / 13 done";
    $("segR").textContent = cur ? "session " + cur.n + " highlighted" : "complete";

    var tiles = $("tiles"); clear(tiles);
    function tile(label, val, unit, subt, hot) {
      var t = add(tiles, el("div", "tile" + (hot ? " hot" : "")));
      add(t, el("div", "tl1", label));
      var v = add(t, el("div", "tv", val));
      if (unit) add(v, el("small", null, unit));
      if (subt) add(t, el("div", "ts", subt));
    }
    tile("Sessions done", String(doneCount), "/ 13", cur ? "Session " + cur.n + " is " + (cur.st === "live" ? "underway" : cur.st === "tonight" ? "tonight" : "next") : "term complete");
    var totalSk = (S.skills || []).length, covN = Object.keys(covered).length;
    tile("Skills covered", String(covN), "/ " + totalSk, "sessions 1–" + doneCount);
    var dm = dayNum(MIDTERM) - TD, df = dayNum(FINAL_START) - TD;
    tile("Midterm", dm >= 0 ? String(dm) : "done", dm >= 0 ? "days" : "", fmt(MIDTERM, true) + ", in class", dm >= 0 && dm <= 7);
    tile("Final exam", df >= 0 ? String(df) : (dayNum(FINAL_END) - TD >= 0 ? "open" : "done"), df >= 0 ? "days" : "", "window " + fmt(FINAL_START) + "–" + fmt(FINAL_END));
    var nx = nextDeliverable();
    if (nx) {
      var dd = dayNum(nx.d) - TD;
      tile("Next due", dd === 0 ? "today" : dd === 1 ? "tomorrow" : fmt(nx.d), "", nx.t, dd <= 2);
    }
  }
  function nextDeliverable() {
    for (var j = 0; j < DELIV.length; j++) if (dayNum(DELIV[j].d) >= TD) return DELIV[j];
    return null;
  }

  /* ── 2 · journey ──────────────────────────────────────────────────────── */
  var selected = null;
  function renderJourney() {
    var jr = $("jr"); clear(jr);
    SCHED.forEach(function (s) {
      var cls = s.st === "done" ? "done" : isCur(s) ? "cur" : "";
      var li = add(jr, el("li", cls));
      li.id = "j" + s.n;
      var b = add(li, el("button", "node " + cls));
      b.type = "button";
      b.dataset.n = s.n;
      b.setAttribute("aria-label", "Session " + s.n + ", " + fmt(s.d) + ": " + s.t + ". " +
        (s.st === "done" ? "Done." : isCur(s) ? "Current session." : "Upcoming."));
      add(b, el("span", "dot", String(s.n)));
      add(b, el("span", "nl", s.s));
      add(b, el("span", "nd", fmt(s.d)));
      if (s.tag) add(b, el("span", "tag", s.tag));
      b.addEventListener("click", function () { select(s.n, false); });
    });
  }
  function select(n, scroll) {
    selected = n;
    var btns = document.querySelectorAll(".node");
    Array.prototype.forEach.call(btns, function (b) {
      var on = +b.dataset.n === n;
      b.classList.toggle("sel", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    renderDetail(n);
    if (scroll) { var j = $("journey"); if (j && j.scrollIntoView) j.scrollIntoView({ behavior: "smooth", block: "start" }); }
  }
  function sessionLinks(box, n) {
    weeksOf(n).forEach(function (w) {
      add(box, link(null, "Companion: week " + w + " page", COMPANION + "week" + w + ".html", true));
    });
    add(box, link(null, "Skills checklist: session " + n, "session-" + n + ".html"));
  }
  function renderDetail(n) {
    var box = $("detail"); clear(box);
    var s = SCHED[n - 1], f = focusBy[n], D = DETAIL[n], A = AGENDA[n];
    var head = add(box, el("div", "dh"));
    var stTxt = s.st === "done" ? "Done" : s.st === "live" ? "In session now" : s.st === "tonight" ? "Tonight" : isCur(s) ? "Next" : "Upcoming";
    add(head, el("span", "dn", "Session " + n + " · " + fmt(s.d, true) + " · " + stTxt));
    add(box, el("h3", "big", s.t));

    if (s.st === "done" && D) {
      add(box, el("p", "lead", D.focus));
      var g = add(box, el("div", "dgrid"));
      var L = add(g, el("div")), R = add(g, el("div"));
      add(L, el("h3", null, "Key ideas"));
      var ul = add(L, el("ul", "ideas"));
      D.ideas.forEach(function (x) { add(ul, el("li", null, x)); });
      var b1 = add(R, el("div", "dblock"));
      add(b1, el("h3", null, "Numbers we measured or were given"));
      var ns = add(b1, el("div", "nums"));
      D.nums.forEach(function (x) { var c = add(ns, el("div", "num")); add(c, el("b", null, x[0])); add(c, el("span", null, x[1])); });
      var b2 = add(R, el("div", "dblock"));
      add(b2, el("h3", null, "What you built in the lab"));
      var u2 = add(b2, el("ul", "ideas"));
      D.built.forEach(function (x) { add(u2, el("li", null, x)); });
      var b3 = add(R, el("div", "dblock"));
      add(b3, el("h3", null, "Homework"));
      add(b3, el("p", null, D.hw));
    } else if (s.st === "done") {
      /* a later session that has now finished: fall back to the focus data */
      add(box, el("p", "lead", (f && f.tagline) || (f && f.focus) || s.t));
      var g2 = add(box, el("div", "dgrid"));
      var L2 = add(g2, el("div")), R2 = add(g2, el("div"));
      add(L2, el("h3", null, "Key ideas"));
      var u3 = add(L2, el("ul", "ideas"));
      ((f && f.concepts) || []).forEach(function (c) { add(u3, el("li", null, c.title)); });
      add(R2, el("h3", null, "Homework"));
      var hw = sessBy[n] && sessBy[n].hw;
      add(R2, el("p", null, hw ? hw.label : "See Canvas."));
    } else {
      /* current or upcoming: agenda preview */
      var pv = A ? A.recap : (f && f.tagline) || "";
      if (pv) add(box, el("p", "lead", pv));
      var g3 = add(box, el("div", "dgrid"));
      var L3 = add(g3, el("div")), R3 = add(g3, el("div"));
      add(L3, el("h3", null, A ? "Agenda" : "Key ideas to come"));
      var u4 = add(L3, el("ul", "ideas"));
      if (A) A.items.forEach(function (x) { add(u4, el("li", null, x[0])); });
      else ((f && f.concepts) || []).forEach(function (c) { add(u4, el("li", null, c.title)); });
      add(R3, el("h3", null, "Homework"));
      var hw2 = A ? A.hw : (sessBy[n] && sessBy[n].hw ? sessBy[n].hw.label : "See Canvas.");
      add(R3, el("p", null, hw2));
      add(R3, el("p", "sub", s.st === "future" || s.st === "next" ? "This session has not happened yet; its recap appears here once it is done." : "Recap appears here after class."));
    }
    var lk = add(box, el("div", "dlinks"));
    sessionLinks(lk, n);
  }

  /* ── 3 · stack ────────────────────────────────────────────────────────── */
  function renderStack() {
    var v = $("stackv"); clear(v);
    LAYERS.forEach(function (L) {
      var lo = L.r[0], hi = L.r[1], st;
      var allDone = SCHED[hi - 1].st === "done";
      var hasCur = cur && cur.n >= lo && cur.n <= hi;
      st = allDone ? "built" : hasCur ? "now" : "ahead";
      var d = add(v, el("div", "layer " + st));
      add(d, el("div", "ls", (lo === hi ? "Session " + lo : "Sessions " + lo + "–" + hi) +
        (st === "built" ? " ✓" : st === "now" ? (cur.st === "live" ? " · now" : " · next") : "")));
      add(d, el("div", "lt", L.t));
      add(d, el("div", "lf", L.f));
    });
    var cap = add(v, el("div", "hotcap"));
    add(cap, el("span", null, "The hot path: tick → on_book → order"));
    add(cap, el("span", "fl", "parse → decide → serialize → send  ·  graded on p99.9"));
  }

  /* ── 4 · skills ───────────────────────────────────────────────────────── */
  function renderSkills() {
    var all = S.skills || [], cats = S.categories || [];
    var covN = Object.keys(covered).length, addN = Object.keys(added).length;
    $("skLead").textContent = covN + " of " + all.length + " skills covered in sessions 1–" + doneCount +
      (cur && addN ? "; " + (cur.st === "live" ? "this session" : "the next session") + " adds " + addN + " more." : ".");
    var box = $("cats"); clear(box);
    cats.forEach(function (c) {
      var tot = 0, cv = 0, ad = 0, tk = 0;
      all.forEach(function (sk) {
        if (sk.category !== c.id) return;
        tot++;
        if (covered[sk.id]) { cv++; if (ticked[sk.id]) tk++; } else if (added[sk.id]) ad++;
      });
      var row = add(box, el("div", "cat"));
      var h = add(row, el("div", "ch"));
      add(h, el("div", null, c.name));
      add(h, el("span", null, cv + " / " + tot + (ad ? "  (+" + ad + " next)" : "")));
      var bar = add(row, el("div", "cbar"));
      bar.setAttribute("role", "img");
      bar.setAttribute("aria-label", c.name + ": " + cv + " of " + tot + " covered");
      bar.style.setProperty("--catc", "var(--accent)");
      var pn = tot ? 100 / tot : 0;
      var nw = add(bar, el("i", "new")); nw.style.width = ((cv + ad) * pn) + "%";
      var cw = add(bar, el("i", "cov")); cw.style.width = (cv * pn) + "%";
      if (anyTick) { var tw = add(bar, el("i", "tick")); tw.style.width = (tk * pn) + "%"; tw.style.height = "35%"; tw.style.top = "32%"; }
    });
    var chk = $("chk"); clear(chk);
    SCHED.forEach(function (s) {
      if (s.st !== "done") return;
      var ids = skillsOfSession(s.n), t = 0;
      ids.forEach(function (id) { if (ticked[id]) t++; });
      var a = add(chk, link(null, "Session " + s.n + ": " + s.s, "session-" + s.n + ".html"));
      add(a, el("small", null, anyTick ? t + " / " + ids.length + " ticked" : ids.length + " skills"));
    });
    var mine = $("mine"); clear(mine);
    add(mine, el("h3", null, "Your checklist (this browser)"));
    if (anyTick && lsOK) {
      var tc = 0; Object.keys(covered).forEach(function (id) { if (ticked[id]) tc++; });
      var tt = Object.keys(ticked).length;
      var b = add(mine, el("div", "big", tc + " of " + covN));
      add(mine, el("p", "sub", "covered skills you have ticked. " + tt + " of " + all.length + " ticked across the whole term."));
    } else {
      add(mine, el("p", "sub", "No ticks found in this browser. Open a session checklist and tick a skill only when you can do it without notes; your progress then shows here. This page only reads your ticks."));
    }
  }

  /* ── 5 · deliverables ─────────────────────────────────────────────────── */
  function renderDeliverables() {
    var ol = $("dl"); clear(ol);
    var nxt = nextDeliverable();
    DELIV.forEach(function (x) {
      var diff = dayNum(x.d) - TD, st, label, pc;
      if (diff < 0) { st = "closed"; label = "Closed"; pc = "pill"; }
      else if (diff === 0) { st = "soon"; label = x.cls ? "In class today" : "Due today"; pc = "pill warn"; }
      else if (diff <= 7) { st = "soon"; label = x.cls ? "This week" : "Due this week"; pc = "pill warn"; }
      else { st = ""; label = "Upcoming"; pc = "pill acc"; }
      var li = add(ol, el("li", st + (nxt === x ? " next" : "")));
      var dd = add(li, el("div", "dd", fmt(x.d, true)));
      add(dd, el("small", null, x.cls ? "in class" : "11:59 pm ET"));
      var dt = add(li, el("div", "dt", x.t));
      add(dt, el("small", null, x.k + " · " + rel(diff)));
      add(li, el("span", pc, label));
    });
  }

  /* ── 6 · project ──────────────────────────────────────────────────────── */
  function renderProject() {
    var ol = $("ph"); clear(ol);
    var p0done = dayNum("2026-09-23") < TD, p1done = dayNum("2026-10-14") < TD;
    PHASES.forEach(function (p, k) {
      var st = k === 0 ? (p0done ? "done" : "nxt") : k === 1 ? (p1done ? "done" : p0done ? "nxt" : "") : "";
      var li = add(ol, el("li", st));
      add(li, el("div", "pn2", "Phase " + k + (st === "done" ? " · done" : st === "nxt" ? " · next" : "")));
      add(li, el("b", null, p[0]));
      add(li, el("p", null, p[1]));
      if (k === 0) add(li, el("span", "due", "due " + fmt("2026-09-23")));
      if (k === 1) add(li, el("span", "due", "due " + fmt("2026-10-14", true)));
    });
    var p1 = $("p1"); clear(p1);
    var c1 = add(p1, el("div", "card"));
    add(c1, el("h3", null, "Phase 1: what “fast hot path” means"));
    add(c1, el("p", null, "Between the book snapshot arriving and your order leaving, the code touches no heap. No std::string construction, no to_string, no map operator[] on a missing key, no push_back past capacity, no make_shared."));
    var c2 = add(p1, el("div", "card"));
    add(c2, el("h3", null, "How the sessions feed it"));
    add(c2, el("p", null, "Session 3: audit your on_book for every allocation. Session 4: replace them with pooled objects. Session 5: a compile-time codec with no vtable. Measured against your own Phase 0 baseline."));
    var c3 = add(p1, el("div", "card"));
    add(c3, el("h3", null, "Where it stands"));
    var dd = dayNum("2026-10-14") - TD;
    add(c3, el("p", null, dd >= 0 ? "Due " + fmt("2026-10-14", true) + ", 11:59 pm ET — " + rel(dd) + ". Phase 0 is behind us; the baseline you recorded is the number to beat." : "Phase 1 has closed."));
  }

  /* ── 7 · tonight / next ───────────────────────────────────────────────── */
  function agendaCard(parent, s, cls, kick) {
    var A = AGENDA[s.n], f = focusBy[s.n];
    var c = add(parent, el("div", "card " + (cls || "")));
    add(c, el("div", "kicker", kick + " · Session " + s.n + " · " + fmt(s.d, true)));
    add(c, el("h3", "big", A ? A.title : s.t));
    var ol = add(c, el("ol", "agenda"));
    if (A) {
      A.items.forEach(function (x, k) {
        var li = add(ol, el("li", k === A.items.length - 1 && /lab/i.test(x[0]) ? "lab" : ""));
        add(li, el("b", null, x[0])); add(li, el("span", null, x[1]));
      });
      add(c, el("p", "sub", "Homework: " + A.hw));
    } else {
      ((f && f.concepts) || []).forEach(function (x) { var li = add(ol, el("li")); add(li, el("b", null, x.title)); });
      if (f && f.tagline) add(c, el("p", "sub", f.tagline));
    }
    var lk = add(c, el("div", "dlinks")); sessionLinks(lk, s.n);
  }
  function renderTonight() {
    var two = $("two"); clear(two);
    if (!cur) {
      add(two, el("div", "card", "The 13 sessions are complete. Good luck on the final."));
      $("tH").textContent = "Wrap-up"; $("tK").textContent = "Done";
      return;
    }
    var kick = cur.st === "live" ? "In session now" : cur.st === "tonight" ? "Tonight" : "Next class";
    $("tK").textContent = kick + " and what follows";
    $("tH").textContent = kick + ": Session " + cur.n;
    agendaCard(two, cur, "tonight", kick);
    if (NEXT) agendaCard(two, NEXT, "", cur.st === "future" || cur.st === "next" ? "After that" : "Next week");
  }

  /* ── theme (in-memory only; follows the OS unless toggled) ────────────── */
  var root = document.documentElement, theme = "dark";
  try {
    var m = /[?&]theme=(light|dark)/.exec(location.search);
    theme = m ? m[1] : (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  } catch (e) { /* dark */ }
  function applyTheme() {
    root.setAttribute("data-theme", theme);
    $("themeBtn").textContent = theme === "dark" ? "Light theme" : "Dark theme";
  }
  $("themeBtn").addEventListener("click", function () { theme = theme === "dark" ? "light" : "dark"; applyTheme(); });
  applyTheme();

  /* ── go ───────────────────────────────────────────────────────────────── */
  renderHero(); renderJourney(); renderStack(); renderSkills();
  renderDeliverables(); renderProject(); renderTonight();
  var first = doneCount > 0 ? doneCount : (cur ? cur.n : 1);
  select(first, false);
  $("foot2").textContent = "Dates computed for " + fmt(NOW.ymd, true) + " (ET).";
})();
