// Generative calm canvas — drag to paint slow watercolor blooms.
window.Canvas = (function () {
  const canvas = document.getElementById('calmCanvas');
  const ctx = canvas.getContext('2d');
  const clearBtn = document.getElementById('canvasClear');
  const saveBtn = document.getElementById('canvasSave');
  const brushInput = document.getElementById('canvasBrush');
  const symmetryRow = document.getElementById('canvasSymmetry');
  const dpr = window.devicePixelRatio || 1;

  let active = false;
  let pointerDown = false;
  let lastPaintTime = 0;
  let lastX = 0, lastY = 0;
  let brushScale = 1.0;
  let symmetry = 1;

  function size() {
    const rect = canvas.getBoundingClientRect();
    return { w: rect.width, h: rect.height };
  }

  function resize() {
    const { w, h } = size();
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function bloom(x, y, intensity = 1) {
    const hue = (Date.now() / 25 + Math.random() * 25) % 360;
    const radius = (70 + Math.random() * 90) * intensity * brushScale;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, radius);
    // soft pastel: low saturation, high lightness, normal alpha compositing
    grd.addColorStop(0,    `hsla(${hue}, 55%, 82%, ${0.35 * intensity})`);
    grd.addColorStop(0.4,  `hsla(${hue + 15}, 50%, 78%, ${0.18 * intensity})`);
    grd.addColorStop(0.85, `hsla(${hue + 30}, 50%, 75%, 0.04)`);
    grd.addColorStop(1,    `hsla(${hue + 30}, 50%, 75%, 0)`);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  // Paint with optional radial symmetry: rotated copies + mirror reflections.
  function paint(x, y, intensity) {
    if (symmetry <= 1) { bloom(x, y, intensity); return; }
    const { w, h } = size();
    const cx = w / 2, cy = h / 2;
    const dx = x - cx, dy = y - cy;
    const dist = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx);
    const step = (Math.PI * 2) / symmetry;
    for (let i = 0; i < symmetry; i++) {
      const a  = ang + i * step;
      bloom(cx + Math.cos(a)  * dist, cy + Math.sin(a)  * dist, intensity);
      const ar = -ang + i * step;
      bloom(cx + Math.cos(ar) * dist, cy + Math.sin(ar) * dist, intensity);
    }
  }

  function onDown(e) {
    pointerDown = true;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = pointerPos(e);
    lastX = x; lastY = y;
    paint(x, y, 1.2);
  }

  function onMove(e) {
    if (!pointerDown) return;
    const now = performance.now();
    if (now - lastPaintTime < 24) return;
    lastPaintTime = now;
    const { x, y } = pointerPos(e);
    // interpolate so fast drags don't leave gaps
    const dx = x - lastX, dy = y - lastY;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.floor(dist / 30));
    for (let i = 1; i <= steps; i++) {
      paint(lastX + (dx * i) / steps, lastY + (dy * i) / steps, 0.7 + Math.random() * 0.4);
    }
    lastX = x; lastY = y;
  }

  function onUp() { pointerDown = false; }

  function clearAll() {
    const { w, h } = size();
    ctx.clearRect(0, 0, w, h);
  }

  function setActive(on) {
    active = on;
    if (on) resize();
    else pointerDown = false;
  }

  // Flatten canvas onto bg gradient and download as PNG.
  function save() {
    const out = document.createElement('canvas');
    out.width = canvas.width;
    out.height = canvas.height;
    const octx = out.getContext('2d');
    const cx = out.width / 2, cy = out.height * 0.4;
    const grd = octx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(out.width, out.height));
    grd.addColorStop(0,    '#1d4f6e');
    grd.addColorStop(0.45, '#14334a');
    grd.addColorStop(1,    '#0b1d2a');
    octx.fillStyle = grd;
    octx.fillRect(0, 0, out.width, out.height);
    octx.drawImage(canvas, 0, 0);
    const link = document.createElement('a');
    link.download = `calm-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;
    link.href = out.toDataURL('image/png');
    link.click();
  }

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', onUp);
  clearBtn.addEventListener('click', clearAll);
  saveBtn.addEventListener('click', save);
  brushInput.addEventListener('input', () => { brushScale = brushInput.value / 100; });
  symmetryRow.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-sym]');
    if (!btn) return;
    symmetry = parseInt(btn.dataset.sym, 10);
    symmetryRow.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
  });
  window.addEventListener('resize', () => { if (active) resize(); });

  return { setActive, clearAll };
})();
