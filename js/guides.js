/* Guide shelf: filter chips + text search. Static, no dependencies. */
(() => {
  'use strict';
  const grid = document.getElementById('guideGrid');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.kit-guide-card'));
  const buttons = Array.from(document.querySelectorAll('[data-filter]'));
  const search = document.getElementById('guideSearch');
  const count = document.getElementById('guideCount');
  const empty = document.getElementById('guideEmpty');
  const clear = document.getElementById('guideClear');
  let filter = 'all';
  let term = '';

  const apply = () => {
    let shown = 0;
    cards.forEach(card => {
      const tags = (card.dataset.tags || '').toLowerCase();
      const text = card.textContent.toLowerCase();
      const matchesFilter = filter === 'all' || tags.includes(filter);
      const matchesTerm = !term || text.includes(term);
      const visible = matchesFilter && matchesTerm;
      card.hidden = !visible;
      if (visible) shown += 1;
    });
    if (count) count.textContent = shown + (shown === 1 ? ' guide' : ' guides');
    if (empty) empty.hidden = shown !== 0;
  };

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      filter = button.dataset.filter || 'all';
      buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      apply();
    });
  });

  if (search) {
    search.addEventListener('input', () => {
      term = search.value.trim().toLowerCase();
      apply();
    });
  }

  if (clear) {
    clear.addEventListener('click', () => {
      filter = 'all';
      term = '';
      if (search) search.value = '';
      buttons.forEach(other => other.setAttribute('aria-pressed', String(other.dataset.filter === 'all')));
      apply();
    });
  }

  apply();
})();
