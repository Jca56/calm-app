// Top-level wiring: mode switcher (in menu panel) + sound mixer UI.
(function () {
  const modeBtns = document.querySelectorAll('.mode-list .mode-item');
  const views = document.querySelectorAll('.view');
  const subtitleEl = document.querySelector('.subtitle');
  const SUBTITLES = {
    breathe: 'follow the orb',
    ground: '5 · 4 · 3 · 2 · 1',
    worry: 'let it out',
    canvas: 'drag to bloom',
  };

  function setMode(mode) {
    modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    views.forEach(v => v.classList.toggle('active', v.id === 'view-' + mode));
    if (subtitleEl) subtitleEl.textContent = SUBTITLES[mode];
    if (window.Canvas) window.Canvas.setActive(mode === 'canvas');
  }

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });

  // ---- mixer / menu panel ----
  const mixer = document.getElementById('mixer');
  const mixerToggle = document.getElementById('mixerToggle');
  mixerToggle.addEventListener('click', () => {
    mixer.classList.toggle('open');
    mixerToggle.classList.toggle('open');
  });

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
})();
