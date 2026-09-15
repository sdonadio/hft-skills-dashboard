#!/usr/bin/env python3
"""Regenerate the session-N.html wrappers from session.html.

The wrappers exist only so that a course site (and the LMS links that point at
it) can use a URL with no query string. Each wrapper is session.html with one
extra line, injected just before the data files so app.js sees it:

    <script>window.SESSION_N = N;</script>
    <script src="skills.js"></script>
    <script src="focus.js"></script>
    <script src="app.js"></script>

Run this after editing session.html, or after adding, removing or renumbering a
session. The set of N comes from skills.js — whatever `n` values it lists, in
any order, starting anywhere (0 is fine) and with gaps if you like. focus.js is
never read here: a session with no focus entry still renders.

Wrappers whose session number is no longer in skills.js are deleted, so the
directory never keeps a stale page alive on the published site.

    python3 tools/make_session_pages.py
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TITLE_RE = re.compile(r"<title>.*?</title>", re.S)
ANCHOR = '<script src="skills.js"></script>'
WRAPPER_RE = re.compile(r"^session-(\d+)\.html$")


def session_numbers():
    """The `n` of every session in skills.js, de-duplicated and sorted."""
    src = open(os.path.join(HERE, "skills.js")).read()
    data = json.loads(src[src.index("{"): src.rindex("}") + 1])
    nums = []
    for s in data["sessions"]:
        n = int(s["n"])
        if n not in nums:
            nums.append(n)
    return sorted(nums)


def main():
    body = open(os.path.join(HERE, "session.html")).read()
    if ANCHOR not in body:
        sys.exit("session.html no longer contains %s — cannot inject the session number" % ANCHOR)
    nums = session_numbers()

    for n in nums:
        out = TITLE_RE.sub("<title>Session %d · Skills Dashboard</title>" % n, body, count=1)
        out = out.replace(
            ANCHOR,
            "<!-- Static wrapper for session %d: identical body to session.html, n fixed here.\n"
            "     Regenerate with tools/make_session_pages.py after editing session.html. -->\n"
            "<script>window.SESSION_N = %d;</script>\n"
            "%s" % (n, n, ANCHOR),
            1)
        open(os.path.join(HERE, "session-%d.html" % n), "w").write(out)

    # drop wrappers for sessions that no longer exist
    keep = set("session-%d.html" % n for n in nums)
    stale = sorted(f for f in os.listdir(HERE) if WRAPPER_RE.match(f) and f not in keep)
    for f in stale:
        os.remove(os.path.join(HERE, f))

    print("wrote %d session wrappers: %s"
          % (len(nums), ", ".join("session-%d.html" % n for n in nums)))
    if stale:
        print("removed %d stale wrapper(s): %s" % (len(stale), ", ".join(stale)))


if __name__ == "__main__":
    main()
