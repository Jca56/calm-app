// Body scan walkthrough — paced attention from head to toes.
window.Scan = (function () {
  const REGIONS = [
    { id: 'head',      name: 'Crown',     prompt: 'The top of your head. Feel the gentle weight of your skull.' },
    { id: 'face',      name: 'Face',      prompt: 'Soften your eyes. Unclench your jaw. Let your tongue rest.' },
    { id: 'neck',      name: 'Neck',      prompt: 'Your neck and throat. Let your head feel heavy on your spine.' },
    { id: 'shoulders', name: 'Shoulders', prompt: 'Drop your shoulders. Notice if they were hiked up.' },
    { id: 'arms',      name: 'Arms',      prompt: 'Arms and hands. Let them feel heavy. Loosen every finger.' },
    { id: 'chest',     name: 'Chest',     prompt: 'Feel your breath rise and fall. No need to deepen it.' },
    { id: 'belly',     name: 'Belly',     prompt: 'Let your belly soften completely. Nothing to hold.' },
    { id: 'hips',      name: 'Hips',      prompt: 'Hips and lower back. Heavy and grounded.' },
    { id: 'legs',      name: 'Legs',      prompt: 'Thighs and knees. Notice the weight of them.' },
    { id: 'feet',      name: 'Feet',      prompt: 'Feel where your feet meet the ground. Anchored.' },
  ];
  const STEP_MS = 22000;

  const svg       = document.getElementById('scanBody');
  const nameEl    = document.getElementById('scanName');
  const promptEl  = document.getElementById('scanPrompt');
  const progressEl= document.getElementById('scanProgress');
  const playBtn   = document.getElementById('scanPlay');
  const restartBtn= document.getElementById('scanRestart');
  const skipBtn   = document.getElementById('scanSkip');

  let stepIdx = 0;
  let running = false;
  let stepStart = 0;
  let elapsed = 0;
  let rafId = null;

  function setActiveRegion(id) {
    svg.querySelectorAll('[data-region]').forEach(el => {
      const regions = el.dataset.region.split(' ');
      el.classList.toggle('active', regions.includes(id));
    });
  }

  function fadeText(el, text) {
    el.classList.add('scan-fade');
    setTimeout(() => {
      el.textContent = text;
      el.classList.remove('scan-fade');
    }, 400);
  }

  function showStep(idx) {
    const step = REGIONS[idx];
    setActiveRegion(step.id);
    fadeText(nameEl, step.name);
    fadeText(promptEl, step.prompt);
    elapsed = 0;
    stepStart = performance.now();
    progressEl.style.width = '0%';
  }

  function tick() {
    if (!running) return;
    const dt = performance.now() - stepStart;
    progressEl.style.width = Math.min(100, (dt / STEP_MS) * 100) + '%';
    if (dt >= STEP_MS) {
      stepIdx += 1;
      if (stepIdx >= REGIONS.length) { finish(); return; }
      showStep(stepIdx);
    }
    rafId = requestAnimationFrame(tick);
  }

  function play() {
    if (!running) {
      running = true;
      stepStart = performance.now() - elapsed;
      playBtn.textContent = 'Pause';
      rafId = requestAnimationFrame(tick);
    } else {
      running = false;
      cancelAnimationFrame(rafId);
      elapsed = performance.now() - stepStart;
      playBtn.textContent = 'Resume';
    }
  }

  function skip() {
    stepIdx += 1;
    if (stepIdx >= REGIONS.length) finish();
    else showStep(stepIdx);
  }

  function restart() {
    stepIdx = 0;
    elapsed = 0;
    showStep(0);
    if (running) stepStart = performance.now();
  }

  function finish() {
    running = false;
    cancelAnimationFrame(rafId);
    setActiveRegion('all');
    svg.querySelectorAll('[data-region]').forEach(el => el.classList.add('active'));
    fadeText(nameEl, 'Whole body');
    fadeText(promptEl, 'Heavy. Soft. Here.');
    progressEl.style.width = '100%';
    playBtn.textContent = 'Play';
  }

  function setActive(on) {
    if (!on && running) play(); // auto-pause when leaving tab
  }

  playBtn.addEventListener('click', play);
  restartBtn.addEventListener('click', restart);
  skipBtn.addEventListener('click', skip);

  showStep(0);

  return { setActive, restart, play };
})();
