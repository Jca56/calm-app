// Aurora + starfield backdrop for the breathing orb.
// Three slowly-orbiting radial gradients (screen-blended) + a twinkling starfield.
window.Aurora = (function () {
  const canvas = document.getElementById('aurora');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  let active = false;
  let rafId = null;
  let stars = [];
  let w = 0, h = 0;

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initStars();
  }

  function initStars() {
    stars = [];
    const count = Math.floor((w * h) / 5500);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.1 + 0.3,
        baseAlpha: 0.25 + Math.random() * 0.55,
        twinkleSpeed: 0.4 + Math.random() * 1.6,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  // 3 aurora blobs — slow sin/cos orbits, soft hue, screen-blended
  const BLOBS = [
    { hue: 175, sat: 70, lit: 55, sx: 0.05, sy: 0.04, ax: 0.22, ay: 0.18, px: 0.30, py: 0.40, ph: 0 },
    { hue: 210, sat: 70, lit: 55, sx: 0.04, sy: 0.06, ax: 0.18, ay: 0.16, px: 0.70, py: 0.50, ph: 2 },
    { hue: 280, sat: 60, lit: 55, sx: 0.03, sy: 0.05, ax: 0.25, ay: 0.20, px: 0.50, py: 0.65, ph: 4 },
  ];

  function frame(t) {
    if (!active) return;
    rafId = requestAnimationFrame(frame);
    const time = t / 1000;

    ctx.clearRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'screen';
    for (const b of BLOBS) {
      const cx = (b.px + Math.sin(time * b.sx + b.ph) * b.ax) * w;
      const cy = (b.py + Math.cos(time * b.sy + b.ph) * b.ay) * h;
      const r = Math.max(w, h) * 0.45;
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grd.addColorStop(0,    `hsla(${b.hue}, ${b.sat}%, ${b.lit}%, 0.20)`);
      grd.addColorStop(0.45, `hsla(${b.hue}, ${b.sat}%, ${b.lit}%, 0.07)`);
      grd.addColorStop(1,    `hsla(${b.hue}, ${b.sat}%, ${b.lit}%, 0)`);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = 'source-over';

    for (const s of stars) {
      const a = s.baseAlpha * (0.45 + 0.55 * Math.sin(time * s.twinkleSpeed + s.twinklePhase));
      ctx.fillStyle = `rgba(232, 244, 251, ${a})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function setActive(on) {
    active = on;
    canvas.style.opacity = on ? '1' : '0';
    if (on) {
      resize();
      rafId = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(rafId);
    }
  }

  window.addEventListener('resize', () => { if (active) resize(); });

  return { setActive };
})();
