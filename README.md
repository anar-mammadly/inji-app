# Inji

Inji ("pearl" in Azerbaijani) is a small productivity app. Every task you finish drops a pearl into a glass jar, so a day's work is something you can see.

It runs in the browser. Without an account everything stays on your device; with one, your data follows you across devices.

## What is in it

- **Board** — a Kanban board (to do, in progress, done) per board you create. Move tasks with their buttons, by dragging, or from the keyboard (focus a task, Space to pick it up, arrow keys, Space to drop).
- **Jar and goals** — one pearl per finished task, a daily and a weekly goal, and a streak of consecutive active days. The jar draws up to 30 pearls; the count keeps going.
- **Focus session** — a run of focus blocks (four of 25 minutes by default) with movement breaks between them. A block does not end by itself: when its time is up the clock runs into overtime until you press **Stand up**, with reminders that come further and further apart and one "5 more minutes". A break fills one pearl on the session's string in proportion to how much of it you really took; a long break follows every fourth block. When the string is full the session is summarised. Lengths are adjustable, sounds can be muted for an hour, and it all keeps running whichever page you are on.
- **Sədəf, the companion** — a pearl resting in a shell of water. Call her onto the screen, drag her anywhere, make her bigger or smaller, or (in Chrome, Edge and Brave on a computer) move her into a window of her own that stays on top of everything and can be placed and resized like any window. She is quiet while you focus. When a block is over and you stay seated she dries out: the water in her shell sinks away, the shell pales and cracks, the pearl turns matte; then the shell starts to close, and after about fifty minutes it shuts. Standing up brings the water back. During a break she suggests something to do, a walk or, if you are staying at your desk, a stretch. She has a few sounds of her own, and speaks Azerbaijani or English with the rest of the app.
- **Around the timer** — the tab title shows the clock; on phones the screen stays awake during a session; with permission, a notification says when time is up while the tab is in the background; "Notice when I get up" (Chromium, desktop) starts the break by itself after three minutes away from the computer; a finished session can be shared as an image.
- **Plan** — a week of days, each with its own to-dos and optional times, plus goals with progress.
- **Calendar** — events per day.
- **Habits** — a chain of days per habit, with a target length.
- **Learning** — goals for books, courses and skills, optional reminders, and a Markdown journal.
- **Notes** — sticky notes.
- **Statistics** — finished tasks by category and by board, and finished focus sessions.
- **Profile** — name, photo, email, password, and deleting the account.
- Azerbaijani and English. The clock and "today" follow Baku time.

## Tech

React 18 and Vite, Tailwind CSS, Framer Motion, dnd-kit, Supabase (auth, one `user_data` row of JSON per user, a storage bucket for avatars). All sounds are synthesized with the Web Audio API; there are no audio or image files — the companion is drawn in SVG.

## Getting started

```bash
npm install
npm run dev
```

Open the URL it prints. The app works as a guest straight away.

For accounts and sync, create a Supabase project, then:

1. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. In the Supabase SQL Editor run `supabase/schema.sql`, then `supabase/profiles.sql`.
3. Under Authentication → URL Configuration, add your site's address (with a trailing slash) to the redirect URLs.

Both SQL files can be run again on an existing project; they only add what is missing. **If you are updating a project set up with an earlier version, run both again** — they add the delete policies, the avatar limits and the `delete_own_account` function that Profile → Delete account calls.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` | ESLint |

GitHub Actions runs lint, tests and a build on every push and pull request (`.github/workflows/ci.yml`).

## How saving works

The whole app state is one object. It is cached in `localStorage` and, for a signed-in user, stored in their `user_data` row.

- **Saves are conditional.** Each save names the server version it was based on (the row's `updated_at`) and is only accepted if that is still the current version. A tab left open on one device therefore cannot overwrite what another device saved in the meantime.
- **Conflicts are replayed, not dropped.** Edits are kept as functions until the server has them. If a save is refused, the app fetches the fresh copy and applies those edits on top of it.
- **Nothing is assumed saved.** Edits are written to the device immediately and sent after a short pause. If sending fails, the sidebar says so, the app retries with a back-off, and pressing the status tries again at once.
- **Guest data is never silently lost.** Logging in to a new account seeds it with what you made as a guest; logging in to an account that already has data asks whether to add it.
- **Logging out clears the device.** The account's cached copy is removed from the browser.

One limit remains: if a page is reloaded while it still has unsent edits *and* another device saved in between, the more recent of the two copies wins.

The logic lives in `src/lib/syncEngine.js` (no React, no DOM) and is covered by `src/lib/syncEngine.test.js`.

## Project layout

```
src/
  App.jsx                 app shell and wiring
  components/             pages and UI
  companion/              Sədəf: character drawing, behaviour, lines
  hooks/                  one store hook per feature, timer, profile
  lib/                    sync engine, Supabase adapter, state rules
  i18n/                   translations (az, en)
  utils/                  dates (Baku), colours, sound, ids
supabase/                 SQL for the database and storage
```

To change how the companion looks, edit `src/companion/CompanionCharacter.jsx`; what it says is in `src/companion/lines.js`.
The rules of the focus session (overtime, wear stages, reminders, how breaks fill the run) are in `src/lib/focusRun.js`, with tests beside it.

Add `?fast` to the address to run a minute in a second and try a whole session quickly.

## Deploy

`wrangler.jsonc` serves `dist/` as a single-page app on Cloudflare. Set the two `VITE_` variables in the build environment.
