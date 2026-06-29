# Inji

Inji ("pearl" in Azerbaijani) is a lightweight productivity app built around a Kanban board and a reward jar: every task you complete drops a bead into a glass jar, giving you a visual sense of daily progress.

No backend, no accounts — everything is stored locally in the browser.

## Features

- **Kanban board** with three columns: TO-DO, In Progress, Done — move tasks with the action buttons or by dragging them between columns.
- **Bead jar** — completing a task animates a bead flying into the jar (with a sound effect), up to a 30-bead daily cap.
- **Categories** — tasks are tagged as study / work / personal via colored pills.
- **Daily & weekly bead goals** with editable targets and progress stats.
- **Streak tracking** — counts consecutive days with at least one completed task.
- **Statistics page** — total completed tasks, a breakdown by category, the list of tasks completed in each category, and a reset option.
- **Pomodoro timer** for focused work sessions.
- **Azerbaijani / English** language toggle.
- **Real-time clock** (Baku timezone) shown in the navbar.
- Fully responsive layout for mobile and desktop.

## Tech stack

- React + Vite
- Tailwind CSS
- Framer Motion (animations)
- Web Audio API (synthesized sound effects, no audio files)
- Browser `localStorage` for persistence

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

## Build

```bash
npm run build
npm run preview
```
