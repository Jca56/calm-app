// Ambient sound synthesis — all generated live, no audio files.
window.Sounds = (function () {
  let ctx = null;
  let masterGain = null;
  const channels = {};
  let whiteBuffer = null;
  let brownBuffer = null;

  function ensureContext() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.9;
    masterGain.connect(ctx.destination);

    const sr = ctx.sampleRate;
    const len = sr * 4;

    whiteBuffer = ctx.createBuffer(1, len, sr);
    const wd = whiteBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) wd[i] = Math.random() * 2 - 1;

    brownBuffer = ctx.createBuffer(1, len, sr);
    const bd = brownBuffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      bd[i] = last * 3.5;
    }
  }

  function makeNoiseSource(buffer) {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.start();
    return src;
  }

  function buildRain() {
    const src = makeNoiseSource(whiteBuffer);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2200; lp.Q.value = 0.7;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 400;
    const g = ctx.createGain(); g.gain.value = 0;
    src.connect(hp).connect(lp).connect(g).connect(masterGain);
    return { gain: g };
  }

  function buildWaves() {
    const src = makeNoiseSource(whiteBuffer);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 600;
    const g = ctx.createGain(); g.gain.value = 0;

    const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.5;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 1 / 9;
    const lfoDepth = ctx.createGain(); lfoDepth.gain.value = 0.5;
    lfo.connect(lfoDepth).connect(lfoGain.gain);
    lfo.start();

    src.connect(lp).connect(g).connect(lfoGain).connect(masterGain);
    return { gain: g };
  }

  function buildWind() {
    const src = makeNoiseSource(whiteBuffer);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 1.2;
    const g = ctx.createGain(); g.gain.value = 0;

    const lfo = ctx.createOscillator(); lfo.frequency.value = 1 / 13;
    const lfoDepth = ctx.createGain(); lfoDepth.gain.value = 250;
    lfo.connect(lfoDepth).connect(bp.frequency);
    lfo.start();

    src.connect(bp).connect(g).connect(masterGain);
    return { gain: g };
  }

  function buildFire() {
    const src = makeNoiseSource(brownBuffer);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 200;
    const g = ctx.createGain(); g.gain.value = 0;
    src.connect(hp).connect(g).connect(masterGain);

    let crackleTimer = null;
    function scheduleCrackle() {
      const level = g.gain.value;
      if (level > 0.01) {
        const dur = 0.04 + Math.random() * 0.08;
        const cs = ctx.createBufferSource();
        cs.buffer = whiteBuffer;
        const cg = ctx.createGain();
        const peak = level * (0.4 + Math.random() * 0.6);
        const now = ctx.currentTime;
        cg.gain.setValueAtTime(0, now);
        cg.gain.linearRampToValueAtTime(peak, now + 0.005);
        cg.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        const cf = ctx.createBiquadFilter();
        cf.type = 'bandpass';
        cf.frequency.value = 1500 + Math.random() * 2500;
        cf.Q.value = 4;
        cs.connect(cf).connect(cg).connect(masterGain);
        cs.start(now);
        cs.stop(now + dur + 0.05);
      }
      crackleTimer = setTimeout(scheduleCrackle, 80 + Math.random() * 600);
    }
    scheduleCrackle();
    return { gain: g };
  }

  function buildBrown() {
    const src = makeNoiseSource(brownBuffer);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 500;
    const g = ctx.createGain(); g.gain.value = 0;
    src.connect(lp).connect(g).connect(masterGain);
    return { gain: g };
  }

  const builders = { rain: buildRain, waves: buildWaves, wind: buildWind, fire: buildFire, brown: buildBrown };

  function setLevel(name, value01) {
    ensureContext();
    if (ctx.state === 'suspended') ctx.resume();
    if (!channels[name]) channels[name] = builders[name]();
    const ch = channels[name];
    const now = ctx.currentTime;
    ch.gain.gain.cancelScheduledValues(now);
    ch.gain.gain.setTargetAtTime(value01, now, 0.15);
  }

  return { setLevel };
})();
