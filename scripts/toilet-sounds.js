(function () {
  'use strict';

  const MOD_ID = 'bathroom-break';
  const SOUND_DIR = (window.__modAssets?.[MOD_ID] ?? './assets') + '/furniture/TOILET/sounds/';
  const SOUND_FILES = [
    'ElevenLabs_short_poop_fart.mp3',
    'ElevenLabs_very_low,_deep,_bassy_and_long_fart.mp3',
    'ElevenLabs_Comedy_scene_extreme_explosive_diarrhea_gushing_and_big_wet_farting_sounds.mp3',
  ];

  const COOLDOWN_MS = 4000;

  let audioCtx = null;
  let buffers = [];
  let soundsReady = false;
  let lastPlayedAt = 0;
  let lastSoundDurationMs = 0;

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
    lastSoundDurationMs = src.buffer.duration * 1000;
    src.connect(audioCtx.destination);
    src.start(0);
  }

  function ensureAudioReady() {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  }
  document.addEventListener('click', ensureAudioReady, { once: false });
  document.addEventListener('keydown', ensureAudioReady, { once: false });

  document.addEventListener('bathroom-break:seated', playRandom);

  window.__toiletSounds = {
    getLastSoundDurationMs: () => lastSoundDurationMs
  };

  loadSounds().catch(() => {});
  console.log('[toilet-sounds] Mod loaded — waiting for bathroom-break:seated events');
})();
