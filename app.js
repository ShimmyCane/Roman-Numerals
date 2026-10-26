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
    const board = el('div', 'board');
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

  // ---------- ledger steppers: every shown step stays on screen, one under the other ----------
  // Next adds one row at the bottom. Back takes the last row away. Play steps adds a row every second and a half.
  const steppers = {};
  function makeStepper(name, tallyEl) {
    const ledger = $(`#${name}-ledger`);
    const playBtn = $(`[data-play="${name}"]`);
    let steps = [];
    let shown = 0;
    let timer = null;
    let emptyText = '';

    function stepRow(s, i, current) {
      const row = el('div', `step-row${current ? ' current' : ''}`);
      const body = el('div');
      body.append(
        el('p', 'caption', s.text),
        boardEl(s.tiles),
        el('p', 'value', s.value === null ? '' : `Worth ${s.value}`),
      );
      row.append(el('div', 'step-num', String(i + 1)), body);
      return row;
    }

    function render() {
      if (!steps.length) {
        ledger.replaceChildren(el('p', 'empty', emptyText));
        if (tallyEl) tallyEl.replaceChildren();
        return;
      }
      ledger.replaceChildren(...steps.slice(0, shown).map((s, i) => stepRow(s, i, i === shown - 1)));
      ledger.scrollTop = ledger.scrollHeight;
      drawTally(tallyEl, steps[shown - 1].tiles);
    }

    function stop() {
      clearInterval(timer);
      timer = null;
      playBtn.textContent = 'Play steps';
    }

    return {
      load(newSteps, message = '') {
        stop();
        steps = newSteps;
        emptyText = message;
        shown = steps.length ? 1 : 0;
        render();
      },
      move(d) {
        if (!steps.length) return;
        stop();
        shown = Math.min(steps.length, Math.max(1, shown + d));
        sfx.tap();
        render();
      },
      togglePlay() {
        if (timer) return stop();
        if (!steps.length) return;
        if (shown >= steps.length) shown = 1;
        playBtn.textContent = 'Stop';
        render();
        timer = setInterval(() => {
          if (shown >= steps.length) return stop();
          shown++;
          sfx.tap();
          render();
        }, 1500);
      },
      stop,
    };
  }

  // ---------- undo: each entry box remembers the inputs it ran before ----------
  const lastRun = {};
  const undoStack = { build: [], addsub: [], fix: [] };
  function remember(name, text) {
    if (lastRun[name] !== undefined && lastRun[name] !== text) undoStack[name].push(lastRun[name]);
    lastRun[name] = text;
  }

  // ---------- Build & Break ----------
  function runBuild(text) {
    const s = text.trim().toUpperCase();
    if (!s) return;
    const r = Roman.check(s);
    if (r.issues.some((i) => i.rule === null)) {
      setError(r.issues[0].text);
      steppers.build.load([], 'Type letters I V X L C D M only.');
      return;
    }
    if (!r.ok) {
      setError('');
      steppers.build.load([], `"${s}": ${r.issues[0].text} Try the Fix It tab.`);
      return;
    }
    setError('');
    steppers.build.load(Roman.calculate([s], []).steps);
  }

  // ---------- Add & Subtract ----------
  function runAddSub(text) {
    const p = Roman.parse(text);
    if (p.error) {
      setError(p.error);
      steppers.addsub.load([], 'Press Random, or type a sum like XL + XX - IX.');
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

  // ---------- Fix It: good or bad numerals, one step at a time ----------
  function runFix(text) {
    const s = text.trim().toUpperCase();
    if (!s) return;
    const verdict = $('#fix-verdict');
    const issuesEl = $('#fix-issues');
    issuesEl.replaceChildren();

    const r = Roman.check(s);
    if (r.issues.some((i) => i.rule === null)) {
      verdict.textContent = '';
      verdict.className = 'verdict';
      setError(r.issues[0].text);
      steppers.fix.load([], 'Type a numeral with letters I V X L C D M.');
      return;
    }
    setError('');

    if (r.ok) {
      verdict.textContent = `Looks right! ${s} = ${r.value}`;
      verdict.className = 'verdict good';
      sfx.good();
    } else {
      verdict.textContent = r.simplest === s
        ? `${s} = ${r.value}. Right form, but it is longer than ${Roman.LETTER_LIMIT} letters.`
        : `Not quite. ${s} = ${r.value}. The simplest form is ${r.simplest}.`;
      verdict.className = 'verdict bad';
      sfx.oops();
      r.issues.forEach((issue) => {
        const box = el('div', 'issue');
        const label = el('b', '', typeof issue.rule === 'number' ? `Rule ${issue.rule}` : 'Note');
        box.append(label, ` ${issue.text}`);
        issuesEl.append(box);
      });
    }
    steppers.fix.load(Roman.fixSteps(s).steps);
  }

  // ---------- Random: each button makes a numeral or sum, then runs it like a typed one ----------
  // Each random button fills one entry box. Fix It has two buttons: a good numeral and a bad one.
  const randomMakers = {
    build: { entry: 'build', make: () => Roman.randomNumeral() },
    addsub: { entry: 'addsub', make: () => Roman.randomSum().text },
    fixgood: { entry: 'fix', make: () => Roman.randomNumeral() },
    fixbad: { entry: 'fix', make: () => Roman.randomDisarranged().numeral },
  };
  const runners = { build: runBuild, addsub: runAddSub, fix: runFix };

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

  // ---------- Look: four styles, picked in settings ----------
  function setLook(name) {
    if (name === 'sunny') document.documentElement.removeAttribute('data-style');
    else document.documentElement.dataset.style = name;
    $$('[data-style-choice]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.styleChoice === name)));
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
      + '<g font-family="Merriweather, Georgia, serif" font-size="17" font-weight="bold" fill="#2b2540" text-anchor="middle">'
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
    steppers.build = makeStepper('build', $('#build-tally'));
    steppers.addsub = makeStepper('addsub', $('#addsub-tally'));
    steppers.fix = makeStepper('fix', null);
    steppers.build.load([], 'Press Random, or type a numeral.');
    steppers.addsub.load([], 'Press Random, or type a sum like XL + XX - IX.');
    steppers.fix.load([], 'Press a Random button, or type a numeral.');
    buildLetterRow();
    renderDemos();

    $$('.tab-btn').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));

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
    $$('[data-style-choice]').forEach((b) => b.addEventListener('click', () => setLook(b.dataset.styleChoice)));
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
