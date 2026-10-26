(function () {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const { VALUE, toRoman, MAX } = Roman;
  const NS = 'http://www.w3.org/2000/svg';

  // The seven letters in order. Each step is times five or times two, alternating.
  const LETTERS = [
    { letter: 'I', value: 1 },
    { letter: 'V', value: 5 },
    { letter: 'X', value: 10 },
    { letter: 'L', value: 50 },
    { letter: 'C', value: 100 },
    { letter: 'D', value: 500 },
    { letter: 'M', value: 1000 },
  ];

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };
  // SVG attributes cannot read CSS variables, so colours from the look go in as inline styles.
  const svgEl = (tag, attrs) => {
    const e = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (String(v).startsWith('var(')) e.style.setProperty(k, v);
      else e.setAttribute(k, v);
    });
    return e;
  };

  // ---------- tabs and settings ----------
  function showTab(name) {
    $$('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    $$('.tab').forEach((s) => s.classList.toggle('active', s.id === `tab-${name}`));
  }

  // ---------- Spiral: t = log10(value) turns, so one full turn is times ten ----------
  const CENTER = 200;
  const BASE = 24;
  const GROWTH = 42;
  const polar = (t) => {
    const angle = 2 * Math.PI * t - Math.PI / 2; // start at the top
    const r = BASE + GROWTH * t;
    return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
  };

  function renderSpiral(n) {
    const svg = $('#spiral-svg');
    svg.replaceChildren();
    // Dashed rings: one for each times-ten
    [0, 1, 2, 3].forEach((k) => {
      svg.appendChild(svgEl('circle', { cx: CENTER, cy: CENTER, r: BASE + GROWTH * k, fill: 'none', stroke: 'var(--dots)', 'stroke-width': 2, 'stroke-dasharray': '6 8' }));
    });
    // The path up to the last letter shown
    const tEnd = Math.log10(LETTERS[n - 1].value);
    const points = [];
    for (let i = 0; i <= 120; i++) {
      const p = polar((tEnd * i) / 120);
      points.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    svg.appendChild(svgEl('polyline', { points: points.join(' '), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    // Each letter, with a dot and its label pushed out a little
    LETTERS.slice(0, n).forEach(({ letter, value }) => {
      const p = polar(Math.log10(value));
      // Push the label straight out from the centre, away from the dot
      const dx = p.x - CENTER;
      const dy = p.y - CENTER;
      const len = Math.hypot(dx, dy) || 1;
      const lx = p.x + (dx / len) * 20;
      const ly = p.y + (dy / len) * 20;
      svg.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: 13, fill: `var(--t-${letter})`, stroke: 'var(--ink)', 'stroke-width': 3 }));
      // A halo in the card colour keeps each label readable where the spiral passes behind it
      const label = svgEl('text', { x: lx, y: ly + 6, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 900, fill: 'var(--ink)', stroke: 'var(--card)', 'stroke-width': 5, 'paint-order': 'stroke' });
      label.textContent = `${letter} ${value}`;
      svg.appendChild(label);
    });
    svg.appendChild(svgEl('circle', { cx: CENTER, cy: CENTER, r: 4, fill: 'var(--ink)' }));

    const cur = LETTERS[n - 1];
    const prev = LETTERS[n - 2];
    let caption = `${cur.value} is ${cur.letter}.`;
    if (prev) caption += ` ${cur.value / prev.value} times ${prev.letter}.`;
    if (Number.isInteger(Math.log10(cur.value)) && n > 1 && cur.value > 1) caption += ' Back on the same spoke: one full turn, times ten.';
    $('#spiral-caption').textContent = caption;
  }

  // ---------- Steps: a staircase with the times-five and times-two steps marked ----------
  function renderStairs(n) {
    const box = $('#stairs');
    box.replaceChildren();
    LETTERS.slice(0, n).forEach(({ letter, value }, i) => {
      if (i > 0) {
        const ratio = value / LETTERS[i - 1].value;
        box.appendChild(el('div', 'stair-step', `×${ratio}`));
      }
      const col = el('div', 'stair-col');
      col.style.height = `${40 + 40 * Math.log10(value)}px`;
      col.appendChild(el('div', `tile ${letter}`, letter));
      box.appendChild(col);
    });
    const cur = LETTERS[n - 1];
    $('#steps-caption').textContent = `${cur.letter} is ${cur.value}.` + (n > 1 ? ` The steps so far: ${LETTERS.slice(1, n).map((x, i) => `×${x.value / LETTERS[i].value}`).join(', ')}.` : '');
  }

  // ---------- Tiles: each square's area is its value, so the sides are the square roots ----------
  function renderTiles() {
    const row = $('#tile-row');
    row.replaceChildren();
    const SCALE = 3.4; // fits a phone; the ratio of sides is still the square root of the ratio of values
    LETTERS.forEach(({ letter, value }) => {
      const cell = el('div', 'tile-cell');
      const side = SCALE * Math.sqrt(value);
      const sq = el('div', `tile-sq ${letter}`);
      sq.style.width = `${side}px`;
      sq.style.height = `${side}px`;
      sq.setAttribute('aria-label', `${letter} is ${value}`);
      cell.appendChild(sq);
      cell.appendChild(el('div', 'tile-label', `${letter} ${value}`));
      row.appendChild(cell);
    });
    const steps = LETTERS.slice(1).map((x, i) => `×${x.value / LETTERS[i].value}`).join(', ');
    $('#tiles-note').textContent = `From I to M, the steps are ${steps}.`;
  }

  // ---------- Rods: parts first, then the numeral they make ----------
  // Each rod is a column with one bead worth five (top) and four beads worth one (bottom).
  const ROD_LETTERS = [
    { name: 'thousands', one: 'M', five: null },
    { name: 'hundreds', one: 'C', five: 'D' },
    { name: 'tens', one: 'X', five: 'L' },
    { name: 'ones', one: 'I', five: 'V' },
  ];

  function rodParts(digit, rod) {
    const fives = digit >= 5 ? 1 : 0;
    const ones = digit % 5;
    return (fives ? rod.five : '') + rod.one.repeat(ones);
  }

  function renderRods(n) {
    const digits = [Math.floor(n / 1000), Math.floor((n % 1000) / 100), Math.floor((n % 100) / 10), n % 10];
    const rods = $('#rods');
    rods.replaceChildren();
    ROD_LETTERS.forEach((rod, i) => {
      const digit = digits[i];
      const col = el('div', 'rod');
      col.setAttribute('aria-label', `${rod.name}: ${digit}`);
      // Top bead: five
      const top = el('div', 'bead five');
      top.classList.toggle('on', digit >= 5 && rod.five !== null);
      if (rod.five) top.textContent = rod.five;
      col.appendChild(top);
      col.appendChild(el('div', 'rod-bar'));
      // Bottom beads: one each
      for (let k = 0; k < 4; k++) {
        const bead = el('div', 'bead one', rod.one);
        bead.classList.toggle('on', k < digit % 5);
        col.appendChild(bead);
      }
      col.appendChild(el('div', 'rod-name', rod.name));
      rods.appendChild(col);
    });

    const parts = ROD_LETTERS.map((rod, i) => rodParts(digits[i], rod)).join('');
    const sum = digits.map((d, i) => d * [1000, 100, 10, 1][i]).filter((v) => v > 0).join(' + ');
    $('#rods-parts').replaceChildren(
      el('p', 'big-value', `Parts: ${parts}`),
      el('p', 'big-value', `Put them together: ${toRoman(n)}`),
      el('p', 'note', `${n} is ${sum}.`),
    );
  }

  function readNumber(text) {
    const n = Number(text.trim());
    if (!Number.isInteger(n) || n < 1 || n > MAX) return null;
    return n;
  }

  function showRods(text) {
    const n = readNumber(text);
    if (n === null) {
      $('#rods').replaceChildren();
      $('#rods-parts').replaceChildren(el('p', 'note', `Type a whole number from 1 to ${MAX}.`));
      return;
    }
    renderRods(n);
  }

  // ---------- wiring ----------
  function init() {
    renderSpiral(7);
    renderStairs(7);
    renderTiles();
    showRods('47');
    $('#rods-input').value = '47';

    $$('.tab-btn').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
    $('#spiral-n').addEventListener('input', (e) => renderSpiral(Number(e.target.value)));
    $('#steps-n').addEventListener('input', (e) => renderStairs(Number(e.target.value)));
    $('#rods-form').addEventListener('submit', (e) => {
      e.preventDefault();
      showRods($('#rods-input').value);
    });
    $('#rods-random').addEventListener('click', () => {
      const n = 1 + Math.floor(Math.random() * 999);
      $('#rods-input').value = String(n);
      showRods(String(n));
    });

    const drawer = $('#drawer');
    $('#gear').addEventListener('click', () => {
      drawer.hidden = !drawer.hidden;
      $('#gear').setAttribute('aria-expanded', String(!drawer.hidden));
    });
    $('#drawer-close').addEventListener('click', () => { drawer.hidden = true; });
    $$('[data-look]').forEach((b) => b.addEventListener('click', () => RomanShared.applyLook(b.dataset.look)));
    RomanShared.applyLook(RomanShared.savedLook() || 'sunny');
  }

  init();
})();
