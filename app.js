(function () {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const { VALUE } = Roman;
  const LETTERS = ['I', 'V', 'X', 'L', 'C', 'D', 'M'];
  const PAIRS = Object.keys(Roman.PAIR_PIECES);

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

  // Letters of the same kind sit in one run (XXXX), so a very long pile that must break over two lines
  // breaks only where the letter changes, never in the middle of a run.
  function runsOf(tiles, makeTile) {
    const runs = [];
    tiles.forEach((t) => {
      const last = runs[runs.length - 1];
      if (last && last.dataset.ch === t.ch) return last.append(makeTile(t));
      const run = el('span', 'run');
      run.dataset.ch = t.ch;
      run.append(makeTile(t));
      runs.push(run);
    });
    return runs;
  }

  // Runs of letters, with the letters just put in (st 'new') together over one underline.
  function piecesOf(tiles, makeTile) {
    const out = [];
    for (let i = 0; i < tiles.length;) {
      let j = i;
      while (j < tiles.length && (tiles[j].st === 'new') === (tiles[i].st === 'new')) j++;
      const runs = runsOf(tiles.slice(i, j), makeTile);
      if (tiles[i].st === 'new') {
        const made = el('span', 'made');
        made.append(...runs);
        out.push(made);
      } else out.push(...runs);
      i = j;
    }
    return out;
  }

  function boardEl(tiles) {
    const board = el('div', tiles.length ? 'board fit' : 'board empty-board');
    board.append(...piecesOf(tiles, tileEl));
    return board;
  }

  // ---------- fit: a numeral is never split over two lines ----------
  // Each line of working (.fit) keeps its letters on one line. When the screen is too narrow, the letters and
  // bubbles on that line get smaller (--fit) until it fits. Before → after pairs that would get too small stack
  // instead, one numeral under the other.
  const MIN_FIT = 0.35;
  const EQ_MIN_FIT = 0.65;
  const WRAP_FIT = 0.6; // size of a line that has had to break, so it stays compact
  function fitOne(line, start = 1, min = MIN_FIT) {
    let f = start;
    line.style.setProperty('--fit', String(f));
    // How much room there is for the widest part: the line itself, or a board inside it.
    const room = () => Math.min(...[line, ...line.querySelectorAll('.board')].map((b) => b.clientWidth / b.scrollWidth));
    for (let k = 0; k < 6 && room() < 0.995; k++) {
      f = Math.max(min, f * room() * 0.97);
      line.style.setProperty('--fit', String(f));
      if (f === min) break;
    }
    return f;
  }
  function fitAll(root = document) {
    const tooWide = (line) => [line, ...line.querySelectorAll('.board')].some((b) => b.scrollWidth > b.clientWidth + 1);
    root.querySelectorAll('.repair-pair').forEach((pair) => {
      pair.classList.remove('stacked');
      pair.querySelectorAll('.board').forEach((b) => b.classList.remove('wrap'));
      if (fitOne(pair) < 0.7) {
        pair.classList.add('stacked');
        // Last resort for a very long pile: it breaks where the letter changes.
        if (fitOne(pair) === MIN_FIT && tooWide(pair)) {
          pair.querySelectorAll('.board').forEach((b) => b.classList.add('wrap'));
          fitOne(pair, WRAP_FIT);
        }
      }
    });
    root.querySelectorAll('.fit').forEach((line) => {
      if (line.closest('.repair-pair')) return;
      line.classList.remove('wrap', 'piles');
      // Last resort: a long equation puts its numbers on more than one line, each number still whole;
      // a long pile breaks where the letter changes.
      // The equation keeps a readable size: it breaks between numbers before its letters get very small.
      const min = line.matches('.eq-full') ? EQ_MIN_FIT : MIN_FIT;
      if (fitOne(line, 1, min) === min && line.matches('.eq-full, .board') && tooWide(line)) {
        line.classList.add('wrap');
        // Still too wide: a long pile of letters in the equation breaks where the letter changes.
        if (fitOne(line, WRAP_FIT) === MIN_FIT && tooWide(line) && line.matches('.eq-full')) {
          line.classList.add('piles');
          fitOne(line, WRAP_FIT);
        }
      }
    });
  }
  let fitTimer = null;
  const refitSoon = () => {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(() => fitAll(), 60);
  };

  // ---------- read aloud (a setting; uses the browser's speech if it has any) ----------
  function speak(text) {
    if (!$('#opt-aloud').checked || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  // ---------- ledger steppers ----------
  // Rows are added and removed at the end only. A row that is already on screen is never rebuilt,
  // so its tiles do not replay their animation when the user presses Play steps or Next.
  const steppers = {};
  const stepSpeed = () => Number($('#opt-speed').value) || 1600;
  // showAll (a function): when it returns true, a new set of steps appears whole, every row at once.
  // Otherwise only the first step shows, and Next step reveals the rest. Back, Next and Play always step through it.
  function makeStepper(name, { renderRow, onShow, showAll = () => false }) {
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
      fitAll(ledger);
      rows.forEach((r, i) => r.classList.toggle('current', i === shown - 1));
      ledger.scrollTop = ledger.scrollHeight;
      speak(steps[shown - 1].text);
      if (onShow) onShow(steps.slice(0, shown), steps.length);
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
        shown = steps.length ? (showAll() ? steps.length : 1) : 0;
        sync();
        ledger.scrollTop = 0;
      },
      all() {
        if (!steps.length) return;
        stop();
        shown = steps.length;
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
        }, stepSpeed());
      },
      stop,
    };
  }

  // ---------- undo: each entry box remembers the inputs it ran before ----------
  const lastRun = {};
  const undoStack = { addsub: [], fix: [], regroup: [] };
  function remember(name, text) {
    if (lastRun[name] !== undefined && lastRun[name] !== text) undoStack[name].push(lastRun[name]);
    lastRun[name] = text;
  }

  // ---------- Add & Subtract: each row is one change ----------
  // A row is either a line of letters (the sum, a slide-in, a cross-out, the answer) or the place boxes
  // (thousands, hundreds, tens, ones). A box that changed in this step is highlighted and shows old → new.
  function tokenEl(t) {
    if (t.op) return el('span', 'eq-op', t.text);
    return el('span', `tok${t.st === 'focus' ? ' focus' : ''}${t.st === 'cross' ? ' done' : ''}`, t.text);
  }

  function lineEl(tokens) {
    const line = el('div', 'eq-line fit');
    line.append(...tokens.map(tokenEl));
    return line;
  }

  // The numbers in one place, with + or − between them. An empty place says so.
  function itemsEl(items) {
    const wrap = el('span', 'place-items');
    if (!items.length) wrap.append(el('span', 'place-empty', 'nothing'));
    items.forEach((it, k) => {
      if (k || it.sign < 0) wrap.append(el('span', 'eq-op', it.sign < 0 ? '−' : '+'));
      const tok = el('span', `tok${it.fresh ? ' focus' : ''}`, it.text);
      // A letter that just moved up from the place below sits over an underline.
      if (it.fresh) {
        const made = el('span', 'made');
        made.append(tok);
        wrap.append(made);
      } else wrap.append(tok);
    });
    return wrap;
  }

  function placesEl(boxes) {
    const row = el('div', 'place-row');
    boxes.forEach((b) => {
      const box = el('div', `place-box${b.focus ? ' focus' : ''}`);
      const body = el('div', 'place-body fit');
      if (b.focus && b.was) {
        const was = itemsEl(b.was);
        was.classList.add('was');
        // What the place holds now is the replacement, so it sits over an underline.
        const now = el('span', 'made');
        now.append(itemsEl(b.items));
        body.append(was, el('span', 'eq-arrow', '→'), now);
      } else {
        body.append(itemsEl(b.items));
      }
      box.append(el('div', 'place-label', b.label), body);
      row.append(box);
    });
    return row;
  }

  // The whole equation, on its own line at the top of a row. Parts already taken away are crossed out,
  // and the last row adds = and the answer.
  // Letters taken away are crossed out, letters just replaced are faded, and new letters sit over an underline.
  const TOK_STATE = { cross: ' done', gone: ' gone', new: ' focus' };
  // A pile (the letters after =, before they are regrouped) may break where the letter changes on a narrow
  // screen. A numeral never breaks.
  const numEl = (tiles, pile = false) => {
    const num = el('span', pile ? 'eq-num pile' : 'eq-num');
    num.append(...piecesOf(tiles, (t) => el('span', `tok${TOK_STATE[t.st] || ''}`, t.ch)));
    return num;
  };
  // The equation's right side (after =) is ? until the left side is done; then the side being worked is in focus.
  function eqEl(eq) {
    const line = el('div', 'eq-full fit');
    const left = eq.focus ? el('span', `side${eq.focus === 'left' ? ' on' : ''}`) : line;
    // A number already being worked on (letters crossed out or traded) is a pile too; one as written is not.
    eq.items.forEach((it) => left.append(it.kind === 'op' ? el('span', 'eq-op', it.text) : numEl(it.tiles, it.tiles.some((t) => t.st !== 'normal'))));
    if (left !== line) line.append(left);
    if (eq.result) line.append(el('span', 'eq-op', '='), el('span', 'tok res', eq.result));
    else if (eq.right) {
      line.append(el('span', 'eq-op', '='));
      const right = el('span', `side${eq.focus === 'right' ? ' on' : ''}`);
      right.append(eq.right === 'ask' ? el('span', 'tok ask', '?') : numEl(eq.right, true));
      line.append(right);
    }
    return line;
  }

  // A caption with more than one sentence gets one line per sentence.
  function captionEl(text) {
    const cap = el('div', 'caption');
    text.split(/(?<=\.)\s+(?=[A-Z])/).forEach((line) => cap.append(el('p', '', line)));
    return cap;
  }

  function addsubRow(s, i) {
    if (s.kind === 'start' || s.kind === 'repair' || s.kind === 'done') return fixRow(s, i);
    if (s.kind === 'eq') {
      // Regrouping: everything happens on the one equation line.
      const row = el('div', 'step-row');
      const inner = el('div');
      const work = el('div', 'work');
      work.append(eqEl(s.eq));
      inner.append(captionEl(s.label), work);
      if (s.ok !== undefined) {
        const status = el('p', 'value');
        status.append(mark(s.ok), ' ', s.ok ? 'Done' : 'Still not right');
        inner.append(status);
      }
      row.append(el('div', 'step-num', Roman.toRoman(i + 1)), inner);
      return row;
    }
    const row = el('div', 'step-row');
    const inner = el('div');
    // The caption sits outside. The working sits in its own window, under the whole equation, so the two never blend.
    const work = el('div', 'work');
    if (s.eq) work.append(eqEl(s.eq));
    // A row whose only job is to show the equation has no working under it.
    if (s.kind === 'places') work.append(placesEl(s.boxes));
    else if (s.tokens.length) work.append(lineEl(s.tokens));
    inner.append(captionEl(s.text), work);
    row.append(el('div', 'step-num', Roman.toRoman(i + 1)), inner);
    return row;
  }

  function runAddSub(text) {
    renderProblem();
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
    if ($('#opt-method').value === 'board') {
      const out = Roman.calculate(p.terms, p.ops);
      setError(out.error || '');
      steppers.addsub.load(out.steps);
      return;
    }
    // Regrouping: one pair at a time, left to right, each on its own equation line.
    let current = p.terms[0];
    let steps = [];
    if (p.terms.length > 2) {
      const full = Roman.eqOf(p.terms, p.ops);
      steps.push({ kind: 'eq', label: `Work two numbers at a time. First: ${p.terms[0]} ${p.ops[0] === '+' ? '+' : '−'} ${p.terms[1]}.`, eq: { ...full, right: 'ask', focus: 'left' } });
    }
    for (let k = 1; k < p.terms.length; k++) {
      const term = p.terms[k];
      const op = p.ops[k - 1];
      const total = op === '+' ? Roman.lenientValue(current) + Roman.lenientValue(term) : Roman.lenientValue(current) - Roman.lenientValue(term);
      if (total < 0) return steppers.addsub.load(steps, `${current} is less than ${term}. You cannot take away more than you have. Romans had no negative numbers.`);
      if (total === 0) return steppers.addsub.load(steps, 'Nothing is left. Romans had no zero.');
      if (total > Roman.MAX) return steppers.addsub.load(steps, `That is more than ${Roman.toRoman(Roman.MAX)}, the biggest this tool writes.`);
      const plan = op === '+' ? Roman.addEquation([current, term]) : Roman.takeAwayEquation(current, term);
      const done = plan.steps[plan.steps.length - 1];
      // The last row of the whole sum shows the whole sum with its answer. Earlier pairs say what comes next.
      if (k === p.terms.length - 1) {
        if (p.terms.length > 2) done.eq = Roman.eqOf(p.terms, p.ops, plan.result);
      } else {
        done.label = `${done.label} Next: ${plan.result} ${p.ops[k] === '+' ? '+' : '−'} ${p.terms[k + 1]}.`;
      }
      steps = steps.concat(plan.steps);
      current = plan.result;
    }
    setError('');
    steppers.addsub.load(steps, `${current} has nothing to add or take away.`);
  }

  // The prompt under the Add & Subtract buttons: think first, then press Next step. It goes once every step is shown.
  function showAddsubThink(shownSteps, total) {
    $('#addsub-think').hidden = !total || shownSteps.length >= total;
  }

  // ---------- Fix It: a bad numeral, one repair at a time ----------
  function fixRow(s, i) {
    const row = el('div', 'step-row');
    const inner = el('div');
    // With an equation (Add & Subtract), the equation sits on top and the working goes under it in one window.
    const work = s.eq ? el('div', 'work') : inner;
    const caption = (text) => (s.eq ? captionEl(text) : el('p', 'caption', text));
    if (s.eq) work.append(eqEl(s.eq));
    if (s.kind === 'start') {
      inner.append(caption(s.label || 'Written as typed.'));
      work.append(boardEl(s.tiles));
    } else if (s.kind === 'repair') {
      inner.append(caption(s.label));
      const pair = el('div', 'repair-pair');
      pair.append(boardEl(s.before), el('span', 'arrow', '→'), boardEl(s.after));
      work.append(pair);
    } else {
      inner.append(caption(s.ok ? `Right form: ${s.result}.` : `Simplest form: ${s.result}.`));
      work.append(boardEl(s.tiles));
    }
    if (work !== inner) inner.append(work);
    if (s.kind === 'done') {
      const status = el('p', 'value');
      status.append(mark(s.ok), ' ', s.ok ? 'Done' : 'Still not right');
      inner.append(status);
    }
    row.append(el('div', 'step-num', Roman.toRoman(i + 1)), inner);
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
      verdict.textContent = `Looks right! ${s} follows the rules.`;
      verdict.className = 'verdict good';
      sfx.good();
    } else {
      verdict.textContent = `Not quite. The simplest form is ${plan.result}.`;
      verdict.className = 'verdict bad';
      sfx.oops();
    }
    steppers.fix.load(plan.steps);
  }

  // ---------- Regroup: the ladder, the pattern, the short forms, and a playground ----------
  const LADDER = [['I', 5, 'V'], ['V', 2, 'X'], ['X', 5, 'L'], ['L', 2, 'C'], ['C', 5, 'D'], ['D', 2, 'M']];
  const SHORTS = [['IIII', 'IV'], ['VIIII', 'IX'], ['XXXX', 'XL'], ['LXXXX', 'XC'], ['CCCC', 'CD'], ['DCCCC', 'CM']];

  // One card per rung. Tapping it slides the small letters together into the bigger one, and tapping again undoes it.
  function buildLadder() {
    $('#ladder').replaceChildren(...LADDER.map(([from, n, to]) => {
      const card = el('button', 'ladder-card');
      card.type = 'button';
      card.setAttribute('aria-pressed', 'false');
      card.setAttribute('aria-label', `${Roman.words(n)} ${from}'s make one ${to}. Tap to regroup.`);
      const loose = el('div', 'ladder-loose');
      loose.append(...Array.from({ length: n }, () => tileEl({ ch: from, st: 'normal' })));
      const merged = el('div', 'ladder-merged');
      merged.append(tileEl({ ch: to, st: 'normal' }));
      const count = Roman.words(n);
      card.append(loose, el('span', 'arrow', '→'), merged, el('p', 'ladder-caption', `${count.charAt(0).toUpperCase() + count.slice(1)} ${from}'s make one ${to}`));
      card.addEventListener('click', () => {
        const on = card.classList.toggle('merged');
        card.setAttribute('aria-pressed', String(on));
        sfx.tap();
      });
      return card;
    }));
    $('#short-forms').replaceChildren(...SHORTS.map(([long, short]) => {
      const row = el('div', 'example');
      row.append(el('span', 'strip', long), mark(false), el('span', 'arrow', '→'), el('span', 'strip', short), mark(true));
      return row;
    }));
  }

  // A random sum for the playground: always adding.
  function randomAddition() {
    for (;;) {
      const t = Roman.randomSum().text;
      if (t.includes('+')) return t;
    }
  }

  function runRegroup(text) {
    const p = Roman.parse(text);
    if (p.error) {
      setError(p.error);
      steppers.regroup.load([], 'Type a sum like XXVII + XVIII.');
      return;
    }
    if (p.ops.some((o) => o !== '+')) {
      steppers.regroup.load([], 'Regrouping here is for adding. Use the Add & Subtract tab to take away.');
      return;
    }
    const wrong = p.terms.find((t) => !Roman.check(t).ok);
    if (wrong) {
      steppers.regroup.load([], `"${wrong}": ${Roman.check(wrong).issues[0].text} Try the Fix It tab first.`);
      return;
    }
    const plan = Roman.regroupPlan(p.terms);
    if (plan.value > Roman.MAX) {
      steppers.regroup.load([], `That is more than ${Roman.toRoman(Roman.MAX)}, the biggest this tool writes.`);
      return;
    }
    setError('');
    steppers.regroup.load(plan.steps);
  }

  // ---------- Random: each button makes a numeral or sum, then runs it like a typed one ----------
  const randomMakers = {
    addsub: { entry: 'addsub', make: (harder) => Roman.randomEquation(harder).text },
    fixbad: { entry: 'fix', make: () => Roman.randomDisarranged().numeral },
    regroup: { entry: 'regroup', make: randomAddition },
  };
  const runners = { addsub: runAddSub, fix: runFix, regroup: runRegroup };

  function runRandom(key, harder = false) {
    const { entry, make } = randomMakers[key];
    const text = make(harder);
    $(`form[data-entry="${entry}"] input`).value = text;
    remember(entry, text);
    runners[entry](text);
  }

  // ---------- Practice: record yourself presenting the problem, then play it back ----------
  // Recordings are kept in this page's memory only: they are never uploaded, and they are gone when the page closes.
  const TAKE_LIMIT = 5;
  const takes = [];
  let takeNo = 0;
  let recorder = null;
  let recStream = null;
  let recChunks = [];

  const recStatus = (msg) => { $('#rec-status').textContent = msg; };
  function renderProblem() {
    const problem = lastRun.addsub;
    $('#practice-problem').textContent = problem ? `Problem: ${problem}` : 'Make a problem first, then explain it.';
  }
  function renderTakes() {
    $('#takes').replaceChildren(...takes.map((t) => {
      const li = el('li');
      const audio = el('audio');
      audio.controls = true;
      audio.src = t.url;
      li.append(el('p', 'note', `${t.label}: ${t.problem}`), audio);
      return li;
    }));
  }
  function setRecording(on) {
    $('#rec-start').disabled = on;
    $('#rec-stop').disabled = !on;
  }
  async function startRecording() {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      recStatus('This browser cannot record sound. Try another browser.');
      return;
    }
    try {
      recStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      recStatus('Recording needs the microphone. Allow it for this page, then press Record again.');
      return;
    }
    const problem = lastRun.addsub || 'no sum yet';
    recChunks = [];
    recorder = new MediaRecorder(recStream);
    recorder.addEventListener('dataavailable', (e) => { if (e.data.size) recChunks.push(e.data); });
    recorder.addEventListener('stop', () => {
      recStream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(recChunks, { type: recorder.mimeType || 'audio/webm' });
      takeNo++;
      takes.push({ label: `Take ${Roman.toRoman(takeNo)}`, problem, url: URL.createObjectURL(blob) });
      while (takes.length > TAKE_LIMIT) URL.revokeObjectURL(takes.shift().url);
      recorder = null;
      renderTakes();
      recStatus('Saved for this visit. Play it back below.');
    });
    recorder.start();
    setRecording(true);
    recStatus('Recording. Press Stop when you are done.');
  }
  function stopRecording() {
    if (recorder) recorder.stop();
    setRecording(false);
  }
  function initPractice() {
    renderProblem();
    $('#rec-start').addEventListener('click', startRecording);
    $('#rec-stop').addEventListener('click', stopRecording);
  }

  // ---------- Quiz: letters and true / false statements ----------
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
  const TF_OPTIONS = ['True', 'False'];

  // Letters asked both ways (letter to value, value to letter), plus the True / False items.
  function allItems() {
    const letters = LETTERS.flatMap((ch) => [
      { kind: 'letter', prompt: ch, answer: Roman.words(VALUE[ch]) },
      { kind: 'value', prompt: Roman.words(VALUE[ch]), answer: ch },
    ]);
    const tf = TRUE_FALSE.map((t) => ({ kind: 'tf', prompt: t.prompt, answer: t.answer, why: t.why }));
    return letters.concat(tf);
  }

  // Two answers per question: the right one and one wrong one.
  function optionsFor(item) {
    const pool = item.kind === 'tf' ? TF_OPTIONS : item.kind === 'letter' ? Object.values(VALUE).map(Roman.words) : LETTERS;
    const wrong = shuffle(pool.filter((x) => x !== item.answer))[0];
    return shuffle([item.answer, wrong]);
  }

  // A missed question comes back as a similar question, not the same one.
  function similarItem(item) {
    if (item.kind === 'letter') return { kind: 'value', prompt: Roman.words(VALUE[item.prompt]), answer: item.prompt };
    if (item.kind === 'value') return { kind: 'letter', prompt: item.answer, answer: Roman.words(VALUE[item.answer]) };
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
    $('#quiz-round').textContent = `Round ${Roman.toRoman(quiz.round)}`;
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
    $('#quiz-left').textContent = `${Roman.toRoman(quiz.index + 1)} of ${Roman.toRoman(quiz.batch.length)}`;
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
    $('#quiz-feedback').textContent = `${quiz.correct ? Roman.toRoman(quiz.correct) : 'None'} of ${Roman.toRoman(quiz.batch.length)} right`;
    const next = $('#quiz-next');
    next.textContent = left ? `Next round (${Roman.toRoman(left)} to repeat)` : 'New round';
    next.hidden = false;
  }

  // ---------- Settings: forget mistakes (quiz only) ----------
  function forgetMistakes() {
    quiz.carry = [];
    if (!$('#quiz-next').hidden) $('#quiz-next').textContent = 'New round';
    $('#forget-note').textContent = 'Mistakes forgotten.';
  }

  // ---------- Look: each look is a whole stylesheet in looks/, swapped by the settings buttons ----------
  // The look is shared with the other pages (shared.js), so it carries across them.
  function setLook(name) {
    $('#look-css').addEventListener('load', refitSoon, { once: true });
    RomanShared.applyLook(name);
  }

  // ---------- Letters: the pairs straight away; More shows pairs that never exist ----------
  let pairMore = false;

  const pairChip = (p) => {
    const chip = el('div', 'pair-chip ok');
    const v = Roman.lenientValue(p);
    chip.append(el('b', '', p), el('span', '', `= ${v}`));
    return chip;
  };
  const neverChip = (p) => {
    const chip = el('div', 'pair-chip never');
    chip.append(mark(false), el('b', '', p));
    return chip;
  };

  // Group a list of pairs by the small letter that comes first, so each group reads as one line.
  function groupPairs(list, chipFn) {
    const groups = {};
    list.forEach((p) => { (groups[p[0]] = groups[p[0]] || []).push(p); });
    return Object.keys(groups).map((first) => {
      const row = el('div', 'pair-group');
      row.append(el('span', 'pair-first', first), ...groups[first].map(chipFn));
      return row;
    });
  }

  // Pairs that never exist: the smaller letter goes first and the pair is not one of the six.
  function neverPairs() {
    const after = LETTERS.flatMap((x) => LETTERS.filter((y) => VALUE[y] > VALUE[x] && !PAIRS.includes(x + y)).map((y) => x + y));
    const seen = new Set();
    return after.filter((p) => (seen.has(p) ? false : seen.add(p)));
  }

  function renderPairs() {
    const list = $('#pair-list');
    if (!pairMore) {
      $('#pair-title').textContent = 'Pairs that are real (a smaller letter in front of a bigger one)';
      list.replaceChildren(...groupPairs(PAIRS, pairChip));
      $('#pair-more').textContent = 'Show pairs that are not allowed';
    } else {
      $('#pair-title').textContent = 'Pairs that never exist';
      list.replaceChildren(...groupPairs(neverPairs(), neverChip));
      $('#pair-more').textContent = 'Back to pairs that exist';
    }
  }

  function buildLetterRow() {
    const row = $('#letter-row');
    // Each letter with its Arabic value on a row just below it, outside the tile
    LETTERS.forEach((ch) => {
      const cell = el('div', 'letter-cell');
      const b = el('button', `tile ${ch}`, ch);
      b.addEventListener('click', () => {
        $('#letter-hint').textContent = `${ch} is worth ${VALUE[ch]}.`;
        beep([VALUE[ch] > 100 ? 392 : 523 + VALUE[ch] / 10]);
      });
      cell.append(b, el('span', 'letter-num', String(VALUE[ch])));
      row.append(cell);
    });
  }

  // ---------- Rules: five rules on the left (in full), examples on the right ----------
  const ok = (numeral, note) => ({ good: true, numeral, note });
  const bad = (numeral, fix, note) => ({ good: false, numeral, fix, note });
  // The full wording is from Jimmy's notes (convo v0.1). The short name on the left is only a label.
  const RULES = {
    1: {
      title: 'Rule I',
      short: 'Same letters in a row',
      text: 'If there are a few equal basic Roman numerals in a row, add them. No more than three equal basic numerals in a row are allowed.',
      examples: [ok('III', '= three'), ok('XXX', '= thirty'), bad('IIII', 'IV'), bad('XXXX', 'XL')],
    },
    2: {
      title: 'Rule II',
      short: 'Smaller letters after a bigger one',
      text: 'If one or a few equal smaller basic Roman numerals are to the right of a greater one, we add them. No more than three smaller equal basic numerals are allowed.',
      examples: [ok('VI', '= six'), ok('XVIII', '= eighteen'), bad('VIIII', 'IX')],
    },
    3: {
      title: 'Rule III',
      short: 'Smaller letter before a bigger one',
      text: 'If a smaller basic Roman numeral is to the left of a greater one, we subtract it. It is not allowed to put a few smaller equal basic numerals to the left of a greater one.',
      examples: [ok('IV', '= four'), ok('XL', '= forty'), ok('CM', '= nine hundred'), bad('IIX', 'X', 'only one I before the X')],
    },
    4: {
      title: 'Rule IV',
      short: 'Coming later',
      text: 'Coming later. We will come back to this rule.',
      examples: [],
    },
    5: {
      title: 'Rule V',
      short: 'Simplest form',
      text: 'Subject to all other rules, one should write a Roman numeral in the simplest possible form.',
      examples: [bad('VV', 'X'), bad('LL', 'C'), bad('IIII', 'IV')],
    },
  };

  function renderRuleList() {
    const list = $('#rule-list');
    list.replaceChildren(...Object.keys(RULES).map((n) => {
      const b = el('button', 'rule-btn');
      b.dataset.rule = n;
      b.setAttribute('aria-pressed', 'false');
      b.append(el('b', '', Roman.toRoman(Number(n))), ` ${RULES[n].short}`);
      b.addEventListener('click', () => showRule(Number(n)));
      return b;
    }));
  }

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
    if (!rule.examples.length) {
      box.replaceChildren(el('p', 'note', 'Rule IV will be added when the wording is ready.'));
      return;
    }
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
  // One pebble per unit, tens on the left, ones on the right. Each pebble has a small delay so they slide on one after another.
  function countingBoardSVG(tens, ones) {
    const pebble = (x, y, k) => `<circle class="peb" style="--d:${(k * 0.12).toFixed(2)}s" cx="${x}" cy="${y}" r="8" fill="#ffe9a6" stroke="#2b2540" stroke-width="2.5"/>`;
    const column = (x, n) => Array.from({ length: n }, (_, k) => pebble(x, 190 - 18 * k, k)).join('');
    return `<svg class="board-art" viewBox="0 0 300 220" role="img" aria-label="${tens} tens and ${ones} ones">`
      + '<g stroke="#2b2540" stroke-width="3" stroke-linecap="round">'
      + '<line x1="90" y1="16" x2="90" y2="200"/><line x1="210" y1="16" x2="210" y2="200"/><line x1="40" y1="204" x2="260" y2="204"/></g>'
      + column(90, tens) + column(210, ones)
      + '<g font-family="Georgia, serif" font-size="17" font-weight="bold" fill="#2b2540" text-anchor="middle">'
      + '<text x="90" y="218">10s</text><text x="210" y="218">1s</text></g></svg>';
  }

  // Each demo is a list of stages. The slider moves through them. Pebbles that come in drop down into place,
  // pebbles that go out fade. The picture only changes when the slider is moved.
  const DEMOS = {
    'add-simple': [
      { text: '23 is 2 tens and 3 ones. This is the board before we add.', tens: 2, ones: 3 },
      { text: 'Add 14: 1 ten and 4 ones come down onto the board.', tens: 3, ones: 7 },
      { text: 'Count the whole board: 3 tens and 7 ones make 37, which is XXXVII.', tens: 3, ones: 7 },
    ],
    'add-carry': [
      { text: '27 is 2 tens and 7 ones.', tens: 2, ones: 7 },
      { text: 'Add 18: 1 ten and 8 ones come down. The ones make 15.', tens: 3, ones: 15 },
      { text: '10 ones trade for 1 ten. Now there are 4 tens and 5 ones.', tens: 4, ones: 5 },
      { text: '45, which is XLV.', tens: 4, ones: 5 },
    ],
    subtract: [
      { text: '40 is 4 tens and no ones.', tens: 4, ones: 0 },
      { text: 'There are no ones to take from, so trade 1 ten for 10 ones.', tens: 3, ones: 10 },
      { text: 'Take away 18: 1 ten and 8 ones leave. 22 is left, which is XXII.', tens: 2, ones: 2 },
    ],
  };

  // The picture for slider position t (0 to 1).
  function scrubSVG(stages, t) {
    const pos = Math.min(stages.length - 1, Math.max(0, t * (stages.length - 1)));
    const i = Math.max(0, Math.min(stages.length - 2, Math.floor(pos)));
    const from = stages[i];
    const to = stages[i + 1] || stages[i];
    const p = stages.length === 1 ? 1 : pos - i;
    const column = (key, x) => {
      const a = from[key];
      const b = to[key];
      const n = Math.max(a, b);
      const gap = n > 10 ? 12 : 18;
      const r = n > 10 ? 6 : 8;
      let out = '';
      for (let k = 0; k < n; k++) {
        const y = 190 - gap * k;
        let dy = 0;
        let opacity = 1;
        if (k >= Math.min(a, b)) {
          if (b > a) { dy = -70 * (1 - p); opacity = p; } else { opacity = 1 - p; }
        }
        out += `<circle cx="${x}" cy="${y + dy}" r="${r}" fill="#ffe9a6" stroke="#2b2540" stroke-width="2.5" opacity="${opacity.toFixed(2)}"/>`;
      }
      return out;
    };
    return `<svg class="board-art" viewBox="0 0 300 220" role="img" aria-label="Counting board">`
      + '<g stroke="#2b2540" stroke-width="3" stroke-linecap="round">'
      + '<line x1="90" y1="16" x2="90" y2="200"/><line x1="210" y1="16" x2="210" y2="200"/><line x1="40" y1="204" x2="260" y2="204"/></g>'
      + column('tens', 90) + column('ones', 210)
      + '<g font-family="Georgia, serif" font-size="17" font-weight="bold" fill="#2b2540" text-anchor="middle">'
      + '<text x="90" y="218">10s</text><text x="210" y="218">1s</text></g></svg>';
  }

  function renderDemos() {
    $$('[data-demo]').forEach((box) => {
      const stages = DEMOS[box.dataset.demo] || [];
      box.classList.add('scrub-box');
      const picture = el('div', 'scrub-picture');
      const caption = el('p', 'scrub-caption');
      const slider = el('input', 'scrub-slider');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '100';
      slider.value = '0';
      slider.setAttribute('aria-label', 'Move through the steps');
      const draw = () => {
        const t = Number(slider.value) / 100;
        picture.innerHTML = scrubSVG(stages, t);
        const pos = Math.round(t * (stages.length - 1));
        caption.textContent = stages[pos] ? stages[pos].text : '';
      };
      slider.addEventListener('input', draw);
      box.replaceChildren(picture, slider, caption, el('p', 'note', 'Drag the slider to move through the steps.'));
      draw();
    });
    $$('[data-figure]').forEach((box) => {
      const [tens, ones] = box.dataset.figure.split(',').map(Number);
      box.innerHTML = scrubSVG([{ text: '', tens, ones }], 0);
    });
  }

  // ---------- tabs, forms, gear ----------
  function showTab(name) {
    $$('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    $$('.tab').forEach((s) => s.classList.toggle('active', s.id === `tab-${name}`));
    sfx.tap();
    refitSoon();
  }

  function init() {
    window.addEventListener('resize', refitSoon);
    steppers.addsub = makeStepper('addsub', { renderRow: addsubRow, onShow: showAddsubThink, showAll: () => $('#opt-showall').checked });
    steppers.fix = makeStepper('fix', { renderRow: fixRow, onShow: showFixRules });
    steppers.regroup = makeStepper('regroup', { renderRow: fixRow });
    steppers.regroup.load([], 'Press Random, or type a sum like XXVII + XVIII.');
    buildLadder();
    steppers.addsub.load([], 'Press Random, or type a sum like XLI + XIX.');
    steppers.fix.load([], 'Press Random wrong numeral, or type your own.');
    buildLetterRow();
    renderPairs();
    renderDemos();
    renderRuleList();
    showRule(1);

    $$('.tab-btn').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
    $('#pair-more').addEventListener('click', () => {
      pairMore = !pairMore;
      renderPairs();
    });

    $$('form[data-entry]').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = form.dataset.entry;
        const text = form.querySelector('input').value;
        remember(name, text);
        runners[name](text);
      });
    });

    $$('[data-random]').forEach((b) => b.addEventListener('click', () => runRandom(b.dataset.random, 'harder' in b.dataset)));
    initPractice();

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
    $$('[data-all]').forEach((b) => b.addEventListener('click', () => {
      steppers[b.dataset.all].all();
    }));
    $$('[data-play]').forEach((b) => b.addEventListener('click', () => {
      steppers[b.dataset.play].togglePlay();
    }));

    $$('.subtab').forEach((b) => b.addEventListener('click', () => {
      const name = b.dataset.sub;
      $$('.subtab').forEach((x) => {
        const on = x === b;
        x.classList.toggle('active', on);
        x.setAttribute('aria-pressed', String(on));
      });
      $$('.subpanel').forEach((p) => p.classList.toggle('active', p.dataset.panel === name));
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
    $('#opt-size').addEventListener('change', (e) => {
      document.documentElement.dataset.size = e.target.value;
      refitSoon();
    });
    $('#opt-method').addEventListener('change', () => {
      if (lastRun.addsub !== undefined) runAddSub(lastRun.addsub);
    });
    $('#opt-calm').addEventListener('change', (e) => { document.documentElement.dataset.calm = e.target.checked ? 'on' : ''; });
    $('#opt-bigtiles').addEventListener('change', (e) => {
      document.documentElement.dataset.tiles = e.target.checked ? 'big' : '';
      refitSoon();
    });
    $('#opt-one').addEventListener('change', (e) => { document.documentElement.dataset.one = e.target.checked ? 'on' : ''; });
    $('#opt-showall').addEventListener('change', (e) => { if (e.target.checked) steppers.addsub.all(); });
    $('#opt-regroup-random').addEventListener('change', (e) => { $('#regroup-random').hidden = !e.target.checked; });
    setLook(RomanShared.savedLook() || 'sunny');
  }

  init();
})();
