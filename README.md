# HFT Skills Dashboard

A small, public, student-facing **skills checklist** for a graduate course. Every session of the course
lists the skills it teaches as one honest sentence that starts with *"You can…"*; a student ticks a skill
when the sentence is true of them, and the site shows their coverage as a four-axis radar, a session grid,
and a searchable catalogue.

Published as a static site on GitHub Pages:
<https://sdonadio.github.io/hft-skills-dashboard/>

The course code, title, institution and term shown in the header all come from the data file — the site is
not hard-wired to one course.

## What is in here

| File | Role |
|---|---|
| `skills.js` | **The only data file.** Defines `window.SKILLS` (course, categories, sessions, skills). |
| `index.html` | Course overview: radar, session grid, category legend, reset button. |
| `session.html` | One session's checklist. Reads the session number from `?n=N`. |
| `session-1.html` … `session-13.html` | Thin static wrappers around the same body, with `n` fixed, so the pages work without a query string and can be linked from CourseWorks. |
| `skills.html` | The whole catalogue: filterable, searchable table with the same checkboxes. |
| `styles.css` | The single shared stylesheet (dark theme, Columbia blue accent, print rules). |
| `app.js` | The single shared script. Renders every page from `window.SKILLS`. |
| `tools/make_session_pages.py` | Regenerates the `session-N.html` wrappers from `session.html`. |

No build step, no framework, no CDN, no fonts to download: vanilla HTML, CSS and ES5-compatible JavaScript.
Every page works from `file://` and from GitHub Pages, and all links are relative.

## How to regenerate

1. **Data.** Replace `skills.js`. It must define exactly one global, `window.SKILLS`, with the shape
   documented at the top of this section:
   - `course` — `{ code, title, institution, term, sessions_url, starter_url, companion_url }`
   - `categories` — exactly four, `{ id, name, color }`
   - `sessions` — one per class meeting, `{ n, date (YYYY-MM-DD), title, decks[], lab, hw, project,
     exam, companion_url, skills[] }` where `skills` holds skill ids in teaching order
   - `skills` — `{ id, category, name, can, introduced, practised[], depth (1–3), where[], interview }`

   Nothing else needs to change: pages, counts, radars, filters and the session grid are all derived from
   the data at load time.

2. **Wrappers.** If the number of sessions changes, or you edit `session.html`, run:

   ```sh
   python3 tools/make_session_pages.py
   ```

   That rewrites `session-1.html` … `session-N.html` from `session.html`.

3. **Preview locally.**

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
the list is fully keyboard-operable; focus is always visible; the radar carries an `aria-label` describing
its numbers in words; colour is never the only carrier of meaning. Session pages have print rules — a
student can print one session as a paper checklist.
