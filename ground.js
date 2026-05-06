// 5-4-3-2-1 grounding exercise. Tap to acknowledge each thing you notice;
// no typing required — friction is the enemy when anxious.
window.Ground = (function () {
  const numEl = document.getElementById('groundNumber');
  const promptEl = document.getElementById('groundPrompt');
  const helpEl = document.getElementById('groundHelp');
  const dotsEl = document.getElementById('groundDots');
  const noticeBtn = document.getElementById('groundNotice');
  const restartBtn = document.getElementById('groundRestart');

  const STEPS = [
    { count: 5, sense: 'see',   help: 'Look around. Take your time. There\'s no rush.' },
    { count: 4, sense: 'feel',  help: 'Your feet on the floor, fabric on your skin, the air on your face.' },
    { count: 3, sense: 'hear',  help: 'Close ones, far ones. Your own breath counts.' },
    { count: 2, sense: 'smell', help: 'If nothing — take two slow breaths through your nose.' },
    { count: 1, sense: 'taste', help: 'Or take a sip of water. Notice the taste.' },
  ];

  let stepIdx = 0;
  let noticed = 0;

  function fade(el, fn) {
    el.classList.add('ground-fade');
    setTimeout(() => {
      fn();
      el.classList.remove('ground-fade');
    }, 350);
  }

  function renderDots(total, filled) {
    dotsEl.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const d = document.createElement('div');
      d.className = 'dot' + (i < filled ? ' filled' : '');
      dotsEl.appendChild(d);
    }
  }

  function renderStep() {
    const step = STEPS[stepIdx];
    noticed = 0;
    fade(numEl, () => { numEl.textContent = step.count; });
    fade(promptEl, () => { promptEl.textContent = `${step.count} ${step.count === 1 ? 'thing' : 'things'} you can ${step.sense}`; });
    fade(helpEl, () => { helpEl.textContent = step.help; });
    renderDots(step.count, 0);
    noticeBtn.textContent = 'I noticed one';
    noticeBtn.disabled = false;
    restartBtn.style.display = 'none';
  }

  function notice() {
    const step = STEPS[stepIdx];
    if (noticed >= step.count) return;
    noticed += 1;
    renderDots(step.count, noticed);
    if (noticed >= step.count) {
      noticeBtn.disabled = true;
      setTimeout(() => {
        stepIdx += 1;
        if (stepIdx >= STEPS.length) {
          finish();
        } else {
          renderStep();
        }
      }, 700);
    }
  }

  function finish() {
    fade(numEl, () => { numEl.textContent = '✓'; });
    fade(promptEl, () => { promptEl.textContent = 'You\'re here. You\'re safe right now.'; });
    fade(helpEl, () => { helpEl.textContent = 'Notice how you feel compared to a few minutes ago.'; });
    dotsEl.innerHTML = '';
    noticeBtn.disabled = true;
    noticeBtn.textContent = 'Done';
    restartBtn.style.display = 'inline-block';
  }

  function restart() {
    stepIdx = 0;
    renderStep();
  }

  noticeBtn.addEventListener('click', notice);
  restartBtn.addEventListener('click', restart);

  renderStep();

  return { restart };
})();
