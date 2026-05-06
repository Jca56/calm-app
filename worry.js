// Worry dump — write it down, release it, store locally.
// TODO: swap STORAGE for Firebase Firestore when wiring auth.
window.Worry = (function () {
  const textarea  = document.getElementById('worryText');
  const releaseBtn= document.getElementById('worryRelease');
  const clearBtn  = document.getElementById('worryClear');
  const burnAllBtn= document.getElementById('worryBurnAll');
  const listEl    = document.getElementById('worryList');
  const emptyEl   = document.getElementById('worryEmpty');
  const flameEl   = document.getElementById('worryFlame');
  const streakEl  = document.getElementById('worryStreak');
  const themesEl  = document.getElementById('worryThemes');

  const KEY_LIST = 'calm.worries';
  const KEY_DRAFT = 'calm.worry-draft';

  // Common english stopwords + filler words people use when venting.
  // Keeping the list compact — themes are derived from across-entry recurrence
  // anyway, so a forgotten stopword that only appears once doesn't pollute.
  const STOP_WORDS = new Set((
    'i me my myself we our ours you your yours he him his she her it its they ' +
    'them their what which who whom this that these those am is are was were ' +
    'be been being have has had do does did a an the and but if or because as ' +
    'until while of at by for with about against between into through during ' +
    'before after above below to from up down in out on off over under again ' +
    'then once here there when where why how all any both each few more most ' +
    'other some such no nor not only own same so than too very can will just ' +
    'should now also like really going know feel feeling think thinking want ' +
    'need get getting got make makes making made something someone anything ' +
    'nothing everyone everything maybe still even much would could thing things ' +
    'them gonna wanna being kind sort even ever never always one'
  ).split(' '));

  const STORAGE = {
    load() {
      try { return JSON.parse(localStorage.getItem(KEY_LIST)) || []; }
      catch { return []; }
    },
    save(list) { localStorage.setItem(KEY_LIST, JSON.stringify(list)); },
    loadDraft() { return localStorage.getItem(KEY_DRAFT) || ''; },
    saveDraft(text) { localStorage.setItem(KEY_DRAFT, text); },
    clearDraft() { localStorage.removeItem(KEY_DRAFT); },
  };

  let worries = STORAGE.load();
  let activeTheme = null;
  let burnAllConfirming = false;
  let burnAllTimer = null;

  function tokenize(text) {
    return text.toLowerCase().split(/[^a-z']+/).filter(Boolean);
  }

  function fmtTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return sameDay ? `today, ${time}` : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
  }

  function calcStreak() {
    if (worries.length === 0) return 0;
    const days = new Set(worries.map(w => new Date(w.ts).toDateString()));
    const today = new Date();
    // if there's nothing today yet, start counting from yesterday — don't punish
    let i = days.has(today.toDateString()) ? 0 : 1;
    let streak = 0;
    while (i < 366) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (days.has(d.toDateString())) { streak++; i++; }
      else break;
    }
    return streak;
  }

  // Top recurring meaningful words across worry entries.
  // We count each word once per entry so a single rant doesn't dominate.
  function extractThemes() {
    const counts = new Map();
    for (const w of worries) {
      const seen = new Set();
      for (const word of tokenize(w.text)) {
        if (word.length < 4 || STOP_WORDS.has(word) || seen.has(word)) continue;
        seen.add(word);
        counts.set(word, (counts.get(word) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .filter(([, c]) => c >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }

  function renderStreak() {
    const s = calcStreak();
    streakEl.textContent = s > 0 ? `🔥 ${s}-day streak` : '';
    streakEl.classList.toggle('active', s > 0);
  }

  function renderThemes() {
    themesEl.innerHTML = '';
    const themes = extractThemes();
    themes.forEach(([word, count]) => {
      const chip = document.createElement('button');
      chip.className = 'theme-chip' + (activeTheme === word ? ' active' : '');
      chip.innerHTML = '';
      chip.appendChild(document.createTextNode(word));
      const c = document.createElement('span');
      c.className = 'count';
      c.textContent = count;
      chip.appendChild(c);
      chip.addEventListener('click', () => {
        activeTheme = (activeTheme === word) ? null : word;
        renderThemes();
        renderList();
      });
      themesEl.appendChild(chip);
    });
  }

  function renderBurnAll() {
    burnAllBtn.style.display = worries.length > 0 ? 'inline-block' : 'none';
  }

  function renderList() {
    listEl.innerHTML = '';
    let visible = worries;
    if (activeTheme) {
      visible = worries.filter(w => tokenize(w.text).includes(activeTheme));
    }
    if (visible.length === 0) {
      emptyEl.style.display = 'block';
      emptyEl.textContent = activeTheme
        ? `No worries match "${activeTheme}".`
        : 'Nothing released yet. Worries you release stay private on this device.';
      return;
    }
    emptyEl.style.display = 'none';
    [...visible].reverse().forEach(w => {
      const item = document.createElement('div');
      item.className = 'worry-item';
      const meta = document.createElement('div');
      meta.className = 'worry-meta';
      meta.textContent = fmtTime(w.ts);
      const text = document.createElement('div');
      text.className = 'worry-text';
      text.textContent = w.text;
      const del = document.createElement('button');
      del.className = 'worry-del';
      del.setAttribute('aria-label', 'Delete');
      del.textContent = '×';
      del.addEventListener('click', () => remove(w.id));
      item.appendChild(meta);
      item.appendChild(text);
      item.appendChild(del);
      listEl.appendChild(item);
    });
  }

  function renderAll() {
    renderStreak();
    renderThemes();
    renderBurnAll();
    renderList();
  }

  function release() {
    const text = textarea.value.trim();
    if (!text) return;
    flameEl.classList.add('burning');
    textarea.classList.add('releasing');
    setTimeout(() => {
      worries.push({ id: Date.now() + '-' + Math.random().toString(36).slice(2, 7), text, ts: Date.now() });
      STORAGE.save(worries);
      STORAGE.clearDraft();
      textarea.value = '';
      textarea.classList.remove('releasing');
      flameEl.classList.remove('burning');
      renderAll();
    }, 900);
  }

  function remove(id) {
    worries = worries.filter(w => w.id !== id);
    STORAGE.save(worries);
    renderAll();
  }

  function clearDraft() {
    textarea.value = '';
    STORAGE.clearDraft();
    textarea.focus();
  }

  function burnAll() {
    // first click: arm. Second click within 4s: fire.
    if (!burnAllConfirming) {
      burnAllConfirming = true;
      burnAllBtn.classList.add('confirming');
      burnAllBtn.textContent = 'Confirm 🔥🔥';
      clearTimeout(burnAllTimer);
      burnAllTimer = setTimeout(() => {
        burnAllConfirming = false;
        burnAllBtn.classList.remove('confirming');
        burnAllBtn.textContent = 'Burn all 🔥';
      }, 4000);
      return;
    }
    clearTimeout(burnAllTimer);
    burnAllConfirming = false;
    burnAllBtn.classList.remove('confirming');
    burnAllBtn.textContent = 'Burn all 🔥';

    const items = [...listEl.querySelectorAll('.worry-item')];
    flameEl.classList.add('burning', 'burning-all');
    const stagger = 250;
    items.forEach((item, idx) => {
      setTimeout(() => item.classList.add('burning'), idx * stagger);
    });
    const totalMs = 2200 + items.length * stagger;
    setTimeout(() => {
      worries = [];
      activeTheme = null;
      STORAGE.save(worries);
      flameEl.classList.remove('burning', 'burning-all');
      renderAll();
    }, totalMs);
  }

  // auto-save draft as user types (debounced)
  let draftTimer = null;
  textarea.addEventListener('input', () => {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => STORAGE.saveDraft(textarea.value), 250);
  });

  releaseBtn.addEventListener('click', release);
  clearBtn.addEventListener('click', clearDraft);
  burnAllBtn.addEventListener('click', burnAll);

  textarea.value = STORAGE.loadDraft();
  renderAll();

  return { renderAll };
})();
