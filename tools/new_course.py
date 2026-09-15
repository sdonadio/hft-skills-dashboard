#!/usr/bin/env python3
"""Instantiate this shell for another course.

    python3 tools/new_course.py DEST_DIR [--force]

Copies the shell — the three page templates, the stylesheet, app.js, tools/ and
README.md (plus .gitignore / .nojekyll if this repo has them) — into DEST_DIR.

What is deliberately NOT copied:

  * skills.js and focus.js — the two data files. They are the course; the new
    course writes its own. DEST_DIR gets a DATA_README.md instead.
  * session-N.html — generated wrappers. Regenerate them in DEST_DIR with
    tools/make_session_pages.py once skills.js is in place.
  * .git — the new course is its own repository.

The shell itself is course-agnostic: the code, title, institution, term, links,
LMS name, code language, accent colours and the localStorage namespace all come
from SKILLS.course, and the two standing section headings from FOCUS.meta.
"""
import os, shutil, sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATA_FILES = ("skills.js", "focus.js")
SKIP_DIRS = (".git", "__pycache__", ".idea", ".DS_Store")
OPTIONAL = (".gitignore", ".nojekyll", "CNAME")
SHELL_FILES = ("index.html", "session.html", "skills.html", "styles.css", "app.js", "README.md")

DATA_README = """# Drop the two data files in here

This directory is the **shell** of the skills dashboard, copied by
`tools/new_course.py`. It has every page, the stylesheet, `app.js` and `tools/`,
but no course content. Two files are missing, and nothing renders until they are
here:

| File | Global | What it holds |
|---|---|---|
| `skills.js` | `window.SKILLS` | `course`, `categories`, `sessions`, `skills` |
| `focus.js`  | `window.FOCUS`  | optional `meta`, plus one entry per session: the main technical focus, its concepts, the "why it matters" link, the interview questions |

`README.md` (next to this file) documents the exact shape of both. `focus.js` is
optional — with only `skills.js` the site still works, and any session without a
focus entry says "focus content coming".

## 1 · `skills.js` → `course`

Required: `code`, `title`, `institution`, `term`, `sessions_url`, `starter_url`,
`companion_url`.

Optional, and the reason this shell is reusable:

| Field | Default | Effect |
|---|---|---|
| `storage_prefix` | `"hft-skills"` | localStorage namespace, `<prefix>:<skill id>`. **Set this.** Sibling course sites published under the same `*.github.io` origin share one localStorage; two courses with the same prefix would overwrite each other's ticks. |
| `accent` | `#2e6db4` | Theme colour: bars, fills, the nav rule |
| `accent_2` | derived from `accent` (`#b9d9eb` by default) | Link and label ink on the dark background |
| `accent_3`, `accent_deep` | derived | Pale ink on code, deep shade |
| `lms` | `"CourseWorks"` | Named in the "Course site" and "Deck (on …)" labels |
| `lang` | `"C++"` | The chip on a code block that names no deck |

`categories` may use any ids and there may be any number of them; each carries
its own `color`. `sessions` may be numbered from 0 (or anything else), in any
count, with any ISO dates.

## 2 · `focus.js` → `meta` (all optional)

| Field | Default |
|---|---|
| `link_title` | `"Why this matters in HFT"` |
| `link_kicker` | `"The link with HFT"` |
| `link_phrase` | `"why it matters in an HFT system"` (used in the overview lead) |
| `link_short` | `"HFT link"` (used when a session has no focus entry yet) |
| `interview_title` | `"Interview questions"` |
| `interview_kicker` | `"Interview"` |

## 3 · Generate the session wrappers

```sh
python3 tools/make_session_pages.py
```

One `session-N.html` per `n` in `skills.js` (including `n = 0`); wrappers for
sessions that no longer exist are removed.

## 4 · Preview

```sh
python3 -m http.server 8080   # then open http://localhost:8080/
```

## Note on `tools/`

`tools/make_session_pages.py` and `tools/new_course.py` are part of the shell and
work for any course. The other scripts in `tools/` were written against one
specific course's data (paths, deck names, session counts) — adapt or delete
them rather than trusting them here.
"""


def copy_shell(dest, force=False):
    if os.path.exists(dest) and os.listdir(dest) and not force:
        sys.exit("%s is not empty — pass --force to write into it anyway" % dest)
    os.makedirs(dest, exist_ok=True)

    written = []
    for name in SHELL_FILES:
        src = os.path.join(HERE, name)
        if not os.path.exists(src):
            sys.exit("the shell is missing %s — run this from a complete checkout" % name)
        shutil.copy2(src, os.path.join(dest, name))
        written.append(name)

    for name in OPTIONAL:
        src = os.path.join(HERE, name)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(dest, name))
            written.append(name)

    tools_src = os.path.join(HERE, "tools")
    tools_dst = os.path.join(dest, "tools")
    if os.path.isdir(tools_dst):
        shutil.rmtree(tools_dst)
    os.makedirs(tools_dst)
    for name in sorted(os.listdir(tools_src)):
        if name in SKIP_DIRS or name.startswith("."):
            continue
        src = os.path.join(tools_src, name)
        if os.path.isdir(src):
            continue
        shutil.copy2(src, os.path.join(tools_dst, name))
        written.append("tools/" + name)

    with open(os.path.join(dest, "DATA_README.md"), "w") as fh:
        fh.write(DATA_README)
    written.append("DATA_README.md")
    return written


def main(argv):
    args = [a for a in argv[1:] if not a.startswith("-")]
    force = "--force" in argv[1:]
    if len(args) != 1:
        sys.exit(__doc__.strip().split("\n\n")[1].strip())
    dest = os.path.abspath(args[0])
    if dest == HERE:
        sys.exit("refusing to copy the shell over itself")
    written = copy_shell(dest, force)
    print("shell copied into %s" % dest)
    for name in written:
        print("  + %s" % name)
    print("\nnot copied (course content): %s, session-N.html, .git" % ", ".join(DATA_FILES))
    print("next: write skills.js and focus.js there, then "
          "python3 tools/make_session_pages.py — see DATA_README.md")


if __name__ == "__main__":
    main(sys.argv)
