#!/usr/bin/env python3
"""Regenerate session-1.html ... session-N.html from session.html.

The wrappers exist only so that GitHub Pages (and CourseWorks links) can point at
a URL with no query string. Each wrapper is session.html with one extra line,
injected just before the data files so app.js sees it:

    <script>window.HFT_SESSION = N;</script>
    <script src="skills.js"></script>
    <script src="focus.js"></script>
    <script src="app.js"></script>

Run this after editing session.html. N comes from skills.js (count of sessions);
focus.js is never read here — a session with no focus entry still renders.

    python3 tools/make_session_pages.py
"""
import json, os

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def session_numbers():
    src = open(os.path.join(HERE, "skills.js")).read()
    data = json.loads(src[src.index("{"): src.rindex("}") + 1])
    return [s["n"] for s in data["sessions"]]

def main():
    body = open(os.path.join(HERE, "session.html")).read()
    nums = session_numbers()
    for n in nums:
        out = body.replace("<title>Session · Skills Dashboard</title>",
                           "<title>Session %d · Skills Dashboard</title>" % n)
        out = out.replace('<script src="skills.js"></script>',
                          "<!-- Static wrapper for session %d: identical body to session.html, n fixed here.\n"
                          "     Regenerate with tools/make_session_pages.py after editing session.html. -->\n"
                          "<script>window.HFT_SESSION = %d;</script>\n"
                          '<script src="skills.js"></script>' % (n, n))
        open(os.path.join(HERE, "session-%d.html" % n), "w").write(out)
    print("wrote %d session wrappers: %s" % (len(nums), ", ".join("session-%d.html" % n for n in nums)))

if __name__ == "__main__":
    main()
