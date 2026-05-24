# Bathroom Break

A mod for [pixel-agents](https://github.com/rkalajian/pixel-agents) that gives idle agents the urge to use the bathroom.

## What it does

- Idle agents randomly walk to the toilet (~once every 5 minutes per agent)
- Agents pixel-align to the toilet seat on arrival
- Agents stay 30–90 seconds, then return to their original seat
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

Drop the `bathroom-break/` folder into your pixel-agents mods directory. The mod loader handles the rest.

## Notes

- Sounds generated with [ElevenLabs](https://elevenlabs.io)
- Source: [github.com/rkalajian/pixel-agents-bathroom-break-mod](https://github.com/rkalajian/pixel-agents-bathroom-break-mod)
