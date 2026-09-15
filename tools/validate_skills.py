import os
#!/usr/bin/env python3
"""Validate skills.js against the SCHEMA.md data contract."""
import json, os, re, collections

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "skills.js")
LABS_DIR = "/Users/sdonadio/PycharmProjects/AlgoArena/course/hft-columbia/project-starter/labs"
DECK_DIR = "/Users/sdonadio/PycharmProjects/AlgoArena/course/hft-columbia"

raw = open(SRC).read().strip()
assert raw.startswith("window.SKILLS = "), "must start with window.SKILLS = "
assert raw.endswith(";"), "must end with ;"
data = json.loads(raw[len("window.SKILLS = "):-1])

LAB_OF = {1: [1], 2: [2], 3: [3], 4: [4], 5: [5, 6], 6: [7], 7: [8], 8: [9],
          9: [10], 10: [11, 12], 11: [13], 12: [14], 13: [15]}

errs = []
def chk(cond, msg):
    if not cond:
        errs.append(msg)

# --- course block
for k in ("code", "title", "institution", "term", "sessions_url", "starter_url", "companion_url"):
    chk(k in data["course"], "course missing %s" % k)

# --- categories
cats = data["categories"]
chk([c["id"] for c in cats] == ["cpp", "perf", "tools", "trading"],
    "category ids must be exactly cpp, perf, tools, trading in order")
chk(len(cats) == 4, "must be exactly 4 categories")
for c in cats:
    chk(set(c) == {"id", "name", "color"}, "category %s odd keys" % c.get("id"))

# --- sessions
sess = data["sessions"]
chk(len(sess) == 13, "must be exactly 13 sessions, got %d" % len(sess))
chk([s["n"] for s in sess] == list(range(1, 14)), "sessions must be numbered 1..13 in order")
for s in sess:
    chk(bool(re.fullmatch(r"20\d\d-\d\d-\d\d", s.get("date", ""))),
        "session %s bad date %r" % (s["n"], s.get("date")))
    chk(bool(s.get("title")), "session %s missing title" % s["n"])
    chk(bool(s.get("decks")), "session %s missing decks" % s["n"])
    for d in s["decks"]:
        chk(os.path.exists(os.path.join(DECK_DIR, d + ".pptx")), "session %s deck %s missing" % (s["n"], d))
    chk(s.get("exam") in (None, "midterm", "final"), "session %s bad exam" % s["n"])
    chk(s["companion_url"].startswith("https://sdonadio.github.io/low-latency-trading-arena/week"),
        "session %s bad companion_url" % s["n"])
    for key in ("lab", "hw", "project"):
        v = s.get(key)
        chk(v is None or ("label" in v and "url" in v), "session %s %s malformed" % (s["n"], key))
    chk(s["hw"] is None or re.fullmatch(r"20\d\d-\d\d-\d\d", s["hw"]["due"]),
        "session %s hw due bad" % s["n"])
    chk(s["project"] is None or re.fullmatch(r"20\d\d-\d\d-\d\d", s["project"]["due"]),
        "session %s project due bad" % s["n"])
exams = [s["exam"] for s in sess if s["exam"]]
chk(exams == ["midterm", "final"], "expected one midterm then one final, got %r" % exams)

# --- skills
skills = data["skills"]
ids = [k["id"] for k in skills]
chk(len(ids) == len(set(ids)), "duplicate skill ids: %r" %
    [i for i, c in collections.Counter(ids).items() if c > 1])
chk(60 <= len(skills) <= 90, "want 60-90 skills, got %d" % len(skills))
by_id = {k["id"]: k for k in skills}
ALLOWED_WHERE = {"deck", "lab", "hw", "project", "exam"}
for k in skills:
    sid = k["id"]
    chk(set(k) == {"id", "category", "name", "can", "introduced", "practised", "depth",
                   "where", "interview"}, "%s odd key set %r" % (sid, sorted(k)))
    chk(k["category"] in {"cpp", "perf", "tools", "trading"}, "%s bad category" % sid)
    chk(bool(re.fullmatch(r"[a-z]+\.[a-z0-9]+(?:-[a-z0-9]+)*", sid)),
        "%s id must be <category>.<slug>" % sid)
    chk(sid.split(".")[0] == k["category"], "%s id prefix != category" % sid)
    chk(k["can"].startswith("You can "), "%s can must start with 'You can'" % sid)
    chk(k["can"].endswith("."), "%s can must be one sentence ending in ." % sid)
    chk(k["depth"] in (1, 2, 3), "%s bad depth" % sid)
    chk(isinstance(k["interview"], bool), "%s interview not bool" % sid)
    chk(1 <= k["introduced"] <= 13, "%s introduced out of range" % sid)
    chk(isinstance(k["practised"], list), "%s practised not a list" % sid)
    chk(k["introduced"] not in k["practised"], "%s practised repeats introduced" % sid)
    chk(len(set(k["practised"])) == len(k["practised"]), "%s practised has dups" % sid)
    for p in k["practised"]:
        chk(1 <= p <= 13, "%s practised session %r out of range" % (sid, p))
    chk(1 <= len(k["where"]) <= 6, "%s where must have 1..6 items, has %d" % (sid, len(k["where"])))
    for w in k["where"]:
        chk(w["type"] in ALLOWED_WHERE, "%s where type %r not allowed" % (sid, w.get("type")))
        chk(bool(w.get("label")), "%s where item missing label" % sid)
        if w["type"] == "deck":
            chk("session" in w and 1 <= w["session"] <= 13, "%s deck where missing session" % sid)
            chk("url" not in w, "%s deck where must have no url" % sid)
            m = re.match(r"Deck (W\d+) · (slide|slides) ([\d, –]+)$", w["label"])
            chk(bool(m), "%s deck label %r not in canonical form" % (sid, w["label"]))
            if m:
                dk = m.group(1).lower()
                chk(dk in sess[w["session"] - 1]["decks"],
                    "%s cites %s but session %d teaches %r" %
                    (sid, dk, w["session"], sess[w["session"] - 1]["decks"]))
            chk(w["session"] == k["introduced"] or w["session"] in k["practised"],
                "%s cites a deck from session %d, which is neither its introduced "
                "session nor a practised one" % (sid, w["session"]))
        elif w["type"] == "lab":
            chk(w["url"].startswith("https://github.com/sdonadio/hft-cpp-starter-columbia/blob/main/labs/week"),
                "%s lab url wrong" % sid)
            f = w["url"].rsplit("/", 1)[-1]
            chk(os.path.exists(os.path.join(LABS_DIR, f)), "%s lab file %s does not exist" % (sid, f))
            chk("session" in w and 1 <= w["session"] <= 13, "%s lab where missing session" % sid)
            chk(w["session"] == k["introduced"] or w["session"] in k["practised"],
                "%s cites a lab from session %d, which is neither its introduced "
                "session nor a practised one" % (sid, w["session"]))
            labnum = int(re.search(r"week(\d\d)\.md", f).group(1))
            chk(labnum in LAB_OF.get(w["session"], []),
                "%s cites %s under session %d, which runs labs %r" %
                (sid, f, w["session"], LAB_OF.get(w["session"])))
        elif w["type"] in ("hw", "project"):
            chk(w["url"].startswith("https://courseworks2.columbia.edu/courses/252758/assignments/"),
                "%s %s url wrong" % (sid, w["type"]))
        elif w["type"] == "exam":
            chk("url" not in w, "%s exam where must have no url" % sid)
            chk(w["label"].startswith(("Midterm · group: ", "Final · group: ")),
                "%s exam label %r wrong" % (sid, w["label"]))
    order = [ALLOWED_WHERE and ["deck", "lab", "hw", "project", "exam"].index(w["type"]) for w in k["where"]]
    chk(order == sorted(order), "%s where not in deck/lab/hw/project/exam order" % sid)

# --- exam labels must match the real bank group names
banks = {}
for tag, path in (("Midterm", "/Users/sdonadio/PycharmProjects/AlgoArena/course/exams/hft_midterm_bank.json"),
                  ("Final", "/Users/sdonadio/PycharmProjects/AlgoArena/course/exams/hft_final_bank.json")):
    banks[tag] = {g["name"] for g in json.load(open(path))["groups"]}
for k in skills:
    for w in k["where"]:
        if w["type"] == "exam":
            tag, grp = w["label"].split(" · group: ", 1)
            chk(grp in banks[tag], "%s exam group %r not in the %s bank" % (k["id"], grp, tag))

# --- cross-reference: skill <-> session membership must be exact
for s in sess:
    chk(len(s["skills"]) == len(set(s["skills"])), "session %d has duplicate skill ids" % s["n"])
    for sid in s["skills"]:
        chk(sid in by_id, "session %d lists unknown skill %s" % (s["n"], sid))
for k in skills:
    want = {k["introduced"]} | set(k["practised"])
    got = {s["n"] for s in sess if k["id"] in s["skills"]}
    chk(want == got, "%s should appear in sessions %r but appears in %r" % (k["id"], sorted(want), sorted(got)))
for s in sess:
    chk(5 <= len(s["skills"]) <= 9, "session %d has %d skills (want 5-9)" % (s["n"], len(s["skills"])))

# --- report
print("=" * 68)
print("skills.js validation" + ("  —  ALL CHECKS PASSED" if not errs else "  —  %d FAILURES" % len(errs)))
print("=" * 68)
for e in errs:
    print("  FAIL:", e)
print()
print("totals: %d skills, %d sessions, %d categories" % (len(skills), len(sess), len(cats)))
print("interview-flagged: %d" % sum(1 for k in skills if k["interview"]))
print("where-links: %d (deck %d, lab %d, hw %d, project %d, exam %d)" % (
    sum(len(k["where"]) for k in skills),
    *[sum(1 for k in skills for w in k["where"] if w["type"] == t)
      for t in ("deck", "lab", "hw", "project", "exam")]))
print()
print("per category:")
for c in cats:
    n = sum(1 for k in skills if k["category"] == c["id"])
    d = collections.Counter(k["depth"] for k in skills if k["category"] == c["id"])
    print("  %-8s %2d skills   depth1=%d depth2=%d depth3=%d   interview=%d" % (
        c["id"], n, d[1], d[2], d[3],
        sum(1 for k in skills if k["category"] == c["id"] and k["interview"])))
print()
print("per session:")
for s in sess:
    intro = [i for i in s["skills"] if by_id[i]["introduced"] == s["n"]]
    prac = [i for i in s["skills"] if by_id[i]["introduced"] != s["n"]]
    print("  S%-2d %s  decks=%-9s total=%d (new %d, practised %d)%s" % (
        s["n"], s["date"], "+".join(s["decks"]), len(s["skills"]), len(intro), len(prac),
        "  [%s]" % s["exam"] if s["exam"] else ""))
print()
print("depth overall: " + ", ".join(
    "depth%d=%d" % (d, sum(1 for k in skills if k["depth"] == d)) for d in (1, 2, 3)))
raise SystemExit(1 if errs else 0)
