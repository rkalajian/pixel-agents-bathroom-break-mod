# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A mod for **pixel-agents** — a browser-based agent simulation. The mod adds bathroom break behavior to idle agents and toilet sound effects. No build step, no dependencies, no tests. Plain browser JS loaded by the pixel-agents mod loader.

## Engine Access

pixel-agents v1.3.0 has no script mod loader. The engine is exposed via a one-line patch to the compiled webview JS:

**File**: `dist/webview/assets/index-BUrEakFE.js`  
**Patch**: append `window.__pixelAgentsJr=Jr;` immediately after `Jr={current:null}` (the module-level engine ref).

`window.__pixelAgentsJr.current` is the live engine (null until first use; `bathroom-break.js` polls until ready).

`window.__modAssets` does NOT exist — `toilet-sounds.js` falls back to `'./assets'` (relative to webview root, which resolves to the extension's `dist/webview/assets/`).

The engine exposes: `characters` (Map<id, char>), `seats` (Map<uid, seat>), `layout.furniture[]`, `reassignSeat(agentId, seatId)`, `findFreeSeat()`.

Character shape: `{ isActive, isSubagent, state ('idle'|...), seatId }`. Seat shape: `{ assigned: boolean }`.

## Architecture

Two independent IIFEs, each self-contained:

**`scripts/bathroom-break.js`** — agent behavior logic
- Polls `window.__pixelAgentsJr.current` every 500ms until engine ready, then sets a 5s tick
- Skips active/subagent characters; only targets `state === 'idle'`
- Toilet identified by `furniture.type === 'TOILET'`; seat reuse via `furniture.uid`
- Break state tracked in module-level `Map agentsOnBreak` (agentId → `{ originalSeatId, timer }`)
- Exposes `window.__bathroomBreakMod.forceBathroomBreak()` for manual triggering

**`scripts/toilet-sounds.js`** — event-driven audio
- Listens for `bathroom-break:seated` custom DOM event (dispatched by `bathroom-break.js`)
- Loads MP3s from `./assets/furniture/TOILET/sounds/` (relative to webview root) via Web Audio API
- Plays random buffer on each event; 4s cooldown prevents stacking

## Furniture Assets

Each furniture item lives in `assets/furniture/<ID>/` with `manifest.json` and `<ID>.png`. Key fields: `category`, `width`/`height` (px), `footprintW`/`footprintH` (tiles), `canPlaceOnWalls`, `backgroundTiles`.

The TOILET must use `"category": "chairs"` so the engine registers it as a seatable — this is what makes `eng.seats.get(toilet.uid)` work.

## Key Constants (bathroom-break.js)

| Constant | Value | Effect |
|---|---|---|
| `BREAK_CHANCE_PER_SEC` | 0.003 | ~1 break per 5 min per idle agent |
| `BREAK_DURATION_MIN/MAX` | 30–90s | Random break duration |
| `CHECK_INTERVAL_MS` | 5000 | Tick frequency |

## Installation (pixel-agents v1.3.0 — no mod loader)

Four manual steps, must redo after extension update:

1. **Furniture assets** — `~/.pixel-agents/config.json`:
   ```json
   { "externalAssetDirectories": ["/path/to/pixel-agents-bathroom-break-mod"] }
   ```
   Extension appends `assets/furniture` to each dir; TOILET/SINK/BATHMAT/BATHROOM_SHELF appear in palette.

2. **Engine exposure** — patch `dist/webview/assets/index-BUrEakFE.js`:
   Find `Jr={current:null}` and append `window.__pixelAgentsJr=Jr;` immediately after.
   (`Jr` is the module-level engine ref; variable name may change across extension versions.)

3. **Sound files** — copy `assets/furniture/TOILET/sounds/*.mp3` to `dist/webview/assets/furniture/TOILET/sounds/`.

4. **Script injection** — add to `dist/webview/index.html` before `</head>`:
   ```html
   <script type="module" src="./assets/bathroom-break.js"></script>
   <script type="module" src="./assets/toilet-sounds.js"></script>
   ```
   Also copy `scripts/bathroom-break.js` → `dist/webview/assets/bathroom-break.js` and same for `toilet-sounds.js`.

The `dist/webview/` root is inside the VS Code extension directory (e.g. `~/.var/app/com.visualstudio.code/data/vscode/extensions/pablodelucca.pixel-agents-<version>/`).

## Claude Code Settings

`.claude/settings.local.json` grants `Bash(*)` — all shell commands run without permission prompts in this repo.
