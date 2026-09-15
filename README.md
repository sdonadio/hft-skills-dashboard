# Skills Dashboard

A small, public, student-facing site for a graduate course. Every session is built around **one main
technical focus** — in the C++ course week 2 is pointers, week 3 is objects and ownership, and so on — and
each session page reads top to bottom as a short technical page:

1. the focus, as a numbered sequence of concept cards with real code snippets;
2. **what you should be able to do after this session** — the skills checklist, one honest sentence per
   skill starting with *"You can…"*, ticked by the student and stored in their own browser;
3. **why this matters** — the link between the week's technique and a real trading system;
4. **interview questions** — quant-developer questions with model answers, hidden behind disclosures so a
   student can answer first.

The overview page is a focus timeline: one row per session, showing the focus in large type and how much of
that session's checklist is ticked.

Published as a static site on GitHub Pages — this instance:
<https://sdonadio.github.io/hft-skills-dashboard/>

**The shell is course-agnostic.** The course code, title, institution, term, links, LMS name, code
language, accent colours and the browser-storage namespace all come from the data files. The same shell
serves several courses (`tools/new_course.py`), including courses in another language, with other skill
categories, and with sessions numbered from 0.

## What is in here

| File | Role |
|---|---|
| `skills.js` | **Data file 1.** Defines `window.SKILLS` (course, categories, sessions, skills). The checklist and the catalogue come from here. |
| `focus.js` | **Data file 2.** Defines `window.FOCUS` (optional `meta`, plus per session: the main technical focus, its concepts, the "why it matters" link, the interview questions). |
| `index.html` | Overview: header, one-line progress, the focus timeline, privacy + reset. |
| `session.html` | One session, focus-first. Reads the session number from `?n=N`. |
| `session-N.html` | Thin static wrappers around the same body, one per session in `skills.js`, with `n` fixed, so the pages work without a query string and can be linked from the LMS. These URLs are stable. |
| `skills.html` | The whole catalogue: filterable, searchable table with the same checkboxes. |
| `styles.css` | The single shared stylesheet (dark theme, print rules). Accent colours are re-declared at runtime from the data. |
| `app.js` | The single shared script. Renders every page from `window.SKILLS` + `window.FOCUS`. |
| `tools/make_session_pages.py` | Regenerates the `session-N.html` wrappers from `session.html`. |
| `tools/new_course.py` | Copies this shell, without the data files, into a new directory for another course. |

The other scripts in `tools/` build and validate one specific course's data and are not part of the shell.

No build step, no framework, no CDN, no fonts to download: vanilla HTML, CSS and ES5-compatible JavaScript.
Every page works from `file://` and from GitHub Pages, and all links are relative.

**The two data files are independent.** `skills.js` alone is enough for the site to work: if `focus.js` is
missing, or is missing a particular session, that session page still renders its checklist and says
*"focus content coming"* instead of failing, and the timeline row falls back to the session title.

## How to regenerate

1. **Data file 1 — `skills.js`.** Must define exactly one global, `window.SKILLS`:
   - `course` — required: `{ code, title, institution, term, sessions_url, starter_url, companion_url }`.
     Optional, and what makes the shell reusable:

     | Field | Default | Effect |
     |---|---|---|
     | `storage_prefix` | `"hft-skills"` | The localStorage namespace, `<prefix>:<skill id>`. **Set it for every new course:** sibling sites published under one `*.github.io` origin share one localStorage, so two courses with the same prefix would overwrite each other's ticks. |
     | `accent` | `#2e6db4` | Theme colour — bars, fills, the nav rule |
     | `accent_2` | derived from `accent` (default `#b9d9eb`) | Link and label ink on the dark background |
     | `accent_3`, `accent_deep` | derived | Pale ink on code; deep shade |
     | `lms` | `"CourseWorks"` | The LMS name in the *Course site* and *Deck (on …)* labels |
     | `lang` | `"C++"` | The chip on a code block that names no deck |

     `app.js` re-declares `--accent`, `--accent-2`, `--accent-3`, `--accent-deep`, `--accent-rgb` and
     `--accent-2-rgb` on `:root` at startup. With no `accent` in the data the stylesheet defaults are
     re-applied verbatim, so an existing site does not change.
   - `categories` — `{ id, name, color }`. **Any ids, any number of them**; the colour of a checklist row
     and of a catalogue dot is the category's own `color`.
   - `sessions` — one per class meeting, `{ n, date (YYYY-MM-DD), title, decks[], lab, hw, project,
     exam, companion_url, skills[] }` where `skills` holds skill ids in teaching order. **`n` may start at
     0** (or anywhere), dates may be any ISO dates, and there may be any number of sessions.
   - `skills` — `{ id, category, name, can, introduced, practised[], depth (1–3), where[], interview }`

2. **Data file 2 — `focus.js`.** Must define exactly one global, `window.FOCUS`:
   - `meta` — optional; renames the two standing sections. Every field is optional:

     | Field | Default | Where it shows |
     |---|---|---|
     | `link_title` | `"Why this matters in HFT"` | The `<h2>` of section 4 on a session page |
     | `link_kicker` | `"The link with HFT"` | The kicker above it |
     | `link_phrase` | `"why it matters in an HFT system"` | Mid-sentence, in the overview lead and the page description |
     | `link_short` | `"HFT link"` | The "focus content coming" note on a session with no focus entry |
     | `interview_title` | `"Interview questions"` | The `<h2>` of section 5 |
     | `interview_kicker` | `"Interview"` | The kicker above it |

   - `sessions` — one entry per session, keyed by `n`:
     - `focus` — 2–4 words, the ONE main technical focus (this is the session page's big title)
     - `tagline` — one sentence, shown under it
     - `concepts[]` — 4–6 items in teaching order, `{ title, text, code?, deck? }`; `code` is a short
       snippet rendered in a dark monospace block with a copy button (labelled with `deck`, or with
       `course.lang` when there is no deck), `deck` is a small chip
     - `hft` — `{ paragraphs[] (or text), example?: { title, code, text } }` → the
       *"why this matters"* section, closing with the optional *"In the arena"* card
     - `interview[]` — 6–8 items, `{ q, a, level: "warm-up" | "core" | "senior", skill? }`.
       `a` is plain text; a fenced block delimited by ``` inside it is rendered as a code block.
       `skill` is a skill id from `skills.js` and adds a *related skill* link that jumps to that row of
       the checklist and highlights it.

   Both files are plain `window.X = { … };` assignments; the tooling parses them by taking the text
   between the first `{` and the last `}`, so keep them valid JSON inside the braces.

3. **Wrappers.** If the set of sessions changes, or you edit `session.html`, run:

   ```sh
   python3 tools/make_session_pages.py
   ```

   That writes one `session-N.html` per `n` in `skills.js` — including `session-0.html` — and deletes
   wrappers for sessions that are no longer in the data. The generated wrappers only add
   `window.SESSION_N = N;` before the data files, so `session-2.html` and `session.html?n=2` render
   identically.

4. **Preview locally.**

   ```sh
   python3 -m http.server 8080   # then open http://localhost:8080/
   ```

   Opening `index.html` straight from disk also works; some browsers restrict local storage on
   `file://`, in which case the page says so and ticks are not kept.

## Reusing the shell for another course

```sh
python3 tools/new_course.py ../systematic-trading-skills
```

That copies every page, `styles.css`, `app.js`, `tools/` and this README into the new directory — and
**not** `skills.js`, `focus.js`, the generated `session-N.html` wrappers or `.git`. It leaves a
`DATA_README.md` there listing the two files to drop in and the fields to set. Write the data, give the
course its own `storage_prefix` and `accent`, run `tools/make_session_pages.py`, and publish.

## How it is published

The repository is published with **GitHub Pages** from the default branch, root folder — there is no
workflow and nothing to compile. Pushing to `main` updates the live site within a minute or two.

## Privacy

**Nothing leaves the browser.** Ticks are stored in that browser's `localStorage`, one key per skill:

```
<storage_prefix>:<skill id>   →   "1"        e.g.  hft-skills:cpp.pointers
```

There is no account, no cookie, no analytics, no server and no network request of any kind after the page
loads. The instructor cannot see a student's progress, and progress does not follow a student to another
device or another browser. "Reset my progress" on the overview page removes every key with **this
course's** prefix, so a sibling course on the same origin is untouched. Clearing browser data clears the
checklist.

## Accessibility and printing

Semantic landmarks and headings; every checkbox is a real `<input type="checkbox">` inside a `<label>`, so
the checklist is fully keyboard-operable; the interview questions and the *where it's practised* toggles are
native `<details>`/`<summary>` disclosures; every button carries a label; focus is always visible; colour is
never the only carrier of meaning (the interview level pills are also spelled out in words). No data text is
ever injected as HTML — the renderer only uses `textContent` and `createElement`.

Session pages have print rules: printing one gives you the focus, the checklist as paper checkboxes, and the
interview questions **with their answers expanded** (the page opens every answer on `beforeprint` and
restores your state afterwards).
