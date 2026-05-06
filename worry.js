// Worry dump — write it down, release it, store locally.
// TODO: swap STORAGE for Firebase Firestore when wiring auth.
window.Worry = (function () {
  const textarea = document.getElementById('worryText');
  const releaseBtn = document.getElementById('worryRelease');
  const clearBtn = document.getElementById('worryClear');
  const listEl = document.getElementById('worryList');
  const emptyEl = document.getElementById('worryEmpty');
  const flameEl = document.getElementById('worryFlame');

  const KEY_LIST = 'calm.worries';
  const KEY_DRAFT = 'calm.worry-draft';

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

  function fmtTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return sameDay ? `today, ${time}` : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
  }

  function renderList() {
    listEl.innerHTML = '';
    if (worries.length === 0) {
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';
    // newest first
    [...worries].reverse().forEach(w => {
      const item = document.createElement('div');
      item.className = 'worry-item';
      item.innerHTML = `
        <div class="worry-meta">${fmtTime(w.ts)}</div>
        <div class="worry-text"></div>
        <button class="worry-del" aria-label="Delete">×</button>
      `;
      item.querySelector('.worry-text').textContent = w.text;
      item.querySelector('.worry-del').addEventListener('click', () => remove(w.id));
      listEl.appendChild(item);
    });
  }

  function release() {
    const text = textarea.value.trim();
    if (!text) return;

    // burn animation
    flameEl.classList.add('burning');
    textarea.classList.add('releasing');

    setTimeout(() => {
      worries.push({ id: Date.now() + '-' + Math.random().toString(36).slice(2, 7), text, ts: Date.now() });
      STORAGE.save(worries);
      STORAGE.clearDraft();
      textarea.value = '';
      textarea.classList.remove('releasing');
      flameEl.classList.remove('burning');
      renderList();
    }, 900);
  }

  function remove(id) {
    worries = worries.filter(w => w.id !== id);
    STORAGE.save(worries);
    renderList();
  }

  function clearDraft() {
    textarea.value = '';
    STORAGE.clearDraft();
    textarea.focus();
  }

  // auto-save draft as user types (debounced)
  let draftTimer = null;
  textarea.addEventListener('input', () => {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => STORAGE.saveDraft(textarea.value), 250);
  });

  releaseBtn.addEventListener('click', release);
  clearBtn.addEventListener('click', clearDraft);

  // hydrate
  textarea.value = STORAGE.loadDraft();
  renderList();

  return { renderList };
})();
