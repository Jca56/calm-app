// Top-level wiring: mode switcher (in menu panel) + sound mixer + keyboard shortcuts.
(function () {
  const modeBtns = document.querySelectorAll('.mode-list .mode-item');
  const views = document.querySelectorAll('.view');
  const subtitleEl = document.querySelector('.subtitle');
  const SUBTITLES = {
    breathe: 'follow the orb',
    ground: '5 · 4 · 3 · 2 · 1',
    worry: 'let it out',
    canvas: 'drag to bloom',
    scan: 'head to toes',
  };

  function setMode(mode) {
    if (!SUBTITLES[mode]) return;
    modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    views.forEach(v => v.classList.toggle('active', v.id === 'view-' + mode));
    if (subtitleEl) {
      subtitleEl.classList.add('fading');
      setTimeout(() => {
        subtitleEl.textContent = SUBTITLES[mode];
        subtitleEl.classList.remove('fading');
      }, 600);
    }
    if (window.Canvas) window.Canvas.setActive(mode === 'canvas');
    if (window.Aurora) window.Aurora.setActive(mode !== 'canvas');
    if (window.Scan) window.Scan.setActive(mode === 'scan');
  }

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });

  // ---- mixer / menu panel ----
  const mixer = document.getElementById('mixer');
  const mixerToggle = document.getElementById('mixerToggle');
  function toggleMenu(force) {
    const open = typeof force === 'boolean' ? force : !mixer.classList.contains('open');
    mixer.classList.toggle('open', open);
    mixerToggle.classList.toggle('open', open);
  }
  mixerToggle.addEventListener('click', () => toggleMenu());

  document.querySelectorAll('.channel').forEach(channel => {
    const slider = channel.querySelector('input[type="range"]');
    const pct = channel.querySelector('.pct');
    const sound = channel.dataset.sound;
    slider.addEventListener('input', () => {
      const v = parseInt(slider.value, 10);
      pct.textContent = v + '%';
      const norm = v / 100;
      window.Sounds.setLevel(sound, norm * norm * 0.7);
    });
  });

  // ---- collapsible mix section ----
  const mixToggle = document.getElementById('mixSectionToggle');
  const mixBody = document.getElementById('mixSectionBody');
  mixToggle.addEventListener('click', () => {
    const collapsed = mixToggle.classList.toggle('collapsed');
    mixBody.classList.toggle('collapsed', collapsed);
    mixToggle.setAttribute('aria-expanded', String(!collapsed));
  });

  // ---- canvas hint fade on first interaction ----
  const canvasEl = document.getElementById('calmCanvas');
  const canvasStage = canvasEl && canvasEl.parentElement;
  if (canvasEl) {
    canvasEl.addEventListener('pointerdown', () => {
      canvasStage.classList.add('painted');
    }, { once: true });
  }

  // ---- keyboard shortcuts ----
  // B/G/W/C → switch tabs · Space → start/stop breathing · Esc → close menu
  // Skip while typing in inputs / textareas so worry-dump and sliders aren't hijacked.
  const SHORTCUTS = { b: 'breathe', g: 'ground', w: 'worry', c: 'canvas', s: 'scan' };
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const k = e.key.toLowerCase();
    if (SHORTCUTS[k]) {
      e.preventDefault();
      setMode(SHORTCUTS[k]);
      return;
    }
    if (e.key === ' ' && document.getElementById('view-breathe').classList.contains('active')) {
      e.preventDefault();
      if (window.Breath) window.Breath.toggle();
      return;
    }
    if (e.key === 'Escape') {
      toggleMenu(false);
    }
  });

  // boot: turn on aurora since breathe is the default mode
  if (window.Aurora) window.Aurora.setActive(true);
})();
