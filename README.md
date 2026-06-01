# Bathroom Break

A mod for [pixel-agents](https://github.com/rkalajian/pixel-agents) that gives idle agents the urge to use the bathroom.

## What it does

- Idle agents randomly walk to the toilet (~once every 5 minutes per agent)
- Agents pixel-align to the toilet seat on arrival
- Agents stay for the duration of the toilet sound plus 1 second, then return to their original seat
- If an agent becomes active mid-break, they return immediately
- Random toilet sounds play when a character sits down
- Place a toilet to enable the behavior; remove it to disable

## Furniture

| Item | Category | Notes |
|---|---|---|
| Toilet | Chairs | Required for break behavior |
| Sink | Misc | Decorative |
| Bathmat | Decor | Decorative |
| Bathroom Shelf | Wall | Mountable on walls |

## Mod compatibility

### pixel-agents-bloody-chunks-mod

When the [bloody-chunks mod](../pixel-agents-bloody-chunks-mod) is also installed, agents deleted while sitting on a toilet will explode in **brown** instead of red. Enabled automatically; no setup required.

## Manual trigger

```js
window.__bathroomBreakMod.forceBathroomBreak()
```

Sends the first eligible idle agent to the toilet immediately. Returns `false` if no eligible agent or no free toilet.

## Installation

pixel-agents has a built-in mod loader that discovers mods from `~/.claude/pixel-agents-mods/`.

**1. Place the mod**

Clone or copy this repo to `~/.claude/pixel-agents-mods/bathroom-break/`.

**2. Reload Pixel Agents**

Reload the panel in VS Code (close and reopen, or run `Developer: Reload Window`).

That's it. The extension auto-loads scripts, furniture assets, and sounds from the mod directory. No patching, no file copying, no config edits required. After a pixel-agents extension update, just reload.

## Notes

- Sounds generated with [ElevenLabs](https://elevenlabs.io)
- Source: [github.com/rkalajian/pixel-agents-bathroom-break-mod](https://github.com/rkalajian/pixel-agents-bathroom-break-mod)
