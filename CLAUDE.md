# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A mod for **pixel-agents** — a browser-based agent simulation. The mod adds bathroom break behavior to idle agents and toilet sound effects. No build step, no dependencies, no tests. Plain browser JS loaded by the pixel-agents mod loader.

## Mod Loader Contract

The mod loader provides:
- `window.__pixelAgentsJr.current` — live engine reference (may be null on startup; poll until ready)
- `window.__modAssets[modId]` — base URL for this mod's assets

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

**`scripts/toilet-sounds.js`** — canvas-interception audio trigger
- Wraps `CanvasRenderingContext2D.prototype.drawImage` to detect sprite positions each frame
- Toilet sprite matched by fixed aspect ratio (10:22, `dh * 10 === dw * 22`)
- Character sprites matched by 2:1 height:width ratio
- Proximity check scaled by zoom factor (`PROXIMITY * t.scale`)
- Drives `requestAnimationFrame` loop; `occupied` flag prevents repeat triggers on same sit

## Furniture Assets

Each furniture item lives in `assets/furniture/<ID>/` with `manifest.json` and `<ID>.png`. Key fields: `category`, `width`/`height` (px), `footprintW`/`footprintH` (tiles), `canPlaceOnWalls`, `backgroundTiles`.

The TOILET must use `"category": "chairs"` so the engine registers it as a seatable — this is what makes `eng.seats.get(toilet.uid)` work.

## Key Constants (bathroom-break.js)

| Constant | Value | Effect |
|---|---|---|
| `BREAK_CHANCE_PER_SEC` | 0.003 | ~1 break per 5 min per idle agent |
| `BREAK_DURATION_MIN/MAX` | 30–90s | Random break duration |
| `CHECK_INTERVAL_MS` | 5000 | Tick frequency |

## Deployment

Drop the mod directory into the pixel-agents mod folder; the loader reads `manifest.json`, injects scripts, and serves assets under `window.__modAssets['bathroom-break']`.
