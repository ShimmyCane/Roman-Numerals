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
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  // ---------- tabs ----------
  function showTab(name) {
    $$('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    $$('.tab').forEach((s) => s.classList.toggle('active', s.id === `tab-${name}`));
  }

  // ---------- Start: squares to scale, the area is the value ----------
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
  }

  // ---------- Spiral: one spiral from I onward. Each turn is times ten. V sits at the top. ----------
  const CX = 200;
  const CY = 200;
  const BASE = 16;
  const GROWTH = 50;
  const LOG5 = Math.log10(5);
  const TMAX = Math.log10(MAX);
  let spiralN = 1;

  // Position of number n. Radius grows with log10(n); the angle is one turn per times ten, rotated so 5 is at the top.
  function spiralAt(n, extra = 0) {
    const t = Math.log10(n);
    const r = BASE + GROWTH * t + extra;
    const angle = 2 * Math.PI * (t - LOG5) - Math.PI / 2;
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle), angle };
  }

  // The biggest letter in a numeral is the one to underline. Underline its first run: IX underlines the X.
  function underlineSpans(text) {
    const biggest = text.split('').reduce((a, c) => (VALUE[c] > VALUE[a] ? c : a), text[0]);
    const start = text.indexOf(biggest);
    let end = start;
    while (end < text.length && text[end] === biggest) end++;
    return text.split('').map((ch, i) => ({ ch, underline: i >= start && i < end }));
  }

  function buildSpiralStatic() {
    const svg = $('#spiral-svg');
    svg.replaceChildren();
    const path = [];
    for (let i = 0; i <= 600; i++) {
      const p = spiralAt(Math.pow(10, (TMAX * i) / 600));
      path.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    svg.appendChild(svgEl('polyline', { points: path.join(' '), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.45 }));
    // Every number as a small dot on the spiral
    for (let n = 1; n <= MAX; n++) {
      const p = spiralAt(n);
      svg.appendChild(svgEl('circle', { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 1.8, fill: 'var(--ink)' }));
    }
    svg.appendChild(svgEl('g', { id: 'spiral-window' }));
  }

  // The numbers around the current one, with their numerals. The biggest letter is underlined.
  function renderSpiralWindow() {
    const group = $('#spiral-window');
    group.replaceChildren();
    for (let n = spiralN - 5; n <= spiralN + 5; n++) {
      if (n < 1 || n > MAX) continue;
      const current = n === spiralN;
      const p = spiralAt(n, current ? 16 : 0);
      const lp = spiralAt(n, current ? 40 : 30);
      group.appendChild(svgEl('circle', { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: current ? 7 : 3.5, fill: current ? 'var(--t-M)' : 'var(--card)', stroke: 'var(--ink)', 'stroke-width': 2 }));
      const label = svgEl('text', {
        x: lp.x.toFixed(1), y: (lp.y + 6).toFixed(1), 'text-anchor': 'middle', 'font-size': current ? 26 : 16,
        'font-weight': 900, fill: 'var(--ink)', stroke: 'var(--card)', 'stroke-width': 5, 'paint-order': 'stroke',
      });
      underlineSpans(toRoman(n)).forEach(({ ch, underline }) => {
        const span = svgEl('tspan', underline ? { 'text-decoration': 'underline' } : {});
        span.textContent = ch;
        label.appendChild(span);
      });
      group.appendChild(label);
    }
    $('#spiral-box').setAttribute('aria-valuenow', String(spiralN));
  }

  function moveSpiral(step) {
    spiralN = clamp(spiralN + step, 1, MAX);
    renderSpiralWindow();
  }

  function wireSpiral() {
    const box = $('#spiral-box');
    box.addEventListener('wheel', (e) => {
      e.preventDefault();
      moveSpiral(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });

    let lastY = null;
    let carry = 0;
    box.addEventListener('pointerdown', (e) => {
      lastY = e.clientY;
      carry = 0;
      box.setPointerCapture(e.pointerId);
    });
    box.addEventListener('pointermove', (e) => {
      if (lastY === null) return;
      carry += lastY - e.clientY;
      lastY = e.clientY;
      const steps = Math.trunc(carry / 12);
      if (steps) {
        carry -= steps * 12;
        moveSpiral(steps);
      }
    });
    const endDrag = () => { lastY = null; };
    box.addEventListener('pointerup', endDrag);
    box.addEventListener('pointercancel', endDrag);

    box.addEventListener('keydown', (e) => {
      const keys = { ArrowUp: 1, ArrowDown: -1, PageUp: 10, PageDown: -10 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      moveSpiral(keys[e.key]);
    });
  }

  // ---------- Steps: a staircase with the times-five and times-two steps marked (to be rethought) ----------
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
    $('#steps-caption').textContent = `${cur.letter} ${cur.value}`;
  }

  // ---------- Shake: a random number of stones falls into a bucket ----------
  const bucket = $('#bucket');
  const STONE = 6;
  const PITCH = STONE + 1;
  let pourFrame = 0;

  function drawBucketOutline(ctx, W, H) {
    ctx.beginPath();
    ctx.moveTo(8, 8);
    ctx.lineTo(W - 8, 8);
    ctx.lineTo(W - 30, H - 8);
    ctx.lineTo(30, H - 8);
    ctx.closePath();
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#2b2540';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function pour() {
    const n = 1 + Math.floor(Math.random() * 999);
    const dpr = window.devicePixelRatio || 1;
    const W = bucket.clientWidth;
    const H = bucket.clientHeight;
    bucket.width = W * dpr;
    bucket.height = H * dpr;
    const ctx = bucket.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const css = getComputedStyle(document.documentElement);
    const fill = css.getPropertyValue('--t-X').trim() || '#a7dbff';
    const ink = css.getPropertyValue('--ink').trim() || '#2b2540';

    // Stones settle in rows from the bottom of the bucket, one per number
    const cols = Math.max(1, Math.floor((W - 72) / PITCH));
    const stones = Array.from({ length: n }, (_, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      return {
        x: 36 + col * PITCH,
        y: H - 14 - row * PITCH - STONE,
        delay: i * 2,
      };
    });

    $('#bucket-caption').textContent = toRoman(n);
    cancelAnimationFrame(pourFrame);
    const t0 = performance.now();
    const FALL = 450;
    const frame = (now) => {
      ctx.clearRect(0, 0, W, H);
      drawBucketOutline(ctx, W, H);
      let done = true;
      ctx.fillStyle = fill;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.5;
      stones.forEach((s) => {
        const p = clamp((now - t0 - s.delay) / FALL, 0, 1);
        if (p < 1) done = false;
        const y = -STONE + (s.y + STONE) * p * p;
        ctx.fillRect(s.x, y, STONE, STONE);
        ctx.strokeRect(s.x, y, STONE, STONE);
      });
      if (!done) pourFrame = requestAnimationFrame(frame);
    };
    pourFrame = requestAnimationFrame(frame);
  }

  // Shaking the phone pours. iPhones ask permission first, so the button asks for it.
  function wireShake() {
    const button = $('#shake-on');
    if (!('DeviceMotionEvent' in window)) {
      button.disabled = true;
      return;
    }
    let last = 0;
    const onMotion = (e) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const force = Math.abs(Math.hypot(a.x || 0, a.y || 0, a.z || 0) - 9.81);
      const now = performance.now();
      if (force > 14 && now - last > 1500) {
        last = now;
        pour();
      }
    };
    button.addEventListener('click', async () => {
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        const answer = await DeviceMotionEvent.requestPermission().catch(() => 'denied');
        if (answer !== 'granted') return;
      }
      window.addEventListener('devicemotion', onMotion);
      button.setAttribute('aria-pressed', 'true');
    });
  }

  // ---------- Rods: tap the beads. Raw = the beads as letters. Organized = the numeral. ----------
  const RODS = [
    { name: 'thousands', one: 'M', five: null, max: 3 },
    { name: 'hundreds', one: 'C', five: 'D', max: 9 },
    { name: 'tens', one: 'X', five: 'L', max: 9 },
    { name: 'ones', one: 'I', five: 'V', max: 9 },
  ];
  let digits = [0, 0, 4, 7];

  function valueOfDigits() {
    return digits.reduce((acc, d) => acc * 10 + d, 0);
  }

  function rawLetters() {
    return RODS.map((rod, i) => {
      const d = digits[i];
      return (d >= 5 && rod.five ? rod.five : '') + rod.one.repeat(d % 5);
    }).join('');
  }

  function renderRods() {
    const rods = $('#rods');
    rods.replaceChildren();
    RODS.forEach((rod, i) => {
      const d = digits[i];
      const col = el('div', 'rod');
      if (rod.five) {
        const heaven = el('button', 'bead five', rod.five);
        heaven.type = 'button';
        heaven.setAttribute('aria-pressed', String(d >= 5));
        heaven.classList.toggle('on', d >= 5);
        heaven.setAttribute('aria-label', `${rod.name} five`);
        heaven.addEventListener('click', () => {
          digits[i] = d >= 5 ? d - 5 : d + 5;
          renderRods();
        });
        col.appendChild(heaven);
      }
      col.appendChild(el('div', 'rod-bar'));
      const earthCount = rod.max === 3 ? 3 : 4;
      for (let k = 0; k < earthCount; k++) {
        const bead = el('button', 'bead one', rod.one);
        bead.type = 'button';
        bead.classList.toggle('on', k < d % 5);
        bead.setAttribute('aria-label', `${rod.name} ${k + 1}`);
        bead.addEventListener('click', () => {
          const fives = d >= 5 && rod.five ? 5 : 0;
          const count = k < d % 5 ? k : k + 1;
          digits[i] = fives + count;
          renderRods();
        });
        col.appendChild(bead);
      }
      col.appendChild(el('div', 'rod-name', rod.name));
      rods.appendChild(col);
    });

    const n = valueOfDigits();
    $('#rods-raw').textContent = n > 0 ? rawLetters() : '—';
    $('#rods-organized').textContent = n > 0 ? toRoman(n) : '—';
  }

  function randomRods() {
    let n = 0;
    while (n < 1) {
      digits = RODS.map((rod) => Math.floor(Math.random() * (rod.max + 1)));
      n = valueOfDigits();
    }
    renderRods();
  }

  // ---------- wiring ----------
  function init() {
    renderTiles();
    buildSpiralStatic();
    renderSpiralWindow();
    wireSpiral();
    renderStairs(7);
    wireShake();
    renderRods();

    $$('.tab-btn').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
    $('#steps-n').addEventListener('input', (e) => renderStairs(Number(e.target.value)));
    $('#pour').addEventListener('click', pour);
    $('#rods-random').addEventListener('click', randomRods);

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
