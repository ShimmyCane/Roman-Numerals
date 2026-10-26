(function () {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const { VALUE } = Roman;
  const LETTERS = ['I', 'V', 'X', 'L', 'C', 'D', 'M'];

  let soundOn = true;
  let showErrors = false;
  let currentError = '';

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

  // ---------- drawing ----------
  function drawBoard(boardEl, tiles) {
    boardEl.replaceChildren(...tiles.map((t) => {
      const d = document.createElement('div');
      d.className = `tile ${t.ch} ${t.st}`;
      d.textContent = t.ch;
      return d;
    }));
  }

  // "How to read this": count what is on the board right now.
  function drawTally(el, tiles) {
    if (!el) return;
    const counts = {};
    tiles.forEach((t) => {
      if (t.st !== 'cross') counts[t.ch] = (counts[t.ch] || 0) + 1;
    });
    const order = Object.keys(counts).sort((a, b) => VALUE[b] - VALUE[a]);
    let total = 0;
    const rows = order.map((ch) => {
      const n = counts[ch];
      total += n * VALUE[ch];
      return `<div><span>${n} × ${ch} (${VALUE[ch]} each)</span><span>${n * VALUE[ch]}</span></div>`;
    });
    if (rows.length) rows.push(`<div class="total"><span>Total</span><span>${total}</span></div>`);
    el.innerHTML = rows.join('');
  }

  // ---------- steppers: Back / Next / Play through recorded steps ----------
  const steppers = {};
  function makeStepper(name, tallyEl) {
    let steps = [];
    let i = 0;
    let timer = null;
    const board = $(`#${name}-board`);
    const caption = $(`#${name}-caption`);
    const valueEl = $(`#${name}-value`);
    const playBtn = $(`[data-play="${name}"]`);

    function show() {
      if (!steps.length) {
        board.replaceChildren();
        caption.textContent = '';
        valueEl.textContent = '';
        if (tallyEl) tallyEl.replaceChildren();
        return;
      }
      const s = steps[i];
      drawBoard(board, s.tiles);
      caption.textContent = `Step ${i + 1} of ${steps.length}: ${s.text}`;
      valueEl.textContent = s.value === null ? '' : `Worth ${s.value}`;
      drawTally(tallyEl, s.tiles);
    }

    function stop() {
      clearInterval(timer);
      timer = null;
      playBtn.textContent = 'Play steps';
    }

    return {
      load(newSteps) {
        stop();
        steps = newSteps;
        i = 0;
        show();
      },
      move(d) {
        if (!steps.length) return;
        stop();
        i = Math.min(steps.length - 1, Math.max(0, i + d));
        sfx.tap();
        show();
      },
      togglePlay() {
        if (timer) return stop();
        if (!steps.length) return;
        if (i >= steps.length - 1) i = 0;
        playBtn.textContent = 'Stop';
        show();
        timer = setInterval(() => {
          if (i >= steps.length - 1) return stop();
          i++;
          sfx.tap();
          show();
        }, 1500);
      },
      stop,
    };
  }

  // ---------- undo: each tab remembers the inputs it ran before ----------
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
      steppers.build.load([]);
      $('#build-caption').textContent = 'Type letters I V X L C D M only.';
      return;
    }
    if (!r.ok) {
      setError('');
      steppers.build.load([]);
      $('#build-caption').textContent = `"${s}": ${r.issues[0].text} Try the Fix It tab.`;
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
      steppers.addsub.load([]);
      $('#addsub-caption').textContent = 'Try XL - XX, or XL + XX - IX.';
      return;
    }
    const wrong = p.terms.find((t) => !Roman.check(t).ok);
    if (wrong) {
      setError('');
      steppers.addsub.load([]);
      $('#addsub-caption').textContent = `"${wrong}": ${Roman.check(wrong).issues[0].text} Try the Fix It tab first.`;
      return;
    }
    const out = Roman.calculate(p.terms, p.ops);
    setError(out.error || '');
    steppers.addsub.load(out.steps);
  }

  // ---------- Fix It ----------
  function runFix(text) {
    const s = text.trim().toUpperCase();
    if (!s) return;
    const r = Roman.check(s);
    const verdict = $('#fix-verdict');
    const issuesEl = $('#fix-issues');
    issuesEl.replaceChildren();

    if (r.issues.some((i) => i.rule === null)) {
      verdict.textContent = '';
      verdict.className = 'verdict';
      setError(r.issues[0].text);
      steppers.fix.load([]);
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
        const box = document.createElement('div');
        box.className = 'issue';
        const label = document.createElement('b');
        label.textContent = typeof issue.rule === 'number' ? `Rule ${issue.rule}` : 'Note';
        box.append(label, ` ${issue.text}`);
        issuesEl.append(box);
      });
    }
    steppers.fix.load(Roman.calculate([s], []).steps);
  }

  // ---------- Letters and quiz ----------
  const quiz = { round: 0, carry: [], batch: [], index: 0, correct: 0, current: null, answered: false, timer: null };

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // True / False / Ambiguous items. "Ambiguous" covers pairs the rules do not settle yet (see Rule 4 note).
  const TRUE_FALSE = Roman.TRUE_FALSE;
  const TF_OPTIONS = ['True', 'False', 'Ambiguous'];

  // Letters asked both ways (letter to value, value to letter), plus the True / False / Ambiguous items.
  function allItems() {
    const letters = LETTERS.flatMap((ch) => [
      { kind: 'letter', prompt: ch, answer: String(VALUE[ch]) },
      { kind: 'value', prompt: String(VALUE[ch]), answer: ch },
    ]);
    const tf = TRUE_FALSE.map((t) => ({ kind: 'tf', prompt: t.prompt, answer: t.answer, why: t.why }));
    const convert = Roman.CONVERT.map((c) => ({ kind: 'convert', prompt: `Fix ${c.prompt}`, numeral: c.prompt, answer: c.answer, wrong: c.wrong }));
    return letters.concat(tf, convert);
  }

  // Two answers per question: the right one and one wrong one.
  function optionsFor(item) {
    if (item.kind === 'convert') return shuffle([item.answer, item.wrong]);
    const pool = item.kind === 'tf' ? TF_OPTIONS : item.kind === 'letter' ? Object.values(VALUE).map(String) : LETTERS;
    const wrong = shuffle(pool.filter((x) => x !== item.answer))[0];
    return shuffle([item.answer, wrong]);
  }

  // A missed question comes back as a similar question, not the same one.
  function similarItem(item) {
    if (item.kind === 'convert') {
      const others = Roman.CONVERT.filter((c) => c.answer === item.answer && c.prompt !== item.numeral);
      if (!others.length) return item;
      const pick = shuffle(others)[0];
      return { kind: 'convert', prompt: `Fix ${pick.prompt}`, numeral: pick.prompt, answer: pick.answer, wrong: pick.wrong };
    }
    if (item.kind === 'letter') return { kind: 'value', prompt: String(VALUE[item.prompt]), answer: item.prompt };
    if (item.kind === 'value') return { kind: 'letter', prompt: item.answer, answer: String(VALUE[item.answer]) };
    const others = TRUE_FALSE.filter((t) => t.answer === item.answer && t.prompt !== item.prompt);
    if (!others.length) return item;
    const pick = shuffle(others)[0];
    return { kind: 'tf', prompt: pick.prompt, answer: pick.answer, why: pick.why };
  }

  function explain(item) {
    if (item.kind === 'convert') return `${item.numeral} is ${item.answer}`;
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
      const b = document.createElement('button');
      b.className = 'big-btn ghost';
      b.textContent = o;
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
      $('#quiz-feedback').textContent = '✓';
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

  function buildLetterRow() {
    const row = $('#letter-row');
    LETTERS.forEach((ch) => {
      const b = document.createElement('button');
      b.className = `tile ${ch}`;
      b.textContent = ch;
      b.addEventListener('click', () => {
        $('#letter-hint').textContent = `${ch} is worth ${VALUE[ch]}.`;
        beep([VALUE[ch] > 100 ? 392 : 523 + VALUE[ch] / 10]);
      });
      row.append(b);
    });
  }

  // ---------- tabs, forms, gear ----------
  const runners = { build: runBuild, addsub: runAddSub, fix: runFix };

  function showTab(name) {
    $$('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    $$('.tab').forEach((s) => s.classList.toggle('active', s.id === `tab-${name}`));
    sfx.tap();
  }

  function init() {
    steppers.build = makeStepper('build', $('#build-tally'));
    steppers.addsub = makeStepper('addsub', $('#addsub-tally'));
    steppers.fix = makeStepper('fix', null);
    buildLetterRow();

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
    });
    $('#drawer-close').addEventListener('click', () => { drawer.hidden = true; });
    $('#opt-sound').addEventListener('change', (e) => { soundOn = e.target.checked; });
    $('#opt-errors').addEventListener('change', (e) => {
      showErrors = e.target.checked;
      renderErrors();
    });
    $('#opt-pictures').addEventListener('change', (e) => {
      document.body.classList.toggle('no-pictures', !e.target.checked);
    });
  }

  init();
})();
