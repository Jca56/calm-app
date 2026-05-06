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
    resonant: [['inhale', 5], ['exhale', 5]],
  };

  let currentPattern = 'box';
  let running = false;
  let phaseTimer = null;
  let countdownTimer = null;

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
    running = true;
    startBtn.textContent = 'Running…';
    startBtn.disabled = true;
    runPhase(PATTERNS[currentPattern], 0);
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
    if (running) {
      stop();
      setTimeout(start, 400);
    }
  });

  setOrbState('exhale', 1);
  showCue('Ready');

  return {
    start, stop,
    toggle() { running ? stop() : start(); },
  };
})();
