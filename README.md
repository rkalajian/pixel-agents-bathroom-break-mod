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

This mod requires [pixel-agents-mod-loader](https://github.com/rkalajian/pixel-agents-mod-loader) to be installed. Follow the mod-loader installation instructions first.

The mod should live in `~/.pixel-agents/mods/bathroom-break/`.

**1. Register furniture assets**

Create or edit `~/.pixel-agents/config.json`:

```json
{
  "externalAssetDirectories": ["/path/to/pixel-agents-bathroom-break-mod"]
}
```

This makes TOILET, SINK, BATHMAT, and BATHROOM_SHELF appear in the furniture palette.

**2. Find the extension directory**

```
~/.var/app/com.visualstudio.code/data/vscode/extensions/pablodelucca.pixel-agents-<version>/dist/webview/
```

(On macOS/Windows the path differs; check VS Code extension install location.)

**3. Expose the engine**

In `dist/webview/assets/index-BUrEakFE.js` (filename may change across versions), find:

```
Jr={current:null}
```

Append `window.__pixelAgentsJr=Jr;` immediately after that line. The variable name `Jr` may differ — search for `{current:null},` followed by `new Ir;function` to locate it.

**4. Copy sounds**

```
cp assets/furniture/TOILET/sounds/*.mp3 \
  <extension>/dist/webview/assets/furniture/TOILET/sounds/
```

**5. Copy scripts and patch index.html**

```
cp scripts/bathroom-break.js <extension>/dist/webview/assets/
cp scripts/toilet-sounds.js  <extension>/dist/webview/assets/
```

Add before `</head>` in `dist/webview/index.html`:

```html
<script type="module" src="./assets/bathroom-break.js"></script>
<script type="module" src="./assets/toilet-sounds.js"></script>
```

**6. Reload Pixel Agents**

Reload the panel in VS Code (close and reopen, or run `Developer: Reload Window`).

## Notes

- Sounds generated with [ElevenLabs](https://elevenlabs.io)
- Source: [github.com/rkalajian/pixel-agents-bathroom-break-mod](https://github.com/rkalajian/pixel-agents-bathroom-break-mod)
