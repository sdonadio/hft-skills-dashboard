# HFT Skills Dashboard

A small, public, student-facing site for a graduate course. Every session is built around **one main
technical focus** — week 2 is pointers, week 3 is objects and ownership, and so on — and each session page
reads top to bottom as a short technical page:

1. the focus, as a numbered sequence of concept cards with real C++ snippets;
2. **what you should be able to do after this session** — the skills checklist, one honest sentence per
   skill starting with *"You can…"*, ticked by the student and stored in their own browser;
3. **why this matters in HFT** — the link between the week's technique and a real trading system;
4. **interview questions** — quant-developer / low-latency questions with model answers, hidden behind
   disclosures so a student can answer first.

The overview page is a thirteen-row focus timeline: one row per session, showing the focus in large type
and how much of that session's checklist is ticked.

Published as a static site on GitHub Pages:
<https://sdonadio.github.io/hft-skills-dashboard/>

The course code, title, institution and term shown in the header all come from the data files — the site is
not hard-wired to one course.

## What is in here

| File | Role |
|---|---|
| `skills.js` | **Data file 1.** Defines `window.SKILLS` (course, categories, sessions, skills). The checklist and the catalogue come from here. |
| `focus.js` | **Data file 2.** Defines `window.FOCUS` (per session: the main technical focus, its concepts, the HFT link, the interview questions). |
| `index.html` | Overview: header, one-line progress, the 13-row focus timeline, privacy + reset. |
| `session.html` | One session, focus-first. Reads the session number from `?n=N`. |
| `session-1.html` … `session-13.html` | Thin static wrappers around the same body, with `n` fixed, so the pages work without a query string and can be linked from CourseWorks. These URLs are stable. |
| `skills.html` | The whole catalogue: filterable, searchable table with the same checkboxes. |
| `styles.css` | The single shared stylesheet (dark theme, Columbia blue accent, print rules). |
| `app.js` | The single shared script. Renders every page from `window.SKILLS` + `window.FOCUS`. |
| `tools/make_session_pages.py` | Regenerates the `session-N.html` wrappers from `session.html`. |

No build step, no framework, no CDN, no fonts to download: vanilla HTML, CSS and ES5-compatible JavaScript.
Every page works from `file://` and from GitHub Pages, and all links are relative.

**The two data files are independent.** `skills.js` alone is enough for the site to work: if `focus.js` is
missing, or is missing a particular session, that session page still renders its checklist and says
*"focus content coming"* instead of failing, and the timeline row falls back to the session title.

## How to regenerate

1. **Data file 1 — `skills.js`.** Must define exactly one global, `window.SKILLS`:
   - `course` — `{ code, title, institution, term, sessions_url, starter_url, companion_url }`
   - `categories` — exactly four, `{ id, name, color }`
   - `sessions` — one per class meeting, `{ n, date (YYYY-MM-DD), title, decks[], lab, hw, project,
     exam, companion_url, skills[] }` where `skills` holds skill ids in teaching order
   - `skills` — `{ id, category, name, can, introduced, practised[], depth (1–3), where[], interview }`

2. **Data file 2 — `focus.js`.** Must define exactly one global, `window.FOCUS`:
   - `sessions` — one entry per session, keyed by `n`:
     - `focus` — 2–4 words, the ONE main technical focus (this is the session page's big title)
     - `tagline` — one sentence, shown under it
     - `concepts[]` — 4–6 items in teaching order, `{ title, text, code?, deck? }`; `code` is a short
       C++ snippet rendered in a dark monospace block with a copy button, `deck` is a small chip
     - `hft` — `{ paragraphs[] (or text), example?: { title, code, text } }` → the
       *"Why this matters in HFT"* section, closing with the optional *"In the arena"* card
     - `interview[]` — 6–8 items, `{ q, a, level: "warm-up" | "core" | "senior", skill? }`.
       `a` is plain text; a fenced block delimited by ``` inside it is rendered as a code block.
       `skill` is a skill id from `skills.js` and adds a *related skill* link that jumps to that row of
       the checklist and highlights it.

   Both files are plain `window.X = { … };` assignments; the tooling parses them by taking the text
   between the first `{` and the last `}`, so keep them valid JSON inside the braces.

3. **Wrappers.** If the number of sessions changes, or you edit `session.html`, run:

   ```sh
   python3 tools/make_session_pages.py
   ```

   That rewrites `session-1.html` … `session-N.html` from `session.html`. The generated wrappers only add
   `window.HFT_SESSION = N;` before the data files, so `session-2.html` and `session.html?n=2` render
   identically.

4. **Preview locally.**

   ```sh
   python3 -m http.server 8080   # then open http://localhost:8080/
   ```

   Opening `index.html` straight from disk also works; some browsers restrict local storage on
   `file://`, in which case the page says so and ticks are not kept.

## How it is published

The repository is published with **GitHub Pages** from the default branch, root folder — there is no
workflow and nothing to compile. Pushing to `main` updates the live site within a minute or two.

## Privacy

**Nothing leaves the browser.** Ticks are stored in that browser's `localStorage`, one key per skill:

```
hft-skills:<skill id>   →   "1"
```

There is no account, no cookie, no analytics, no server and no network request of any kind after the page
loads. The instructor cannot see a student's progress, and progress does not follow a student to another
device or another browser. "Reset my progress" on the overview page removes every `hft-skills:` key.
Clearing browser data clears the checklist.

## Accessibility and printing

Semantic landmarks and headings; every checkbox is a real `<input type="checkbox">` inside a `<label>`, so
the checklist is fully keyboard-operable; the interview questions and the *where it's practised* toggles are
native `<details>`/`<summary>` disclosures; every button carries a label; focus is always visible; colour is
never the only carrier of meaning (the interview level pills are also spelled out in words). No data text is
ever injected as HTML — the renderer only uses `textContent` and `createElement`.

Session pages have print rules: printing one gives you the focus, the checklist as paper checkboxes, and the
interview questions **with their answers expanded** (the page opens every answer on `beforeprint` and
restores your state afterwards).
