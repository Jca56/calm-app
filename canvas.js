// Generative calm canvas — drag to paint slow watercolor blooms.
window.Canvas = (function () {
  const canvas = document.getElementById('calmCanvas');
  const ctx = canvas.getContext('2d');
  const clearBtn = document.getElementById('canvasClear');
  const dpr = window.devicePixelRatio || 1;

  let active = false;
  let pointerDown = false;
  let lastPaintTime = 0;
  let lastX = 0, lastY = 0;

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
    const radius = (70 + Math.random() * 90) * intensity;
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

  function onDown(e) {
    pointerDown = true;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = pointerPos(e);
    lastX = x; lastY = y;
    bloom(x, y, 1.2);
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
      bloom(lastX + (dx * i) / steps, lastY + (dy * i) / steps, 0.7 + Math.random() * 0.4);
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

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', onUp);
  clearBtn.addEventListener('click', clearAll);
  window.addEventListener('resize', () => { if (active) resize(); });

  return { setActive, clearAll };
})();
