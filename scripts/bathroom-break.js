(function () {
  'use strict';

  // bathroom-break mod for pixel-agents
  // Idle agents occasionally take a bathroom break when a toilet is placed.

  const BREAK_CHANCE_PER_SEC = 0.003; // ~1 break per ~5 min per idle agent
  const BREAK_DURATION_MIN = 30;      // seconds
  const BREAK_DURATION_MAX = 90;      // seconds
  const CHECK_INTERVAL_MS = 5000;

  // Toilet sprite is 10×22px; tile is 16×16px.
  // Center sprite on tile: x offset = 5 (vs tile center 8).
  // Bottom-align with sprite (22px tall, TYPE state adds 6px offset in renderer):
  //   render bottom = char.y + 6 → want = seatRow*16 + 22 → char.y = seatRow*16 + 16 = seatRow*16
  //   (since seatRow = toilet.row+1, seatRow*16 = toilet.row*16+16)
  const TOILET_SEAT_X_OFFSET = 5; // center on 10px sprite (vs default tile center 8)
  const TOILET_SEAT_Y_OFFSET = 0; // seatRow*16 + 0 (default fr gives seatRow*16 + 8)

  // agentId → { originalSeatId, timer, positioned }
  const agentsOnBreak = new Map();

  function engine() {
    return window.__pixelAgentsJr?.current ?? null;
  }

  function getToilets(eng) {
    return (eng?.layout?.furniture ?? []).filter(f => f.type === 'TOILET');
  }

  function pickFreeToiletSeatId(eng) {
    for (const toilet of getToilets(eng)) {
      const seat = eng.seats.get(toilet.uid);
      if (seat && !seat.assigned) return toilet.uid;
    }
    return null;
  }

  function applyToiletPosition(agentId, toiletSeatId, eng) {
    let attempts = 0;
    const poller = setInterval(() => {
      const char = eng.characters.get(agentId);
      if (!char || char.seatId !== toiletSeatId || ++attempts > 60) {
        clearInterval(poller);
        return;
      }
      if (char.state !== 'walk') {
        const seat = eng.seats.get(toiletSeatId);
        if (seat) {
          char.x = seat.seatCol * 16 + TOILET_SEAT_X_OFFSET;
          char.y = seat.seatRow * 16 + TOILET_SEAT_Y_OFFSET;
        }
        clearInterval(poller);
        const breakData = agentsOnBreak.get(agentId);
        if (breakData) breakData.positioned = true;
        document.dispatchEvent(new CustomEvent('bathroom-break:seated', { detail: { agentId } }));
      }
    }, 500);
  }

  function endBreak(agentId, originalSeatId) {
    agentsOnBreak.delete(agentId);
    const eng = engine();
    if (!eng) return;
    const char = eng.characters.get(agentId);
    if (!char) return;

    // Current toilet seatId must be released. Try original seat first.
    const origSeat = originalSeatId ? eng.seats.get(originalSeatId) : null;
    if (origSeat && !origSeat.assigned) {
      eng.reassignSeat(agentId, originalSeatId);
    } else {
      const free = eng.findFreeSeat();
      if (free) eng.reassignSeat(agentId, free);
      // If no seat free, agent keeps toilet until one opens — acceptable edge case.
    }

    console.log(`[bathroom-break] Agent ${agentId} back from break`);
  }

  function tryStartBreak(agentId, eng) {
    const char = eng.characters.get(agentId);
    if (!char || char.isActive) return;
    if (char.state !== 'idle') return;

    const toiletSeatId = pickFreeToiletSeatId(eng);
    if (!toiletSeatId) return; // toilet full or not placed

    const originalSeatId = char.seatId;

    eng.reassignSeat(agentId, toiletSeatId);

    // Verify reassignment worked
    const after = eng.characters.get(agentId);
    if (!after || after.seatId !== toiletSeatId) return;

    const duration = BREAK_DURATION_MIN + Math.random() * (BREAK_DURATION_MAX - BREAK_DURATION_MIN);
    console.log(`[bathroom-break] Agent ${agentId} → toilet for ${Math.round(duration)}s`);

    const timer = setTimeout(() => endBreak(agentId, originalSeatId), duration * 1000);
    agentsOnBreak.set(agentId, { originalSeatId, timer, positioned: false });

    applyToiletPosition(agentId, toiletSeatId, eng);
  }

  function tick() {
    const eng = engine();
    if (!eng || getToilets(eng).length === 0) return;

    const intervalSec = CHECK_INTERVAL_MS / 1000;
    // P(at least one break event in interval) per agent
    const breakProb = 1 - Math.pow(1 - BREAK_CHANCE_PER_SEC, intervalSec);

    for (const [agentId, char] of eng.characters) {
      if (agentsOnBreak.has(agentId)) {
        // Agent became active mid-break → send back immediately
        if (char.isActive) {
          const { timer, originalSeatId } = agentsOnBreak.get(agentId);
          clearTimeout(timer);
          agentsOnBreak.delete(agentId);
          // Don't reassign while active — let the game's seat logic handle return to desk.
          // But we need to free the toilet seat for others.
          const toiletSeat = eng.seats.get(char.seatId);
          if (toiletSeat && toiletSeat.assigned) toiletSeat.assigned = false;
          const origSeat = originalSeatId ? eng.seats.get(originalSeatId) : null;
          if (origSeat && !origSeat.assigned) {
            origSeat.assigned = true;
            char.seatId = originalSeatId;
          } else {
            const free = eng.findFreeSeat();
            if (free) { eng.seats.get(free).assigned = true; char.seatId = free; }
            else char.seatId = null;
          }
        }
        continue;
      }

      if (char.isActive) continue;
      if (char.state !== 'idle') continue;

      if (Math.random() < breakProb) {
        tryStartBreak(agentId, eng);
      }
    }
  }

  function forceBathroomBreak() {
    const eng = engine();
    if (!eng) { console.warn('[bathroom-break] Engine not ready'); return false; }
    if (getToilets(eng).length === 0) { console.warn('[bathroom-break] No toilet placed'); return false; }

    for (const [agentId, char] of eng.characters) {
      if (agentsOnBreak.has(agentId)) continue;
      if (char.isActive) continue;
      const toiletSeatId = pickFreeToiletSeatId(eng);
      if (!toiletSeatId) { console.warn('[bathroom-break] All toilets occupied'); return false; }
      tryStartBreak(agentId, eng);
      return true;
    }
    console.warn('[bathroom-break] No eligible agent found');
    return false;
  }

  window.__bathroomBreakMod = { forceBathroomBreak };

  // Wait for engine to be ready
  const ready = setInterval(() => {
    if (engine()) {
      clearInterval(ready);
      console.log('[bathroom-break] Mod active — agents will take bathroom breaks when a toilet is placed');
      setInterval(tick, CHECK_INTERVAL_MS);
    }
  }, 500);
})();
