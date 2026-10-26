/* Roman numeral logic. Pure functions, no DOM, so it runs in the browser and in Node tests. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Roman = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const VALUE = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

  // Subtractive pairs, written as the pieces they stand for (XL = XXXX, IX = VIIII, ...).
  const PAIR_PIECES = { IV: 'IIII', IX: 'VIIII', XL: 'XXXX', XC: 'LXXXX', CD: 'CCCC', CM: 'DCCCC' };

  // Largest value this tool writes (the converter itself goes to 3999). Rule 4, which covers which pairs may be taken away, stays hidden,
  // so the checker does not name it: IL is simply shown as its simplest form, XLIX.
  const MAX = 3999;
  // Numerals a student types in have at most this many letters. Results from the calculator are not capped.
  const LETTER_LIMIT = 10;
  // Quiz numerals use at most this many different letters (I, V, X and so on).
  const QUIZ_MAX_TYPES = 3;

  // One letter broken into the next smaller letter's pieces, used when we need to trade.
  const TRADE = { M: 'DD', D: 'CCCCC', C: 'LL', L: 'XXXXX', X: 'VV', V: 'IIIII' };

  // Pieces that join into one bigger letter once there are enough of them.
  const MERGE = [
    ['I', 'V', 5],
    ['V', 'X', 2],
    ['X', 'L', 5],
    ['L', 'C', 2],
    ['C', 'D', 5],
    ['D', 'M', 2],
  ];

  const SIMPLE = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];

  // Lenient value: a smaller letter before a bigger one is taken away.
  function lenientValue(s) {
    let total = 0;
    for (let i = 0; i < s.length; i++) {
      const v = VALUE[s[i]];
      const next = VALUE[s[i + 1]] || 0;
      total += v < next ? -v : v;
    }
    return total;
  }

  // Simplest form (Rule 5). Only 1 to 3999 is supported.
  function toRoman(n) {
    if (!Number.isInteger(n) || n < 1 || n > 3999) throw new RangeError('Roman numerals run from 1 to 3999');
    let out = '';
    for (const [v, s] of SIMPLE) {
      while (n >= v) {
        out += s;
        n -= v;
      }
    }
    return out;
  }

  // Split a numeral into chunks. A subtractive pair is one chunk that stands for its pieces.
  function chunks(s) {
    const out = [];
    for (let i = 0; i < s.length;) {
      const pair = s.substr(i, 2);
      if (PAIR_PIECES[pair]) {
        out.push({ text: pair, pieces: PAIR_PIECES[pair] });
        i += 2;
      } else {
        out.push({ text: s[i], pieces: s[i] });
        i += 1;
      }
    }
    return out;
  }

  // Check a numeral against the rules. Returns each rule it breaks and the simplest form.
  function check(s) {
    if (!s || /[^IVXLCDM]/.test(s)) {
      return { ok: false, value: null, simplest: null, issues: [{ rule: null, text: 'Use only the letters I V X L C D M.' }] };
    }

    const runs = [];
    for (const ch of s) {
      const last = runs[runs.length - 1];
      if (last && last.ch === ch) last.n++;
      else runs.push({ ch, n: 1 });
    }

    const issues = [];
    for (const r of runs) {
      if (r.n > 3) {
        issues.push({ rule: 1, text: `${r.n} ${r.ch}'s in a row. No more than three equal numerals in a row.` });
      } else if (r.n > 1 && 'VLD'.includes(r.ch)) {
        issues.push({ rule: 5, text: `${r.ch}${r.ch} can be written as one bigger letter. Use the simplest form.` });
      }
    }

    for (let k = 1; k < runs.length; k++) {
      const before = runs[k - 1];
      const after = runs[k];
      if (VALUE[after.ch] > VALUE[before.ch]) {
        if (before.n > 1) {
          issues.push({ rule: 3, text: `Only one ${before.ch} can go before a bigger letter, never a few.` });
        }
      } else if (after.n > 3) {
        issues.push({ rule: 2, text: `${after.n} smaller numerals after a bigger one. No more than three.` });
      }
    }

    if (s.length > LETTER_LIMIT) issues.push({ rule: 'length', text: `Use ${LETTER_LIMIT} letters or fewer.` });

    const value = lenientValue(s);
    if (value < 1 || value > MAX) {
      issues.push({ rule: null, text: `This tool works from 1 to ${MAX}.` });
      return { ok: false, value, simplest: null, issues };
    }

    const simplest = toRoman(value);
    if (simplest !== s && !issues.some((i) => i.rule === 5)) {
      issues.push({ rule: 5, text: `Write it in the simplest form: ${simplest}.` });
    }
    return { ok: issues.length === 0 && simplest === s, value, simplest, issues };
  }

  // ---------- Add & Subtract ----------
  // The sum is a line of chunks (XL, I, +, X, IX ...) and a board of loose pieces.
  // Each recorded step does one thing: put a term on the board, break one pair, take away a group of pieces,
  // trade one letter, merge one group, or rebuild. A step records the line, the board and a short caption.
  //   line token: { text, op?, st: 'todo' | 'done', focus?, becomes?, res?, term? }
  //   board tile: { ch, st: 'normal' | 'new' | 'cross', src? }   (src = line token a piece came from)
  const tileValue = (t) => lenientValue(t.ch);
  const tableValue = (tiles) => tiles.reduce((sum, t) => (t.st === 'cross' ? sum : sum + tileValue(t)), 0);
  const byValueDesc = (a, b) => tileValue(b) - tileValue(a);

  function calculate(terms, ops) {
    const steps = [];
    const line = [];
    let board = [];

    terms.forEach((term, k) => {
      if (k > 0) line.push({ op: true, text: ops[k - 1] === '+' ? '+' : '−' });
      chunks(term).forEach((c) => line.push({ text: c.text, st: 'todo', term: k }));
    });

    const copyLine = () => line.map((t) => ({ ...t }));
    const copyBoard = () => board.map((t) => ({ ...t }));
    const boardShown = () => (board.some((t) => t.st !== 'cross') ? tableValue(board) : null);

    // Record one step, then clear the transient marks (focus, becomes) and the crosses for the next step.
    const snap = (text) => {
      steps.push({ text, line: copyLine(), board: copyBoard(), value: boardShown() });
      line.forEach((t) => { delete t.focus; delete t.becomes; });
      board = board.filter((t) => t.st !== 'cross').map((t) => ({ ch: t.ch, st: 'normal', src: t.src }));
    };

    // Break one pair on the board (XL becomes XXXX). The line token it came from is highlighted with the arrow.
    const breakPair = (i) => {
      const tile = board[i];
      const pieces = PAIR_PIECES[tile.ch];
      tile.st = 'cross';
      board.splice(i + 1, 0, ...pieces.split('').map((ch) => ({ ch, st: 'new', src: tile.src })));
      if (tile.src !== undefined) {
        line[tile.src].focus = true;
        line[tile.src].becomes = pieces;
      }
      snap(`Break ${tile.ch} into ${pieces.split('').join(' ')}.`);
    };
    const breakAll = () => {
      for (let i = board.findIndex((t) => t.st !== 'cross' && PAIR_PIECES[t.ch]); i >= 0; i = board.findIndex((t) => t.st !== 'cross' && PAIR_PIECES[t.ch])) breakPair(i);
    };

    // Regroup: pieces that join into one bigger letter, one group at a time.
    const regroup = () => {
      let merged = true;
      while (merged) {
        merged = false;
        for (const [from, to, n] of MERGE) {
          const have = board.filter((t) => t.ch === from && t.st !== 'cross');
          if (have.length >= n) {
            have.slice(0, n).forEach((t) => { t.st = 'cross'; });
            board.push({ ch: to, st: 'new' });
            snap(`Put ${n} ${from}'s together. They make one ${to}.`);
            merged = true;
            break;
          }
        }
      }
    };

    // How many uncrossed pieces of exactly this letter are on the board.
    const countOf = (ch) => board.filter((t) => t.st !== 'cross' && t.ch === ch).length;

    // Make sure the board holds at least n of this letter. If it does not, break or trade the smallest bigger piece, one at a time.
    const ensure = (ch, n) => {
      while (countOf(ch) < n) {
        let j = -1;
        board.forEach((t, i) => {
          if (t.st !== 'cross' && tileValue(t) > VALUE[ch] && (j < 0 || tileValue(t) < tileValue(board[j]))) j = i;
        });
        if (j < 0) throw new Error(`Not enough to take away ${ch}`);
        if (PAIR_PIECES[board[j].ch]) {
          breakPair(j);
        } else {
          const big = board[j].ch;
          board[j].st = 'cross';
          board.splice(j + 1, 0, ...TRADE[big].split('').map((c) => ({ ch: c, st: 'new' })));
          snap(`No ${ch} to take away, so trade one ${big} for ${TRADE[big].split('').join(' ')}.`);
        }
      }
    };

    // Pieces still to be taken away from each line token (a second number's pair has several pieces).
    const remaining = {};

    // A whole part of the second number that matches a part on the board: both are crossed out together.
    const takeWhole = (item) => {
      board.find((t) => t.st !== 'cross' && t.ch === item.text).st = 'cross';
      remaining[item.src] = 0;
      line[item.src].st = 'done';
      line[item.src].focus = true;
      snap(`Take away ${item.text}. The same is on both sides.`);
    };

    // A run of the same letter from the second number, taken away in one step.
    const takeGroup = (group) => {
      const ch = group[0].text;
      ensure(ch, group.length);
      let left = group.length;
      board.forEach((t) => {
        if (left && t.st !== 'cross' && t.ch === ch) {
          t.st = 'cross';
          left--;
        }
      });
      group.forEach(({ src }) => {
        remaining[src] -= 1;
        line[src].focus = true;
        if (remaining[src] === 0) line[src].st = 'done';
      });
      snap(group.length === 1 ? `Take away ${ch}.` : `Take away ${group.length} ${ch}'s.`);
    };

    try {
      snap(`Full sum: ${terms.map((t, k) => (k ? `${ops[k - 1] === '+' ? '+' : '−'} ${t}` : t)).join(' ')}.`);

      terms.forEach((term, k) => {
        const tokens = line.map((t, i) => ({ t, i })).filter((x) => x.t.term === k);
        if (k === 0 || ops[k - 1] === '+') {
          tokens.forEach(({ t, i }) => {
            t.st = 'done';
            board.push({ ch: t.text, st: 'new', src: i });
          });
          snap(k === 0 ? `Put ${term} on the board.` : `Add ${term}. Put it on the board.`);
          // A first number that is taken away from stays whole, so its parts can be matched first.
          if (k > 0 || ops[0] !== '-') breakAll();
          regroup();
        } else {
          // Subtract: the second number is shown whole first. Each part is matched against the board: the same part is
          // crossed out together. A pair with no match is broken first, and a missing letter is traded for, one step at a time.
          tokens.forEach(({ i }) => { line[i].focus = true; });
          snap(`Second number ${term} = ${lenientValue(term)}.`);
          tokens.forEach(({ t, i }) => { remaining[i] = (PAIR_PIECES[t.text] || t.text).length; });
          const queue = tokens.map(({ t, i }) => ({ text: t.text, src: i }));
          while (queue.length) {
            const item = queue.shift();
            const onBoard = board.some((t) => t.st !== 'cross' && t.ch === item.text);
            if (PAIR_PIECES[item.text] && onBoard) {
              takeWhole(item);
            } else if (PAIR_PIECES[item.text]) {
              line[item.src].focus = true;
              line[item.src].becomes = PAIR_PIECES[item.text];
              snap(`Break ${item.text} into ${PAIR_PIECES[item.text].split('').join(' ')}.`);
              queue.unshift(...PAIR_PIECES[item.text].split('').map((ch) => ({ text: ch, src: item.src })));
            } else {
              const group = [item];
              while (queue.length && queue[0].text === item.text) group.push(queue.shift());
              takeGroup(group);
            }
          }
          regroup();
        }
      });
    } catch (err) {
      const error = 'Romans had no negative numbers. Try a bigger first number.';
      steps.push({ text: 'Stop here. There is not enough to take away, and Romans had no negative numbers.', line: copyLine(), board: copyBoard(), value: null });
      return { steps, value: null, result: null, error };
    }

    const value = tableValue(board);
    if (value < 1 || value > MAX) {
      const error = value < 1 ? 'Zero has no Roman numeral.' : `That is more than ${MAX}, the biggest this tool writes.`;
      steps.push({ text: error, line: copyLine(), board: copyBoard(), value });
      return { steps, value, result: null, error };
    }

    const result = toRoman(value);
    board = board.filter((t) => t.st !== 'cross').sort(byValueDesc).map((t) => ({ ch: t.ch, st: 'normal' }));
    const loose = board.map((t) => t.ch).join('');
    line.push({ op: true, text: '=' }, { text: result, st: 'done', res: true });
    if (loose !== result) {
      snap(`Put the pieces in order: ${loose}.`);
      board = chunks(result).map((c) => ({ ch: c.text, st: 'new' }));
      line[line.length - 1].focus = true;
      snap(`Build it back up: ${result}.`);
    } else {
      line[line.length - 1].focus = true;
      snap(`Simplest form: ${result}.`);
    }
    return { steps, value, result, error: null };
  }

  // ---------- Fix It ----------
  // A repair works on one bad part at a time, so the rules are shown only as they are needed.
  // Each repair step records the numeral before (the bad part crossed out) and after (the fix in its place).
  function tilesOf(s, from = -1, to = -1, cls = 'normal') {
    return s.split('').map((ch, i) => ({ ch, st: i >= from && i < to ? cls : 'normal' }));
  }

  // The smallest part of a numeral that must change to reach the target. Only that part is crossed out and replaced.
  // LXLVII to XCVII changes LXL to XC, and keeps VII.
  function span(cur, target) {
    let p = 0;
    while (p < cur.length && p < target.length && cur[p] === target[p]) p++;
    let q = 0;
    while (q < cur.length - p && q < target.length - p && cur[cur.length - 1 - q] === target[target.length - 1 - q]) q++;
    const to = target.slice(p, target.length - q);
    const next = cur.slice(0, p) + to + cur.slice(cur.length - q);
    if (next !== target || lenientValue(next) !== lenientValue(cur)) return { start: 0, end: cur.length, to: target };
    return { start: p, end: cur.length - q, to };
  }

  // The first bad part of a numeral, and its fix. Returns null when nothing is left to fix.
  function firstRepair(cur) {
    const r = check(cur);
    if (r.value === null || r.value < 1 || r.value > MAX) return null;

    const runs = [];
    for (let i = 0; i < cur.length;) {
      let j = i;
      while (j < cur.length && cur[j] === cur[i]) j++;
      runs.push({ ch: cur[i], start: i, end: j, n: j - i });
      i = j;
    }

    const run = runs.find((x) => x.n > 3);
    if (run) {
      return { rule: 1, label: `${run.n} ${run.ch}'s in a row`, start: run.start, end: run.end, to: toRoman(lenientValue(run.ch.repeat(run.n))) };
    }
    const pair = runs.find((x) => x.n > 1 && 'VLD'.includes(x.ch));
    if (pair) {
      return { rule: 5, label: `${pair.ch}${pair.ch} is one bigger letter`, start: pair.start, end: pair.end, to: toRoman(lenientValue(pair.ch.repeat(pair.n))) };
    }
    if (r.issues.some((i) => i.rule === 3)) {
      return { rule: 3, label: 'Only one smaller letter before a bigger one', ...span(cur, r.simplest) };
    }
    if (r.simplest !== cur) {
      return { rule: 5, label: 'Write the simplest form', ...span(cur, r.simplest) };
    }
    return null;
  }

  // Fix It: the steps to repair a numeral, starting from what was typed and ending at the simplest form.
  function repairPlan(s) {
    const steps = [{ kind: 'start', tiles: tilesOf(s) }];
    let cur = s;
    for (let guard = 0; guard < 12; guard++) {
      const fix = firstRepair(cur);
      if (!fix) break;
      const next = cur.slice(0, fix.start) + fix.to + cur.slice(fix.end);
      steps.push({
        kind: 'repair',
        rule: fix.rule,
        label: fix.label,
        before: tilesOf(cur, fix.start, fix.end, 'cross'),
        after: tilesOf(next, fix.start, fix.start + fix.to.length, 'new'),
      });
      cur = next;
    }
    const r = check(cur);
    const ok = r.value !== null && r.value >= 1 && r.value <= MAX && r.simplest === cur;
    steps.push({ kind: 'done', tiles: tilesOf(cur), ok, result: cur });
    return { steps, result: cur, ok, start: s };
  }

  // Read "XL + XX - IX" into terms and operators.
  function parse(text) {
    const parts = text.trim().toUpperCase().split(/\s*([+\-−])\s*/).filter(Boolean);
    const terms = parts.filter((_, i) => i % 2 === 0);
    const ops = parts.filter((_, i) => i % 2 === 1).map((o) => (o === '+' ? '+' : '-'));
    if (!terms.length || ops.length !== terms.length - 1) return { error: 'Type a numeral, then + or - and another numeral.' };
    for (const term of terms) {
      const r = check(term);
      if (!r.ok && r.issues.some((i) => i.rule === null)) return { error: r.issues[0].text };
    }
    return { terms, ops };
  }

  // Random practice. `rand` returns a number from 0 up to 1 (Math.random by default), so tests can pass a fixed sequence.
  const randomInt = (lo, hi, rand) => lo + Math.floor(rand() * (hi - lo + 1));

  // Random numerals in simplest form, from 4 to 499, keeping only those within the letter limit (388 has 11 letters, so it is left out).
  const RANDOM_NUMERALS = [];
  for (let n = 4; n <= 499; n++) if (toRoman(n).length <= LETTER_LIMIT) RANDOM_NUMERALS.push(toRoman(n));

  function randomNumeral(rand = Math.random) {
    return RANDOM_NUMERALS[randomInt(0, RANDOM_NUMERALS.length - 1, rand)];
  }

  // Add & Subtract: a random sum or difference of two numerals up to 99, ready to type in (e.g. "XL - XX").
  // A difference is never below 1.
  function randomSum(rand = Math.random) {
    const adding = rand() < 0.5;
    const a = randomInt(2, 99, rand);
    const b = adding ? randomInt(1, 99, rand) : randomInt(1, a - 1, rand);
    return { text: `${toRoman(a)} ${adding ? '+' : '-'} ${toRoman(b)}`, value: adding ? a + b : a - b };
  }

  // Fix It: a bad numeral made by writing each subtractive pair as its pieces (XL becomes XXXX).
  // Only numbers with a pair are used, so the bad numeral is always wrong and the answer is always the simplest form.
  function disarrange(s) {
    return s.replace(/IV|IX|XL|XC|CD|CM/g, (pair) => PAIR_PIECES[pair]);
  }
  const DISARRANGEABLE = [];
  for (let n = 2; n <= 99; n++) if (disarrange(toRoman(n)) !== toRoman(n)) DISARRANGEABLE.push(n);

  function randomDisarranged(rand = Math.random) {
    const value = DISARRANGEABLE[randomInt(0, DISARRANGEABLE.length - 1, rand)];
    return { numeral: disarrange(toRoman(value)), answer: toRoman(value), value };
  }

  // True / False / Ambiguous statements for the quiz. "Ambiguous" marks numerals the rules leave open.
  // Each statement uses at most three different letters.
  const TRUE_FALSE = [
    { prompt: 'IV means 4', answer: 'True' },
    { prompt: 'IX means 9', answer: 'True' },
    { prompt: 'XL means 40', answer: 'True' },
    { prompt: 'XC means 90', answer: 'True' },
    { prompt: 'CM means 900', answer: 'True' },
    { prompt: 'LX means 60', answer: 'True' },
    { prompt: 'III means 3', answer: 'True' },
    { prompt: 'XXX means 30', answer: 'True' },
    { prompt: 'CD means 400', answer: 'True' },
    { prompt: 'DC means 600', answer: 'True' },
    { prompt: 'IIII is right', answer: 'False', why: 'Rule 1: no more than three in a row. Use IV.' },
    { prompt: 'CCCC is right', answer: 'False', why: 'Rule 1: no more than three in a row. Use CD.' },
    { prompt: 'LL is right', answer: 'False', why: 'Rule 5: simplest form is C.' },
    { prompt: 'VV is right', answer: 'False', why: 'Rule 5: simplest form is X.' },
    { prompt: 'VIIII is right', answer: 'False', why: 'Rule 2: no more than three. Use IX.' },
    { prompt: 'IIV is right', answer: 'False', why: 'Rule 3: only one letter before a bigger one.' },
    { prompt: 'XXXX is right', answer: 'False', why: 'Rule 5: simplest form is XL.' },
    { prompt: 'IV means 6', answer: 'False', why: 'IV means 4.' },
    { prompt: 'IL is right', answer: 'Ambiguous', why: 'Could be read two ways.' },
    { prompt: 'IC is right', answer: 'Ambiguous', why: 'Could be read two ways.' },
    { prompt: 'VIX is right', answer: 'Ambiguous', why: 'Could be read two ways.' },
  ];

  return {
    VALUE, PAIR_PIECES, TRADE, MAX, LETTER_LIMIT, QUIZ_MAX_TYPES, TRUE_FALSE, DISARRANGEABLE, RANDOM_NUMERALS,
    lenientValue, toRoman, chunks, check, calculate, repairPlan, firstRepair, parse, disarrange,
    randomNumeral, randomSum, randomDisarranged,
  };
});
