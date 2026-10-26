(function () {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const { VALUE } = Roman;
  const LETTERS = ['I', 'V', 'X', 'L', 'C', 'D', 'M'];

  let soundOn = true;
  let showErrors = false;
  let currentError = '';

  // Small helper to make an element with a class and text.
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  const CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const X_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>';
  const mark = (good) => {
    const m = el('span', `mark ${good ? 'good' : 'bad'}`);
    m.innerHTML = good ? CHECK_SVG : X_SVG;
    m.setAttribute('aria-label', good ? 'right' : 'wrong');
    return m;
  };

  // ---------- sound (synthesized, no files) ----------
  let audio = null;
  function beep(freqs, step = 0.09) {
    if (!soundOn) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = audio.currentTime;
      freqs.forEach((f, i) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = 'triangle';
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.0001, t0 + i * step);
        gain.gain.exponentialRampToValueAtTime(0.18, t0 + i * step + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + i * step + step + 0.08);
        osc.connect(gain).connect(audio.destination);
        osc.start(t0 + i * step);
        osc.stop(t0 + i * step + step + 0.1);
      });
    } catch (e) {
      // No audio available: the page still works.
    }
  }
  const sfx = {
    tap: () => beep([660]),
    good: () => beep([523, 659, 784]),
    oops: () => beep([330, 262]),
  };

  // ---------- errors (bottom panel, only when Show errors is on) ----------
  function setError(msg) {
    currentError = msg || '';
    renderErrors();
  }
  function renderErrors() {
    $('#errors-text').textContent = currentError;
    $('#errors').hidden = !(showErrors && currentError);
  }

  // ---------- tiles and boards ----------
  // A tile is coloured by its biggest letter, so XL takes the L colour and IX takes the X colour.
  function tileEl(t) {
    const biggest = [...t.ch].reduce((a, b) => (VALUE[b] > VALUE[a] ? b : a));
    return el('div', `tile ${biggest} ${t.st}${t.ch.length > 1 ? ' pair' : ''}`, t.ch);
  }

  function boardEl(tiles) {
    const board = el('div', tiles.length ? 'board' : 'board empty-board');
    board.append(...tiles.map(tileEl));
    return board;
  }

  // "How to read this": count what is on the board right now.
  function drawTally(tallyEl, tiles) {
    if (!tallyEl) return;
    const counts = {};
    tiles.forEach((t) => {
      if (t.st !== 'cross') counts[t.ch] = (counts[t.ch] || 0) + 1;
    });
    const order = Object.keys(counts).sort((a, b) => Roman.lenientValue(b) - Roman.lenientValue(a));
    let total = 0;
    const rows = order.map((ch) => {
      const n = counts[ch];
      const each = Roman.lenientValue(ch);
      total += n * each;
      return `<div><span>${n} × ${ch} (${each} each)</span><span>${n * each}</span></div>`;
    });
    if (rows.length) rows.push(`<div class="total"><span>Total</span><span>${total}</span></div>`);
    tallyEl.innerHTML = rows.join('');
  }

  // ---------- ledger steppers ----------
  // Rows are added and removed at the end only. A row that is already on screen is never rebuilt,
  // so its tiles do not replay their animation when the user presses Play steps or Next.
  const steppers = {};
  function makeStepper(name, { renderRow, onShow, tallyEl }) {
    const ledger = $(`#${name}-ledger`);
    const playBtn = $(`[data-play="${name}"]`);
    let steps = [];
    let shown = 0;
    let timer = null;
    let emptyText = '';
    const rows = [];

    function clearRows() {
      rows.splice(0).forEach((r) => r.remove());
      ledger.querySelectorAll('.empty').forEach((e) => e.remove());
    }

    function sync() {
      if (!steps.length) {
        clearRows();
        ledger.replaceChildren(el('p', 'empty', emptyText));
        if (tallyEl) tallyEl.replaceChildren();
        if (onShow) onShow([]);
        return;
      }
      ledger.querySelectorAll('.empty').forEach((e) => e.remove());
      while (rows.length < shown) {
        const row = renderRow(steps[rows.length], rows.length);
        rows.push(row);
        ledger.append(row);
      }
      while (rows.length > shown) rows.pop().remove();
      rows.forEach((r, i) => r.classList.toggle('current', i === shown - 1));
      ledger.scrollTop = ledger.scrollHeight;
      if (tallyEl) drawTally(tallyEl, steps[shown - 1].board || []);
      if (onShow) onShow(steps.slice(0, shown));
    }

    function stop() {
      clearInterval(timer);
      timer = null;
      playBtn.textContent = 'Play steps';
    }

    return {
      load(newSteps, message = '') {
        stop();
        clearRows();
        steps = newSteps;
        emptyText = message;
        shown = steps.length ? 1 : 0;
        sync();
      },
      move(d) {
        if (!steps.length) return;
        stop();
        shown = Math.min(steps.length, Math.max(1, shown + d));
        sfx.tap();
        sync();
      },
      togglePlay() {
        if (timer) return stop();
        if (!steps.length) return;
        if (shown >= steps.length) {
          clearRows();
          shown = 1;
        }
        playBtn.textContent = 'Stop';
        sync();
        timer = setInterval(() => {
          if (shown >= steps.length) return stop();
          shown++;
          sfx.tap();
          sync();
        }, 1600);
      },
      stop,
    };
  }

  // ---------- undo: each entry box remembers the inputs it ran before ----------
  const lastRun = {};
  const undoStack = { addsub: [], fix: [] };
  function remember(name, text) {
    if (lastRun[name] !== undefined && lastRun[name] !== text) undoStack[name].push(lastRun[name]);
    lastRun[name] = text;
  }

  // ---------- Add & Subtract: the line of the sum, with the board below ----------
  function eqLine(tokens) {
    const line = el('div', 'eq-line');
    tokens.forEach((t) => {
      if (t.op) {
        line.append(el('span', 'eq-op', t.text));
      } else if (t.res) {
        line.append(el('span', 'tok res', t.text));
      } else if (t.focus && t.becomes) {
        line.append(el('span', 'tok focus', t.text), el('span', 'eq-arrow', '→'), el('span', 'tok new', t.becomes));
      } else if (t.focus) {
        line.append(el('span', 'tok focus', t.text));
      } else {
        line.append(el('span', `tok${t.st === 'done' ? ' done' : ''}`, t.text));
      }
    });
    return line;
  }

  function addsubRow(s, i, current) {
    const row = el('div', `step-row${current ? ' current' : ''}`);
    const inner = el('div');
    inner.append(el('p', 'caption', s.text), eqLine(s.line), boardEl(s.board));
    if (s.value !== null) inner.append(el('p', 'value', `Worth ${s.value}`));
    row.append(el('div', 'step-num', String(i + 1)), inner);
    return row;
  }

  function runAddSub(text) {
    const p = Roman.parse(text);
    if (p.error) {
      setError(p.error);
      steppers.addsub.load([], 'Press Random, or type a sum like XLI + XIX.');
      return;
    }
    const wrong = p.terms.find((t) => !Roman.check(t).ok);
    if (wrong) {
      setError('');
      steppers.addsub.load([], `"${wrong}": ${Roman.check(wrong).issues[0].text} Try the Fix It tab first.`);
      return;
    }
    const out = Roman.calculate(p.terms, p.ops);
    setError(out.error || '');
    steppers.addsub.load(out.steps);
  }

  // ---------- Fix It: a bad numeral, one repair at a time ----------
  function fixRow(s, i) {
    const row = el('div', 'step-row');
    const inner = el('div');
    if (s.kind === 'start') {
      inner.append(el('p', 'caption', 'Written as typed.'), boardEl(s.tiles));
    } else if (s.kind === 'repair') {
      inner.append(el('p', 'caption', s.label));
      const pair = el('div', 'repair-pair');
      pair.append(boardEl(s.before), el('span', 'arrow', '→'), boardEl(s.after));
      inner.append(pair);
    } else {
      inner.append(el('p', 'caption', s.ok ? `Right form: ${s.result}.` : `Simplest form: ${s.result}.`), boardEl(s.tiles));
      const status = el('p', 'value');
      status.append(mark(s.ok), ' ', s.ok ? 'Done' : 'Still not right');
      inner.append(status);
    }
    row.append(el('div', 'step-num', String(i + 1)), inner);
    return row;
  }

  // The right-hand list: each rule that has come up so far, in the order it was broken.
  function showFixRules(shownSteps) {
    const list = $('#fix-rules');
    const found = shownSteps.filter((s) => s.kind === 'repair');
    if (!shownSteps.length) {
      list.replaceChildren(el('li', 'none', 'Type or pick a numeral.'));
      return;
    }
    if (!found.length) {
      const finished = shownSteps[shownSteps.length - 1].kind === 'done';
      list.replaceChildren(el('li', 'none', finished ? 'None. This numeral follows the rules.' : 'None yet.'));
      return;
    }
    list.replaceChildren(...found.map((s) => {
      const li = el('li');
      li.append(mark(false), el('span', '', s.label));
      return li;
    }));
  }

  function runFix(text) {
    const s = text.trim().toUpperCase();
    if (!s) return;
    const verdict = $('#fix-verdict');
    const r = Roman.check(s);
    if (r.issues.some((i) => i.rule === null)) {
      verdict.textContent = '';
      verdict.className = 'verdict';
      setError(r.issues[0].text);
      steppers.fix.load([], 'Type a numeral with letters I V X L C D M.');
      return;
    }
    setError('');
    const plan = Roman.repairPlan(s);
    if (r.ok) {
      verdict.textContent = `Looks right! ${s} = ${r.value}`;
      verdict.className = 'verdict good';
      sfx.good();
    } else {
      verdict.textContent = `Not quite. ${s} = ${r.value}. The simplest form is ${plan.result}.`;
      verdict.className = 'verdict bad';
      sfx.oops();
    }
    steppers.fix.load(plan.steps);
  }

  // ---------- Random: each button makes a numeral or sum, then runs it like a typed one ----------
  const randomMakers = {
    addsub: { entry: 'addsub', make: () => Roman.randomSum().text },
    fixbad: { entry: 'fix', make: () => Roman.randomDisarranged().numeral },
  };
  const runners = { addsub: runAddSub, fix: runFix };

  function runRandom(key) {
    const { entry, make } = randomMakers[key];
    const text = make();
    $(`form[data-entry="${entry}"] input`).value = text;
    remember(entry, text);
    runners[entry](text);
  }

  // ---------- Quiz: letters and true / false / ambiguous ----------
  // `carry` holds misses for the rest of this visit only. Refreshing the page clears them, and so does Forget my mistakes.
  const quiz = { round: 0, carry: [], batch: [], index: 0, correct: 0, current: null, answered: false, timer: null };

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const TRUE_FALSE = Roman.TRUE_FALSE;
  const TF_OPTIONS = ['True', 'False', 'Ambiguous'];

  // Letters asked both ways (letter to value, value to letter), plus the True / False / Ambiguous items.
  function allItems() {
    const letters = LETTERS.flatMap((ch) => [
      { kind: 'letter', prompt: ch, answer: String(VALUE[ch]) },
      { kind: 'value', prompt: String(VALUE[ch]), answer: ch },
    ]);
    const tf = TRUE_FALSE.map((t) => ({ kind: 'tf', prompt: t.prompt, answer: t.answer, why: t.why }));
    return letters.concat(tf);
  }

  // Two answers per question: the right one and one wrong one.
  function optionsFor(item) {
    const pool = item.kind === 'tf' ? TF_OPTIONS : item.kind === 'letter' ? Object.values(VALUE).map(String) : LETTERS;
    const wrong = shuffle(pool.filter((x) => x !== item.answer))[0];
    return shuffle([item.answer, wrong]);
  }

  // A missed question comes back as a similar question, not the same one.
  function similarItem(item) {
    if (item.kind === 'letter') return { kind: 'value', prompt: String(VALUE[item.prompt]), answer: item.prompt };
    if (item.kind === 'value') return { kind: 'letter', prompt: item.answer, answer: String(VALUE[item.answer]) };
    const others = TRUE_FALSE.filter((t) => t.answer === item.answer && t.prompt !== item.prompt);
    if (!others.length) return item;
    const pick = shuffle(others)[0];
    return { kind: 'tf', prompt: pick.prompt, answer: pick.answer, why: pick.why };
  }

  function explain(item) {
    if (item.kind === 'tf') return item.why ? `${item.answer}. ${item.why}` : `${item.answer}`;
    return `${item.prompt} is ${item.answer}`;
  }

  function startRound() {
    quiz.round++;
    quiz.batch = quiz.carry.splice(0, 5);
    if (!quiz.batch.length) quiz.batch = shuffle(allItems()).slice(0, 5);
    quiz.index = 0;
    quiz.correct = 0;
    $('#quiz-next').hidden = true;
    $('#quiz-round').textContent = `Round ${quiz.round}`;
    askNext();
  }

  function askNext() {
    if (quiz.index >= quiz.batch.length) return endRound();
    const item = quiz.batch[quiz.index];
    quiz.current = item;
    quiz.answered = false;
    const prompt = $('#quiz-prompt');
    prompt.textContent = item.prompt;
    prompt.classList.toggle('long', item.prompt.length > 8);
    $('#quiz-left').textContent = `${quiz.index + 1} of ${quiz.batch.length}`;
    $('#quiz-feedback').textContent = '';
    const options = $('#quiz-options');
    options.replaceChildren(...optionsFor(item).map((o) => {
      const b = el('button', 'big-btn ghost', o);
      b.addEventListener('click', () => choose(o, b));
      return b;
    }));
  }

  function choose(answer, button) {
    if (quiz.answered) return;
    quiz.answered = true;
    const item = quiz.current;
    const right = answer === item.answer;
    button.classList.add(right ? 'right' : 'wrong');
    if (right) {
      quiz.correct++;
      sfx.good();
      $('#quiz-feedback').textContent = '✓ Right';
    } else {
      quiz.carry.push(similarItem(item));
      sfx.oops();
      $('#quiz-feedback').textContent = `✗ ${explain(item)}`;
      [...$('#quiz-options').children].forEach((b) => {
        if (b.textContent === item.answer) b.classList.add('right');
      });
    }
    clearTimeout(quiz.timer);
    quiz.timer = setTimeout(() => {
      quiz.index++;
      askNext();
    }, right ? 500 : 1500);
  }

  function endRound() {
    const left = quiz.carry.length;
    $('#quiz-prompt').textContent = '🎉';
    $('#quiz-prompt').classList.remove('long');
    $('#quiz-options').replaceChildren();
    $('#quiz-left').textContent = '';
    $('#quiz-feedback').textContent = `${quiz.correct} of ${quiz.batch.length} right`;
    const next = $('#quiz-next');
    next.textContent = left ? `Next round (${left} to repeat)` : 'New round';
    next.hidden = false;
  }

  // ---------- Settings: forget mistakes (quiz only) ----------
  function forgetMistakes() {
    quiz.carry = [];
    if (!$('#quiz-next').hidden) $('#quiz-next').textContent = 'New round';
    $('#forget-note').textContent = 'Mistakes forgotten.';
  }

  // ---------- Look: each look is a whole stylesheet in looks/, swapped by the settings buttons ----------
  const LOOKS = ['sunny', 'chalk', 'notebook', 'candy'];
  function setLook(name) {
    if (!LOOKS.includes(name)) name = 'sunny';
    $('#look-css').href = `looks/${name}.css`;
    $$('[data-look]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.look === name)));
  }

  // ---------- Rules: five rules on the left, examples on the right ----------
  const ok = (numeral, note) => ({ good: true, numeral, note });
  const bad = (numeral, fix, note) => ({ good: false, numeral, fix, note });
  const RULES = {
    1: {
      title: 'Rule 1',
      text: 'Equal letters in a row are added. No more than three in a row.',
      examples: [ok('III', '= 3'), ok('XXX', '= 30'), bad('IIII', 'IV'), bad('XXXX', 'XL')],
    },
    2: {
      title: 'Rule 2',
      text: 'A smaller letter on the right of a bigger one is added. No more than three.',
      examples: [ok('VI', '= 6'), ok('XVIII', '= 18'), bad('VIIII', 'IX')],
    },
    3: {
      title: 'Rule 3',
      text: 'A smaller letter on the left of a bigger one is taken away. Only one, never a few.',
      examples: [ok('IV', '= 4'), ok('XL', '= 40'), ok('CM', '= 900'), bad('IIX', 'X', 'only one I before the X')],
    },
    4: {
      title: 'Rule 4',
      text: 'Wording not supplied yet. These are the pairs the tool uses; the rule wording comes from the ORC unit.',
      examples: [ok('IV', '= 4'), ok('IX', '= 9'), ok('XL', '= 40'), ok('XC', '= 90'), ok('CD', '= 400'), ok('CM', '= 900')],
    },
    5: {
      title: 'Rule 5',
      text: 'Always write it in the simplest form.',
      examples: [bad('VV', 'X'), bad('LL', 'C'), bad('IIII', 'IV')],
    },
  };

  function showRule(n) {
    const rule = RULES[n];
    $$('.rule-btn').forEach((b) => {
      const on = Number(b.dataset.rule) === n;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    $('#rule-title').textContent = rule.title;
    $('#rule-text').textContent = rule.text;
    const box = $('#rule-examples');
    box.replaceChildren(...rule.examples.map((ex) => {
      const line = el('div', 'example');
      line.append(el('span', 'strip', ex.numeral));
      if (ex.good) {
        line.append(el('span', 'equals', ex.note), mark(true));
      } else {
        line.append(mark(false), el('span', 'arrow', '→'), el('span', 'strip', ex.fix), mark(true));
      }
      if (ex.note && !ex.good) line.append(el('span', 'note', ex.note));
      return line;
    }));
  }

  // ---------- Long Ago: counting board pictures ----------
  // One pebble per unit, tens on the left, ones on the right. Drawn from fixed numbers only.
  function countingBoardSVG(tens, ones) {
    const pebble = (x, y) => `<circle cx="${x}" cy="${y}" r="8" fill="#ffe9a6" stroke="#2b2540" stroke-width="2.5"/>`;
    const column = (x, n) => Array.from({ length: n }, (_, k) => pebble(x, 190 - 18 * k)).join('');
    return `<svg class="board-art" viewBox="0 0 300 220" role="img" aria-label="${tens} tens and ${ones} ones">`
      + '<g stroke="#2b2540" stroke-width="3" stroke-linecap="round">'
      + '<line x1="90" y1="16" x2="90" y2="200"/><line x1="210" y1="16" x2="210" y2="200"/><line x1="40" y1="204" x2="260" y2="204"/></g>'
      + column(90, tens) + column(210, ones)
      + '<g font-family="Georgia, serif" font-size="17" font-weight="bold" fill="#2b2540" text-anchor="middle">'
      + '<text x="90" y="218">10s</text><text x="210" y="218">1s</text></g></svg>';
  }

  const DEMOS = {
    'add-simple': [
      { text: '23 is 2 tens and 3 ones. Put it on the board.', tens: 2, ones: 3 },
      { text: 'Add 14: 1 more ten and 4 more ones. Tens: 3. Ones: 7.', tens: 3, ones: 7 },
      { text: '37, which is XXXVII.', tens: 3, ones: 7 },
    ],
    'add-carry': [
      { text: '27 is 2 tens and 7 ones.', tens: 2, ones: 7 },
      { text: 'Add 18: 1 more ten and 8 more ones. 7 + 8 makes 15 ones. Swap 10 ones for 1 ten: 4 tens and 5 ones.', tens: 4, ones: 5 },
      { text: '45, which is XLV.', tens: 4, ones: 5 },
    ],
    subtract: [
      { text: '40 is 4 tens and no ones.', tens: 4, ones: 0 },
      { text: 'Take away 18. There are no ones to take from, so trade 1 ten for 10 ones: 3 tens and 10 ones.', tens: 3, ones: 10 },
      { text: 'Take away 1 ten and 8 ones: 2 tens and 2 ones, which is 22, or XXII.', tens: 2, ones: 2 },
    ],
  };

  function renderDemos() {
    $$('[data-demo]').forEach((box) => {
      const steps = DEMOS[box.dataset.demo] || [];
      box.replaceChildren(...steps.map((s) => {
        const step = el('div', 'step');
        step.append(el('p', '', s.text));
        const wrap = el('div');
        wrap.innerHTML = countingBoardSVG(s.tens, s.ones);
        step.append(wrap);
        return step;
      }));
    });
    $$('[data-figure]').forEach((box) => {
      const [tens, ones] = box.dataset.figure.split(',').map(Number);
      box.innerHTML = countingBoardSVG(tens, ones);
    });
  }

  // ---------- Letters ----------
  function buildLetterRow() {
    const row = $('#letter-row');
    LETTERS.forEach((ch) => {
      const b = el('button', `tile ${ch}`, ch);
      b.addEventListener('click', () => {
        $('#letter-hint').textContent = `${ch} is worth ${VALUE[ch]}.`;
        beep([VALUE[ch] > 100 ? 392 : 523 + VALUE[ch] / 10]);
      });
      row.append(b);
    });
  }

  // ---------- tabs, forms, gear ----------
  function showTab(name) {
    $$('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    $$('.tab').forEach((s) => s.classList.toggle('active', s.id === `tab-${name}`));
    sfx.tap();
  }

  function init() {
    steppers.addsub = makeStepper('addsub', { renderRow: addsubRow, tallyEl: $('#addsub-tally') });
    steppers.fix = makeStepper('fix', { renderRow: fixRow, onShow: showFixRules });
    steppers.addsub.load([], 'Press Random, or type a sum like XLI + XIX.');
    steppers.fix.load([], 'Press Random bad numeral, or type your own.');
    buildLetterRow();
    renderDemos();
    showRule(1);

    $$('.tab-btn').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
    $$('.rule-btn').forEach((b) => b.addEventListener('click', () => showRule(Number(b.dataset.rule))));

    $$('form[data-entry]').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = form.dataset.entry;
        const text = form.querySelector('input').value;
        remember(name, text);
        runners[name](text);
      });
    });

    $$('[data-random]').forEach((b) => b.addEventListener('click', () => runRandom(b.dataset.random)));

    $$('[data-undo]').forEach((b) => b.addEventListener('click', () => {
      const name = b.dataset.undo;
      const prev = undoStack[name].pop();
      if (prev === undefined) return;
      document.querySelector(`form[data-entry="${name}"] input`).value = prev;
      lastRun[name] = prev;
      runners[name](prev);
    }));

    $$('[data-step]').forEach((b) => b.addEventListener('click', () => {
      steppers[b.dataset.step].move(Number(b.dataset.dir));
    }));
    $$('[data-play]').forEach((b) => b.addEventListener('click', () => {
      steppers[b.dataset.play].togglePlay();
    }));

    $('#quiz-next').addEventListener('click', startRound);
    startRound();

    const drawer = $('#drawer');
    $('#gear').addEventListener('click', () => {
      drawer.hidden = !drawer.hidden;
      $('#gear').setAttribute('aria-expanded', String(!drawer.hidden));
      $('#forget-note').textContent = '';
    });
    $('#drawer-close').addEventListener('click', () => { drawer.hidden = true; });
    $('#forget').addEventListener('click', forgetMistakes);
    $$('[data-look]').forEach((b) => b.addEventListener('click', () => setLook(b.dataset.look)));
    $('#opt-sound').addEventListener('change', (e) => { soundOn = e.target.checked; });
    $('#opt-errors').addEventListener('change', (e) => {
      showErrors = e.target.checked;
      renderErrors();
    });
    $('#opt-pictures').addEventListener('change', (e) => {
      document.body.classList.toggle('no-pictures', !e.target.checked);
    });
    setLook('sunny');
  }

  init();
})();
