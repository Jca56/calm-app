// Breathing orb — animates expand/contract with paced phase cues.
window.Breath = (function () {
  const orb = document.getElementById('orb');
  const halo = document.getElementById('halo');
  const cue = document.getElementById('cue');
  const countEl = document.getElementById('count');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const patternRow = document.getElementById('patterns');

  const PATTERNS = {
    box:      [['inhale', 4], ['hold', 4], ['exhale', 4], ['hold', 4]],
    '478':    [['inhale', 4], ['hold', 7], ['exhale', 8]],
    extended: [['inhale', 4], ['hold', 2], ['exhale', 7]],
    resonant: [['inhale', 5], ['exhale', 5]],
  };

  const CUSTOM_KEY = 'calm.breath-custom';
  const CUSTOM_MIN = { inhale: 1, hold1: 0, exhale: 1, hold2: 0 };
  const CUSTOM_MAX = 20;

  function loadCustom() {
    try {
      const v = JSON.parse(localStorage.getItem(CUSTOM_KEY));
      if (v && typeof v === 'object') return Object.assign({ inhale: 4, hold1: 4, exhale: 8, hold2: 0 }, v);
    } catch {}
    return { inhale: 4, hold1: 4, exhale: 8, hold2: 0 };
  }

  let customConfig = loadCustom();
  let currentPattern = 'box';
  let running = false;
  let phaseTimer = null;
  let countdownTimer = null;

  const customPanel = document.getElementById('customPanel');
  const customBtn = patternRow.querySelector('button[data-pattern="custom"]');

  function buildCustomSteps() {
    const c = customConfig;
    const steps = [];
    if (c.inhale > 0) steps.push(['inhale', c.inhale]);
    if (c.hold1  > 0) steps.push(['hold',   c.hold1]);
    if (c.exhale > 0) steps.push(['exhale', c.exhale]);
    if (c.hold2  > 0) steps.push(['hold',   c.hold2]);
    return steps;
  }

  function getSteps() {
    return currentPattern === 'custom' ? buildCustomSteps() : PATTERNS[currentPattern];
  }

  function updateCustomUI() {
    document.getElementById('customInhale').textContent = customConfig.inhale;
    document.getElementById('customHold1').textContent  = customConfig.hold1;
    document.getElementById('customExhale').textContent = customConfig.exhale;
    document.getElementById('customHold2').textContent  = customConfig.hold2;
    const c = customConfig;
    const parts = [c.inhale];
    if (c.hold1 > 0) parts.push(c.hold1);
    parts.push(c.exhale);
    if (c.hold2 > 0) parts.push(c.hold2);
    customBtn.textContent = `Custom · ${parts.join('-')}`;
  }

  function setOrbState(state, durationSec) {
    orb.style.transitionDuration = durationSec + 's';
    halo.style.transitionDuration = durationSec + 's';
    orb.classList.remove('expand', 'contract');
    halo.classList.remove('expand', 'contract');
    if (state === 'inhale') {
      orb.classList.add('expand');
      halo.classList.add('expand');
    } else if (state === 'exhale') {
      orb.classList.add('contract');
      halo.classList.add('contract');
    }
  }

  function showCue(text) {
    cue.classList.remove('visible');
    setTimeout(() => {
      cue.textContent = text;
      cue.classList.add('visible');
    }, 200);
  }

  function runCountdown(seconds) {
    let remaining = seconds;
    countEl.textContent = remaining;
    clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        countEl.textContent = '';
        clearInterval(countdownTimer);
      } else {
        countEl.textContent = remaining;
      }
    }, 1000);
  }

  function runPhase(steps, idx) {
    if (!running) return;
    const [phase, seconds] = steps[idx];
    const labels = { inhale: 'Inhale', exhale: 'Exhale', hold: 'Hold' };
    showCue(labels[phase]);
    setOrbState(phase, seconds);
    runCountdown(seconds);
    phaseTimer = setTimeout(() => {
      runPhase(steps, (idx + 1) % steps.length);
    }, seconds * 1000);
  }

  function start() {
    if (running) return;
    const steps = getSteps();
    if (steps.length === 0) return;
    running = true;
    startBtn.textContent = 'Running…';
    startBtn.disabled = true;
    runPhase(steps, 0);
  }

  function stop() {
    running = false;
    clearTimeout(phaseTimer);
    clearInterval(countdownTimer);
    startBtn.textContent = 'Start';
    startBtn.disabled = false;
    countEl.textContent = '';
    showCue('Rest');
    setOrbState('exhale', 3);
  }

  startBtn.addEventListener('click', start);
  stopBtn.addEventListener('click', stop);

  patternRow.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-pattern]');
    if (!btn) return;
    currentPattern = btn.dataset.pattern;
    [...patternRow.querySelectorAll('button')].forEach(b => b.classList.toggle('active', b === btn));
    customPanel.hidden = currentPattern !== 'custom';
    if (running) {
      stop();
      setTimeout(start, 400);
    }
  });

  customPanel.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-step]');
    if (!btn) return;
    const key = btn.dataset.step;
    const delta = parseInt(btn.dataset.delta, 10);
    customConfig[key] = Math.max(CUSTOM_MIN[key], Math.min(CUSTOM_MAX, customConfig[key] + delta));
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(customConfig));
    updateCustomUI();
    if (running && currentPattern === 'custom') {
      stop();
      setTimeout(start, 400);
    }
  });

  updateCustomUI();

  setOrbState('exhale', 1);
  showCue('Ready');

  return {
    start, stop,
    toggle() { running ? stop() : start(); },
  };
})();
