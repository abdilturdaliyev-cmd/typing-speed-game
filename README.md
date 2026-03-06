# TypeSpeed

TypeSpeed is a modular typing game built with vanilla HTML, CSS, and JavaScript (ES modules).
It focuses on clean architecture, responsive per-character feedback, and a polished UI that is easy to extend.

## Project Overview

The game supports both quote runs and timed sessions, with real-time stats, countdown start, progress tracking, and local best-score persistence.
It is a static frontend project that runs in any modern browser.

## Current Features

- Modular architecture with clear separation of concerns
- Countdown start (`3 -> 2 -> 1 -> Go`)
- Per-character rendering and highlighting
- Strict per-index correctness comparison
- Optional `Stop on error` mode for stricter practice
- Session modes:
  - `Quote` mode (single quote completion)
  - `30s` timed mode
  - `60s` timed mode
- Quote categories:
  - `All`
  - `Coding`
  - `Motivational`
  - `General`
- Progress bar with ghost marker support
- Ghost pace replay (quote mode)
- Real-time stats:
  - WPM
  - Time
  - Accuracy
- Results panel with mode-aware summary
- Best-score persistence via `localStorage`
  - Best WPM
  - Best Accuracy
  - Best Time
- Keyboard shortcuts:
  - `Escape` resets the round
  - `Enter` starts a new round when idle/finished
- Auto-resizing input field to avoid typing scrollbars
- Dark glassmorphism design with purple accent styling

## Project Structure

```text
typing-speed-game/
|-- index.html
|-- css/
|   `-- style.css
`-- js/
    |-- data.js
    |-- game.js
    |-- ui.js
    `-- main.js
```

## Architecture Responsibilities

- `js/data.js`
  - Quote dataset and categories
- `js/game.js`
  - Game state and timing lifecycle
  - Session mode logic (`quote`, `30s`, `60s`)
  - Scoring (WPM, accuracy, time)
  - Best-score and ghost persistence
- `js/ui.js`
  - DOM rendering and UI updates
  - Character highlight rendering
  - Settings controls and result rendering
- `js/main.js`
  - Orchestration and event wiring

## How to Run Locally

Because this project uses ES modules, run it through a local server.

### Option 1: VS Code Live Server

1. Open the project in VS Code.
2. Install the Live Server extension.
3. Right-click `index.html`.
4. Click **Open with Live Server**.

### Option 2: Python

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Controls

- Click **Start** to begin
- Click **Restart** to reset
- `Escape`: reset current round
- `Enter`: start a new round when not actively playing

## Supported Modes

- `Quote`
  - Type a single quote as accurately and quickly as possible.
  - Ghost pace marker is available in this mode.
- `30s` / `60s`
  - Timed sessions that continue serving new quotes when one is completed.
  - Session ends automatically when the timer expires.

## Quote Categories

Use the category selector (in quote mode) to focus on:

- All
- Coding
- Motivational
- General

If a category has no valid entries, the game safely falls back to `All`.

## Best-Score Persistence

Best scores are saved in browser `localStorage` and survive page reloads:

- Best WPM
- Best Accuracy
- Best Time

## Ghost Mode

Ghost mode stores progress-over-time from your best quote run and replays it as a thin marker on the progress bar.
This gives you a pace reference for future quote runs.

## Future Improvements

- Per-mode leaderboards
- More quote packs and difficulty presets
- Optional custom quote import
- Better accessibility presets (font size/contrast toggles)
- Optional sound cues and streak indicators

## Author

Abdil Turdaliyev
