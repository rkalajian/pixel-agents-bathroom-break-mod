(function () {
  'use strict';

  // toilet-sounds mod for pixel-agents
  // Plays a random fart/poop sound whenever a character sits on the toilet.
  // Detection: intercepts drawImage calls, matches toilet sprite (10×22) proximity
  // to character sprites (1:2 aspect ratio) each animation frame.

  const MOD_ID = 'bathroom-break';
  const SOUND_DIR = (window.__modAssets?.[MOD_ID] ?? './assets') + '/furniture/TOILET/sounds/';
  const SOUND_FILES = [
    'ElevenLabs_short_poop_fart.mp3',
    'ElevenLabs_very_low,_deep,_bassy_and_long_fart.mp3',
    'ElevenLabs_Comedy_scene_extreme_explosive_diarrhea_gushing_and_big_wet_farting_sounds.mp3',
  ];

  // px tolerance for "character center near toilet center" check (same coordinate space as drawImage args)
  const PROXIMITY = 48;
  // minimum ms between sound plays (per sit-down event)
  const COOLDOWN_MS = 4000;

  let audioCtx = null;
  let buffers = [];
  let soundsReady = false;
  let lastPlayedAt = 0;
  let occupied = false;

  // Collected each animation frame, cleared at end of tick()
  let toiletCenters = [];
  let charCenters = [];

  // --- Audio ---

  async function loadSounds() {
    audioCtx = new AudioContext();
    const results = await Promise.all(
      SOUND_FILES.map(f =>
        fetch(SOUND_DIR + f)
          .then(r => r.arrayBuffer())
          .then(b => audioCtx.decodeAudioData(b))
          .catch(e => { console.warn('[toilet-sounds] Failed to load', f, e); return null; })
      )
    );
    buffers = results.filter(Boolean);
    soundsReady = buffers.length > 0;
    console.log(`[toilet-sounds] ${buffers.length}/${SOUND_FILES.length} sounds loaded from ${SOUND_DIR}`);
  }

  function playRandom() {
    if (!soundsReady || buffers.length === 0) return;
    const now = Date.now();
    if (now - lastPlayedAt < COOLDOWN_MS) return;
    lastPlayedAt = now;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const src = audioCtx.createBufferSource();
    src.buffer = buffers[Math.floor(Math.random() * buffers.length)];
    src.connect(audioCtx.destination);
    src.start(0);
  }

  // --- Canvas intercept ---

  const origDrawImage = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (...args) {
    const result = origDrawImage.apply(this, args);
    if (args.length === 3) {
      const img = args[0];
      const dw = img.width  || img.naturalWidth  || 0;
      const dh = img.height || img.naturalHeight || 0;
      const dx = args[1];
      const dy = args[2];
      if (dx === 0 && dy === 0) return result;

      // Toilet sprite: base 10×22, scaled by zoom — match by aspect ratio (10:22)
      if (dw >= 8 && dh * 10 === dw * 22) {
        toiletCenters.push({ x: dx + dw * 0.5, y: dy + dh * 0.5, scale: dw / 10 });
      }
      // Character sprites: height exactly 2× width, any zoom
      if (dh === dw * 2 && dw > 4) {
        charCenters.push({ x: dx + dw * 0.5, y: dy + dh * 0.5 });
      }
    }
    return result;
  };

  // --- Per-frame detection ---

  function tick() {
    requestAnimationFrame(tick);

    if (!soundsReady || toiletCenters.length === 0) {
      toiletCenters = [];
      charCenters = [];
      occupied = false;
      return;
    }

    let isSitting = false;
    outer: for (const t of toiletCenters) {
      const prox = PROXIMITY * t.scale; // scale proximity with zoom
      for (const c of charCenters) {
        if (Math.abs(c.x - t.x) < prox && Math.abs(c.y - t.y) < prox) {
          isSitting = true;
          break outer;
        }
      }
    }

    if (isSitting && !occupied) {
      occupied = true;
      playRandom();
    } else if (!isSitting) {
      occupied = false;
    }

    toiletCenters = [];
    charCenters = [];
  }

  // --- Init ---

  loadSounds().catch(() => {});
  requestAnimationFrame(tick);
  console.log('[toilet-sounds] Mod loaded — toilet occupancy detection active');
})();
