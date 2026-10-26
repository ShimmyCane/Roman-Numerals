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
  const svgEl = (tag, attrs = {}, text) => {
    const e = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (String(v).startsWith('var(')) e.style.setProperty(k, v);
      else e.setAttribute(k, v);
    });
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const randomInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  // Roman on one line, Arabic on the line below
  function showPair(prefix, n) {
    $(`#${prefix}-roman`).textContent = n > 0 ? toRoman(n) : '—';
    $(`#${prefix}-arabic`).textContent = String(n);
  }

  // ---------- tabs ----------
  function showTab(name) {
    $$('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    $$('.tab').forEach((s) => s.classList.toggle('active', s.id === `tab-${name}`));
  }

  // ---------- Start: the letters, their values on a row below, then the squares to scale ----------
  function buildLetterRow() {
    const row = $('#letter-row');
    LETTERS.forEach(({ letter, value }) => {
      const cell = el('div', 'letter-cell');
      const b = el('button', `tile ${letter}`, letter);
      b.addEventListener('click', () => {
        $('#letter-hint').textContent = `${letter} is worth ${value}.`;
      });
      cell.append(b, el('span', 'letter-num', String(value)));
      row.append(cell);
    });
  }

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
      cell.append(sq, el('div', 'tile-label', letter), el('div', 'tile-num', String(value)));
      row.appendChild(cell);
    });
  }

  // ---------- Spiral: one spiral from I onward, one turn per times ten, V at the top ----------
  const ZOOMS = [20, 50, 100, 500, 1000, MAX];
  const LOG5 = Math.log10(5);
  const SP = { cx: 200, cy: 200, base: 14, rmax: 160 };
  let zoomIndex = 0;
  let spiralN = 1;

  // The view always reaches a bit past the current number, so scrolling on zooms out gently.
  const viewMax = () => Math.min(MAX, Math.max(ZOOMS[zoomIndex], Math.ceil(spiralN * 1.25)));

  function spiralAt(n, vmax, extra = 0) {
    const t = Math.log10(n);
    const growth = (SP.rmax - SP.base) / Math.log10(vmax);
    const r = SP.base + growth * t + extra;
    const angle = 2 * Math.PI * (t - LOG5) - Math.PI / 2;
    return { x: SP.cx + r * Math.cos(angle), y: SP.cy + r * Math.sin(angle) };
  }

  // The biggest letter in a numeral is underlined: its first run. IX underlines the X.
  function numeralText(svgText, numeral) {
    const biggest = numeral.split('').reduce((a, c) => (VALUE[c] > VALUE[a] ? c : a), numeral[0]);
    const start = numeral.indexOf(biggest);
    let end = start;
    while (end < numeral.length && numeral[end] === biggest) end++;
    numeral.split('').forEach((ch, i) => {
      svgText.appendChild(svgEl('tspan', i >= start && i < end ? { 'text-decoration': 'underline' } : {}, ch));
    });
    return svgText;
  }

  // Ahead numbers only while near the start (to XV), numbers behind only to XX. After that, just the number itself.
  function spiralWindow() {
    const list = [spiralN];
    if (spiralN <= 15) for (let k = 1; k <= 4; k++) list.push(spiralN + k);
    if (spiralN <= 20) for (let k = 1; k <= 4; k++) list.push(spiralN - k);
    return list.filter((n) => n >= 1 && n <= MAX);
  }

  function renderSpiral() {
    const vmax = viewMax();
    const svg = $('#spiral-svg');
    svg.replaceChildren();

    const path = [];
    for (let i = 0; i <= 300; i++) {
      const p = spiralAt(Math.pow(vmax, i / 300), vmax);
      path.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    svg.appendChild(svgEl('polyline', { points: path.join(' '), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.4 }));

    // Every number as a small dot, all in one path so long spirals stay quick
    const r = vmax > 200 ? 1.1 : 2.4;
    let dots = '';
    for (let n = 1; n <= vmax; n++) {
      const p = spiralAt(n, vmax);
      dots += `M${(p.x - r).toFixed(1)} ${p.y.toFixed(1)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
    }
    svg.appendChild(svgEl('path', { d: dots, fill: 'var(--ink)' }));

    // The seven letters as headings on the spiral: letter, and its value on the line below
    LETTERS.filter(({ value }) => value <= vmax).forEach(({ letter, value }) => {
      const p = spiralAt(value, vmax);
      const lp = spiralAt(value, vmax, 30);
      svg.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: 9, fill: `var(--t-${letter})`, stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      const halo = { stroke: 'var(--card)', 'stroke-width': 5, 'paint-order': 'stroke', fill: 'var(--ink)', 'text-anchor': 'middle', 'font-weight': 900 };
      svg.appendChild(svgEl('text', { ...halo, x: lp.x, y: lp.y - 2, 'font-size': 20 }, letter));
      svg.appendChild(svgEl('text', { ...halo, x: lp.x, y: lp.y + 14, 'font-size': 12 }, String(value)));
    });

    // The current number, and its neighbours near the start
    const letterValues = LETTERS.map((x) => x.value);
    spiralWindow().forEach((n) => {
      const current = n === spiralN;
      const p = spiralAt(n, vmax);
      svg.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: current ? 8 : 4, fill: current ? 'var(--t-M)' : 'var(--card)', stroke: 'var(--ink)', 'stroke-width': 2 }));
      if (letterValues.includes(n) && !current) return; // the heading already names it
      const lp = spiralAt(n, vmax, current ? -26 : -20);
      const label = svgEl('text', {
        x: lp.x, y: lp.y + 5, 'text-anchor': 'middle', 'font-size': current ? 20 : 14, 'font-weight': 900,
        fill: 'var(--ink)', stroke: 'var(--card)', 'stroke-width': 4, 'paint-order': 'stroke',
      });
      svg.appendChild(numeralText(label, toRoman(n)));
    });

    $('#spiral-roman').textContent = toRoman(spiralN);
    $('#spiral-arabic').textContent = String(spiralN);
    $('#spiral-box').setAttribute('aria-valuenow', String(spiralN));
    $('#zoom-in').disabled = zoomIndex === 0;
    $('#zoom-out').disabled = zoomIndex === ZOOMS.length - 1;
  }

  function moveSpiral(step) {
    spiralN = clamp(spiralN + step, 1, MAX);
    renderSpiral();
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
      const steps = Math.trunc(carry / 14);
      if (steps) {
        carry -= steps * 14;
        moveSpiral(steps);
      }
    });
    const endDrag = () => { lastY = null; };
    box.addEventListener('pointerup', endDrag);
    box.addEventListener('pointercancel', endDrag);
    box.addEventListener('keydown', (e) => {
      const keys = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      moveSpiral(keys[e.key]);
    });
    $('#spiral-next').addEventListener('click', () => moveSpiral(1));
    $('#spiral-back').addEventListener('click', () => moveSpiral(-1));
    $('#zoom-in').addEventListener('click', () => { zoomIndex = Math.max(0, zoomIndex - 1); renderSpiral(); });
    $('#zoom-out').addEventListener('click', () => { zoomIndex = Math.min(ZOOMS.length - 1, zoomIndex + 1); renderSpiral(); });
  }

  // ---------- Steps: a ×5 step is a big step (five units up), a ×2 step a small one (two units up) ----------
  const ST = { x0: 8, base: 292, w: 40, unit: 9, block: 40 };
  // The first step is one unit; after that each step rises by its own times number
  const RISES = LETTERS.map(({ value }, i) => (i === 0 ? 1 : value / LETTERS[i - 1].value));
  const MORE = [5, 2, 5]; // the stairs carry on past M, fading out
  let stepsShown = 1;
  let stepsMode = 'roman'; // the big label on each step: a letter, or its Arabic value

  function renderStairs() {
    const svg = $('#stairs-svg');
    svg.replaceChildren();
    const { x0, base, w, unit, block } = ST;
    const treads = [];
    let y = base;
    RISES.forEach((rise) => { y -= rise * unit; treads.push(y); });

    // One solid outline of the stairs, then a lighter run of steps that carries on past M
    const pts = [[x0, base]];
    treads.forEach((t, i) => pts.push([x0 + i * w, t], [x0 + (i + 1) * w, t]));
    const end = x0 + treads.length * w;
    svg.appendChild(svgEl('polygon', { points: [...pts, [end, base]].map((p) => p.join(',')).join(' '), fill: 'var(--card)', stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
    let mx = end;
    let my = treads[treads.length - 1];
    MORE.forEach((rise, k) => {
      const ny = my - rise * unit;
      svg.appendChild(svgEl('polyline', { points: `${mx},${my} ${mx},${ny} ${mx + w},${ny}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5, opacity: 0.45 - k * 0.12 }));
      mx += w;
      my = ny;
    });

    LETTERS.forEach(({ letter, value }, i) => {
      const tread = treads[i];
      const cx = x0 + i * w + w / 2;
      if (i > 0) svg.appendChild(svgEl('text', { x: cx, y: tread + 16, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 900, fill: 'var(--link)' }, `×${RISES[i]}`));
      if (i >= stepsShown) return;
      const g = svgEl('g', { class: i === stepsShown - 1 ? 'block-new' : '' });
      g.appendChild(svgEl('rect', { x: x0 + i * w + 2, y: tread - block, width: w - 4, height: block, rx: 6, fill: `var(--t-${letter})`, stroke: 'var(--ink)', 'stroke-width': i === stepsShown - 1 ? 3.5 : 2 }));
      const big = stepsMode === 'roman' ? letter : String(value);
      const small = stepsMode === 'roman' ? String(value) : letter;
      g.appendChild(svgEl('text', { x: cx, y: tread - block / 2 + 2, 'text-anchor': 'middle', 'font-size': stepsMode === 'roman' ? 17 : (big.length > 3 ? 10 : 13), 'font-weight': 900, fill: '#2b2540' }, big));
      g.appendChild(svgEl('text', { x: cx, y: tread - 6, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: '#2b2540' }, small));
      svg.appendChild(g);
    });
    $('#steps-back').disabled = stepsShown <= 1;
    $('#steps-next').disabled = stepsShown >= LETTERS.length;
    $('#steps-roman').setAttribute('aria-pressed', String(stepsMode === 'roman'));
    $('#steps-arabic').setAttribute('aria-pressed', String(stepsMode === 'arabic'));
  }

  // ---------- Shake: pick a number; its pieces drop into a narrow cup and float about like ice cubes ----------
  let shakeN = 1;
  let bodies = []; // { el, x, y, vx, vy, s }
  const gravity = { x: 0, y: 0.35 };
  let physicsOn = false;
  let agitation = 0; // how hard the cup is being shaken; it decays after each violent shake

  function clearBodies() {
    bodies.forEach((b) => b.el.remove());
    bodies = [];
  }

  function pickShake() {
    shakeN = randomInt(1, 999);
    showPair('shake', shakeN);
    clearBodies();
  }

  // The pieces of the numeral, pairs like IX kept whole, each a square that grows with its value
  function pour() {
    clearBodies();
    const box = $('#bucket-box');
    const W = box.clientWidth;
    Roman.chunks(toRoman(shakeN)).forEach((c, i) => {
      const value = Roman.lenientValue(c.text);
      // Log scale: each times-ten is the same extra size, so 1 and 1000 both fit the cup
      const s = 14 + 22 * Math.log10(value);
      const token = el('div', `token tile-sq ${c.text[c.text.length - 1]}`, c.text);
      token.style.width = `${s}px`;
      token.style.height = `${s}px`;
      token.style.fontSize = `${Math.min(28, s * 0.42)}px`;
      box.appendChild(token);
      // They come in from the top right, one after another
      bodies.push({ el: token, s, x: W - s - 6, y: -s - i * 70, vx: -1 - Math.random() * 1.5, vy: 0 });
    });
    startPhysics();
  }

  // A violent shake throws the pieces quickly; the agitation then decays while they settle
  function jiggle(force = 20) {
    const strength = clamp(force / 30, 0.3, 1);
    agitation = Math.max(agitation, strength);
    bodies.forEach((b) => {
      b.vx += (Math.random() - 0.5) * 36 * strength;
      b.vy -= (8 + Math.random() * 14) * strength;
    });
    startPhysics();
  }

  // Sensitivity from the settings: 1 needs a hard shake, 3 a light one
  const shakeThreshold = () => 36 / Number($('#opt-shake').value);

  // A small, soft physics: gravity, walls, and squares that push each other apart
  function physicsStep() {
    const box = $('#bucket-box');
    const W = box.clientWidth;
    const H = box.clientHeight;
    if (agitation > 0.01) {
      bodies.forEach((b) => {
        b.vx += (Math.random() - 0.5) * agitation * 3;
        b.vy -= Math.random() * agitation * 0.8;
      });
      agitation *= 0.97;
    }
    bodies.forEach((b) => {
      b.vx = (b.vx + gravity.x) * 0.985;
      b.vy = (b.vy + gravity.y) * 0.985;
      b.x += b.vx;
      b.y += b.vy;
    });
    for (let pass = 0; pass < 4; pass++) {
      bodies.forEach((b) => {
        if (b.y + b.s > H - 5) { b.y = H - 5 - b.s; b.vy *= -0.25; b.vx *= 0.92; }
        if (b.x < 5) { b.x = 5; b.vx *= -0.4; }
        if (b.x + b.s > W - 5) { b.x = W - 5 - b.s; b.vx *= -0.4; }
      });
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i];
          const b = bodies[j];
          const ox = Math.min(a.x + a.s, b.x + b.s) - Math.max(a.x, b.x);
          const oy = Math.min(a.y + a.s, b.y + b.s) - Math.max(a.y, b.y);
          if (ox <= 0 || oy <= 0) continue;
          const ma = a.s * a.s;
          const mb = b.s * b.s;
          const share = mb / (ma + mb);
          if (ox < oy) {
            const dir = a.x < b.x ? -1 : 1;
            a.x += dir * ox * share;
            b.x -= dir * ox * (1 - share);
            const v = (ma * a.vx + mb * b.vx) / (ma + mb);
            a.vx = v;
            b.vx = v;
          } else {
            const dir = a.y < b.y ? -1 : 1;
            a.y += dir * oy * share;
            b.y -= dir * oy * (1 - share);
            const v = (ma * a.vy + mb * b.vy) / (ma + mb);
            a.vy = v;
            b.vy = v;
          }
        }
      }
    }
    bodies.forEach((b) => { b.el.style.transform = `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px)`; });
  }

  function startPhysics() {
    if (physicsOn) return;
    physicsOn = true;
    const frame = () => {
      if (!bodies.length) { physicsOn = false; return; }
      physicsStep();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  // Shake: tilting the phone moves gravity, a hard shake throws the pieces. iPhones ask permission first.
  function wireShake() {
    let last = 0;
    const onTilt = (e) => {
      if (e.gamma === null) return;
      gravity.x = 0.35 * Math.sin((clamp(e.gamma, -60, 60) * Math.PI) / 180);
    };
    const onMotion = (e) => {
      const a = e.acceleration;
      if (!a) return;
      const force = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
      const now = performance.now();
      if (force > shakeThreshold() && now - last > 500) {
        last = now;
        jiggle(force);
      }
    };
    let listening = false;
    $('#shake-on').addEventListener('click', async () => {
      jiggle();
      if (listening) return;
      for (const Ev of [window.DeviceOrientationEvent, window.DeviceMotionEvent]) {
        if (Ev && typeof Ev.requestPermission === 'function') await Ev.requestPermission().catch(() => 'denied');
      }
      window.addEventListener('deviceorientation', onTilt);
      window.addEventListener('devicemotion', onMotion);
      listening = true;
    });
  }

  // ---------- Rods: tap the beads. Raw = the beads as letters. Organized = the numeral. ----------
  // Each column has its own colour, under its beads and under its letters in both rows.
  const RODS = [
    { name: 'thousands', one: 'M', five: null, max: 3, place: 1000, color: '#c0392b' },
    { name: 'hundreds', one: 'C', five: 'D', max: 9, place: 100, color: '#2e86c1' },
    { name: 'tens', one: 'X', five: 'L', max: 9, place: 10, color: '#27ae60' },
    { name: 'ones', one: 'I', five: 'V', max: 9, place: 1, color: '#8e44ad' },
  ];
  let digits = [0, 0, 4, 7];

  const valueOfDigits = () => digits.reduce((acc, d) => acc * 10 + d, 0);
  const rawOf = (rod, d) => (d >= 5 && rod.five ? rod.five : '') + rod.one.repeat(d % 5);

  function groupLine(target, textOf) {
    const spans = RODS.map((rod, i) => {
      const d = digits[i];
      if (!d) return null;
      const span = el('span', 'grp', textOf(rod, d));
      span.style.borderBottomColor = rod.color;
      return span;
    }).filter(Boolean);
    target.replaceChildren(...(spans.length ? spans : [document.createTextNode('—')]));
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
        heaven.classList.toggle('on', d >= 5);
        heaven.setAttribute('aria-pressed', String(d >= 5));
        heaven.setAttribute('aria-label', `${rod.name} five`);
        heaven.addEventListener('click', () => {
          digits[i] = d >= 5 ? d - 5 : d + 5;
          renderRods();
        });
        col.appendChild(heaven);
      } else {
        col.appendChild(el('div', 'bead placeholder')); // keeps the bars in one line
      }
      col.appendChild(el('div', 'rod-bar'));
      for (let k = 0; k < 4; k++) {
        if (k >= rod.max) {
          col.appendChild(el('div', 'bead placeholder'));
          continue;
        }
        const bead = el('button', 'bead one', rod.one);
        bead.type = 'button';
        bead.classList.toggle('on', k < d % 5);
        bead.setAttribute('aria-label', `${rod.name} ${k + 1}`);
        bead.addEventListener('click', () => {
          const fives = d >= 5 && rod.five ? 5 : 0;
          digits[i] = fives + (k < d % 5 ? k : k + 1);
          renderRods();
        });
        col.appendChild(bead);
      }
      const amount = el('div', 'rod-amount', String(d * rod.place));
      amount.style.borderBottomColor = rod.color;
      col.appendChild(amount);
      rods.appendChild(col);
    });

    const n = valueOfDigits();
    groupLine($('#rods-raw'), rawOf);
    groupLine($('#rods-organized'), (rod, d) => toRoman(d * rod.place));
    $('#rods-arabic').textContent = String(n);
  }

  function randomRods() {
    do {
      digits = RODS.map((rod) => randomInt(0, rod.max));
    } while (valueOfDigits() < 1);
    renderRods();
  }

  // ---------- Board: lines are I X C M, spaces are V L D. Five on a line, or two in a space, trade up. ----------
  const BOARD = [
    { letter: 'M', value: 1000, line: true },
    { letter: 'D', value: 500, line: false },
    { letter: 'C', value: 100, line: true },
    { letter: 'L', value: 50, line: false },
    { letter: 'X', value: 10, line: true },
    { letter: 'V', value: 5, line: false },
    { letter: 'I', value: 1, line: true },
  ];
  const ROW_H = 46;
  let pebbles = BOARD.map(() => 0);
  let traded = new Set();

  const boardValue = () => pebbles.reduce((sum, c, r) => sum + c * BOARD[r].value, 0);

  // Trade from the bottom up until nothing is left to trade
  function tradeUp() {
    traded = new Set();
    let changed = true;
    while (changed) {
      changed = false;
      for (let r = BOARD.length - 1; r > 0; r--) {
        const need = BOARD[r].line ? 5 : 2;
        if (pebbles[r] >= need) {
          pebbles[r] -= need;
          pebbles[r - 1] += 1;
          traded.add(r - 1);
          changed = true;
        }
      }
    }
  }

  function addPebble(r) {
    if (boardValue() + BOARD[r].value > MAX) return;
    pebbles[r] += 1;
    tradeUp();
    renderBoard();
  }

  function setBoard(n) {
    let rest = n;
    pebbles = BOARD.map(({ value }) => {
      const c = Math.floor(rest / value);
      rest -= c * value;
      return c;
    });
    traded = new Set();
    renderBoard();
  }

  function renderBoard() {
    const svg = $('#board-svg');
    svg.replaceChildren();
    BOARD.forEach(({ letter, value, line }, r) => {
      const top = 10 + r * ROW_H;
      const mid = top + ROW_H / 2;
      if (line) svg.appendChild(svgEl('line', { x1: 60, y1: mid, x2: 350, y2: mid, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
      svg.appendChild(svgEl('text', { x: 26, y: mid - 1, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 900, fill: 'var(--ink)' }, letter));
      svg.appendChild(svgEl('text', { x: 26, y: mid + 13, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: 'var(--ink)' }, String(value)));
      for (let k = 0; k < pebbles[r]; k++) {
        svg.appendChild(svgEl('circle', { class: traded.has(r) && k === pebbles[r] - 1 ? 'pebble-new' : '', cx: 84 + k * 26, cy: mid, r: 10, fill: '#e9dcc0', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      }
      const hit = svgEl('rect', { x: 0, y: top, width: 360, height: ROW_H, fill: 'transparent', class: 'board-hit', role: 'button', 'aria-label': `Add a pebble: ${letter}` });
      hit.addEventListener('click', () => addPebble(r));
      svg.appendChild(hit);
    });
    showPair('board', boardValue());
  }

  // ---------- Clock: the minutes move in fives; IIII or IV for four ----------
  let clockMinutes = 8 * 60 + 45;
  let fourStyle = 'IIII';

  const hourNumeral = (h) => (h === 4 ? fourStyle : toRoman(h));

  function renderClock() {
    const svg = $('#clock-svg');
    svg.replaceChildren();
    const c = 180;
    svg.appendChild(svgEl('circle', { cx: c, cy: c, r: 165, fill: 'var(--card)', stroke: 'var(--ink)', 'stroke-width': 4 }));
    for (let m = 0; m < 60; m++) {
      const a = (m * 6 - 90) * Math.PI / 180;
      const long = m % 5 === 0;
      const r1 = long ? 140 : 150;
      svg.appendChild(svgEl('line', { x1: c + r1 * Math.cos(a), y1: c + r1 * Math.sin(a), x2: c + 160 * Math.cos(a), y2: c + 160 * Math.sin(a), stroke: 'var(--ink)', 'stroke-width': long ? 4 : 1.5 }));
    }
    for (let h = 1; h <= 12; h++) {
      const a = (h * 30 - 90) * Math.PI / 180;
      svg.appendChild(svgEl('text', { x: c + 115 * Math.cos(a), y: c + 115 * Math.sin(a) + 8, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 900, fill: h === 4 ? 'var(--link)' : 'var(--ink)' }, hourNumeral(h)));
    }
    const hours = Math.floor(clockMinutes / 60) % 12;
    const mins = clockMinutes % 60;
    const hand = (deg, len, width) => {
      const a = (deg - 90) * Math.PI / 180;
      svg.appendChild(svgEl('line', { x1: c, y1: c, x2: c + len * Math.cos(a), y2: c + len * Math.sin(a), stroke: 'var(--ink)', 'stroke-width': width, 'stroke-linecap': 'round' }));
    };
    hand((hours + mins / 60) * 30, 80, 8);
    hand(mins * 6, 128, 5);
    svg.appendChild(svgEl('circle', { cx: c, cy: c, r: 8, fill: 'var(--ink)' }));

    const h12 = hours === 0 ? 12 : hours;
    $('#clock-roman').textContent = mins ? `${hourNumeral(h12)} : ${toRoman(mins)}` : hourNumeral(h12);
    $('#clock-arabic').textContent = `${h12}:${String(mins).padStart(2, '0')}`;
    $('#clock-four').textContent = fourStyle;
  }

  // Drag anywhere on the clock: the minute hand follows the finger, and the hour moves on as it passes XII
  function wireClock() {
    const svg = $('#clock-svg');
    let dragging = false;
    const minuteAt = (e) => {
      const r = svg.getBoundingClientRect();
      let deg = (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI + 90;
      if (deg < 0) deg += 360;
      return Math.round(deg / 6) % 60;
    };
    const setMinute = (m) => {
      const old = clockMinutes % 60;
      let hourStart = clockMinutes - old;
      if (old >= 45 && m < 15) hourStart += 60;
      else if (old < 15 && m >= 45) hourStart -= 60;
      clockMinutes = (hourStart + m + 720) % 720;
      renderClock();
    };
    svg.addEventListener('pointerdown', (e) => {
      dragging = true;
      svg.setPointerCapture(e.pointerId);
      setMinute(minuteAt(e));
    });
    svg.addEventListener('pointermove', (e) => { if (dragging) setMinute(minuteAt(e)); });
    svg.addEventListener('pointerup', () => { dragging = false; });
    svg.addEventListener('pointercancel', () => { dragging = false; });
  }

  // ---------- Maya: dot is one, bar is five, each place up is times twenty ----------
  let mayaN = 13;

  function drawMayaDigit(svg, d, boxTop) {
    const boxBottom = boxTop + 110;
    svg.appendChild(svgEl('rect', { x: 10, y: boxTop, width: 120, height: 110, rx: 10, fill: 'none', stroke: 'var(--dots)', 'stroke-width': 2, 'stroke-dasharray': '5 5' }));
    if (d === 0) {
      // A shell for zero
      svg.appendChild(svgEl('ellipse', { cx: 70, cy: boxBottom - 40, rx: 34, ry: 15, fill: '#f5ecd7', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      svg.appendChild(svgEl('path', { d: `M44 ${boxBottom - 40} Q70 ${boxBottom - 52} 96 ${boxBottom - 40} M50 ${boxBottom - 34} Q70 ${boxBottom - 44} 90 ${boxBottom - 34}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2 }));
      return;
    }
    const bars = Math.floor(d / 5);
    const dots = d % 5;
    for (let k = 0; k < bars; k++) {
      svg.appendChild(svgEl('rect', { x: 25, y: boxBottom - 22 - k * 18, width: 90, height: 12, rx: 6, fill: 'var(--ink)' }));
    }
    const dotY = boxBottom - 22 - bars * 18 - 4;
    for (let k = 0; k < dots; k++) {
      svg.appendChild(svgEl('circle', { cx: 70 + (k - (dots - 1) / 2) * 20, cy: dotY, r: 7, fill: 'var(--ink)' }));
    }
  }

  function renderMaya() {
    const svg = $('#maya-svg');
    svg.replaceChildren();
    // The twenties sit on top, the ones at the bottom
    if (mayaN >= 20) drawMayaDigit(svg, Math.floor(mayaN / 20), 10);
    drawMayaDigit(svg, mayaN % 20, 140);
    showPair('maya', mayaN);
  }

  // ---------- China: counting rods, standing for ones and hundreds, lying for tens and thousands ----------
  let chinaN = 47;

  function drawRodDigit(svg, d, cx, standing) {
    const rod = (x1, y1, x2, y2) => svg.appendChild(svgEl('line', { x1, y1, x2, y2, stroke: 'var(--ink)', 'stroke-width': 6, 'stroke-linecap': 'round' }));
    const top = 30;
    const bottom = 110;
    const ones = d > 5 ? d - 5 : d;
    const five = d > 5;
    if (standing) {
      // Standing rods for one each; a lying rod across the top for five
      const startY = five ? top + 18 : top;
      for (let k = 0; k < ones; k++) {
        const x = cx + (k - (ones - 1) / 2) * 12;
        rod(x, startY, x, bottom);
      }
      if (five) rod(cx - 30, top, cx + 30, top);
    } else {
      // Lying rods for one each; a standing rod on top for five
      const startY = five ? 60 : 40;
      for (let k = 0; k < ones; k++) {
        const y = startY + k * 12;
        rod(cx - 30, y, cx + 30, y);
      }
      if (five) rod(cx, top, cx, startY - 10);
    }
  }

  function renderChina() {
    const svg = $('#china-svg');
    svg.replaceChildren();
    const digitsOf = [Math.floor(chinaN / 1000), Math.floor((chinaN % 1000) / 100), Math.floor((chinaN % 100) / 10), chinaN % 10];
    digitsOf.forEach((d, i) => {
      const cx = 50 + i * 87;
      svg.appendChild(svgEl('rect', { x: cx - 40, y: 18, width: 80, height: 104, rx: 8, fill: 'none', stroke: 'var(--dots)', 'stroke-width': 2, 'stroke-dasharray': '5 5' }));
      // A blank place is zero; the leading empty places stay blank too
      if (d) drawRodDigit(svg, d, cx, i % 2 === 1); // hundreds and ones stand; thousands and tens lie
    });
    showPair('china', chinaN);
  }

  // ---------- Double: halve on the left, double on the right; keep the rows with an odd left side ----------
  let doubleA = 13;
  let doubleB = 6;

  function renderDouble() {
    const sum = $('#double-sum');
    sum.replaceChildren(el('div', 'counter-roman', `${toRoman(doubleA)} × ${toRoman(doubleB)}`), el('div', 'counter-arabic', `${doubleA} × ${doubleB}`));
    const rows = $('#double-rows');
    rows.replaceChildren();
    let a = doubleA;
    let b = doubleB;
    let total = 0;
    while (a >= 1) {
      const keep = a % 2 === 1;
      if (keep) total += b;
      const row = el('div', `double-row${keep ? '' : ' crossed'}`);
      // The light is on for a kept row: read from the bottom up, the lights are the binary number
      const light = el('span', `light${keep ? ' on' : ''}`);
      light.setAttribute('aria-label', keep ? 'kept' : 'crossed out');
      const cell = (n) => {
        const c = el('div', 'double-cell');
        c.append(el('div', 'cell-roman', toRoman(n)), el('div', 'cell-arabic', String(n)));
        return c;
      };
      row.append(light, cell(a), cell(b));
      rows.appendChild(row);
      a = Math.floor(a / 2);
      b *= 2;
    }
    showPair('double', total);
  }

  // ---------- wiring ----------
  function init() {
    // Tabs first, so a failure in one feature can never leave the tabs dead
    $$('.tab-btn').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));

    buildLetterRow();
    renderTiles();
    wireSpiral();
    renderSpiral();

    renderStairs();
    $('#steps-next').addEventListener('click', () => { stepsShown = Math.min(LETTERS.length, stepsShown + 1); renderStairs(); });
    $('#steps-back').addEventListener('click', () => { stepsShown = Math.max(1, stepsShown - 1); renderStairs(); });
    $('#steps-roman').addEventListener('click', () => { stepsMode = 'roman'; renderStairs(); });
    $('#steps-arabic').addEventListener('click', () => { stepsMode = 'arabic'; renderStairs(); });

    pickShake();
    wireShake();
    $('#shake-random').addEventListener('click', pickShake);
    $('#pour').addEventListener('click', pour);

    renderRods();
    $('#rods-random').addEventListener('click', randomRods);

    renderBoard();
    $('#board-clear').addEventListener('click', () => setBoard(0));
    $('#board-random').addEventListener('click', () => setBoard(randomInt(1, 399)));

    renderClock();
    wireClock();
    $('#clock-four').addEventListener('click', () => {
      fourStyle = fourStyle === 'IIII' ? 'IV' : 'IIII';
      $('#clock-four').setAttribute('aria-pressed', String(fourStyle === 'IIII'));
      renderClock();
    });

    renderMaya();
    $('#maya-next').addEventListener('click', () => { mayaN = Math.min(399, mayaN + 1); renderMaya(); });
    $('#maya-back').addEventListener('click', () => { mayaN = Math.max(1, mayaN - 1); renderMaya(); });
    $('#maya-random').addEventListener('click', () => { mayaN = randomInt(1, 399); renderMaya(); });

    renderChina();
    $('#china-next').addEventListener('click', () => { chinaN = Math.min(MAX, chinaN + 1); renderChina(); });
    $('#china-back').addEventListener('click', () => { chinaN = Math.max(1, chinaN - 1); renderChina(); });
    $('#china-random').addEventListener('click', () => { chinaN = randomInt(1, MAX); renderChina(); });

    renderDouble();
    $('#double-random').addEventListener('click', () => { doubleA = randomInt(3, 15); doubleB = randomInt(2, 12); renderDouble(); });

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
