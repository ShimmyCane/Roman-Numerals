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
  // The whole sum is one line of chunks (XL, I, +, X, IX ...). Parts are expanded in place (XL shows an arrow to XXXX),
  // matching parts are crossed out on both sides, and what is left goes to the right of '=', unsorted.
  // The right side is then regrouped one step at a time and written in simplest form.
  //   token: { text, op?, eq?, term?, side: 'left' | 'right', st: 'todo' | 'new' | 'done', focus?, becomes? }
  function calculate(terms, ops) {
    const steps = [];
    const line = [];

    terms.forEach((term, k) => {
      if (k > 0) line.push({ op: true, text: ops[k - 1] === '+' ? '+' : '−' });
      chunks(term).forEach((c) => line.push({ text: c.text, st: 'todo', term: k, side: 'left' }));
    });

    // Record one step. Pieces that just appeared stop being new, so later steps do not replay their animation.
    const snap = (text, value = null) => {
      steps.push({ text, line: line.map((t) => ({ ...t })), value });
      line.forEach((t) => {
        delete t.focus;
        delete t.becomes;
        if (t.st === 'new') t.st = 'todo';
      });
    };

    // Live parts: not crossed out, and on the given side. Each comes with its index on the line.
    const live = (side, pred = () => true) => line
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => !t.op && !t.eq && t.side === side && t.st === 'todo' && pred(t));

    const rightLive = () => line
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => !t.op && !t.eq && t.side === 'right' && t.st !== 'done');
    const rightValue = () => rightLive().reduce((sum, { t }) => sum + lenientValue(t.text), 0);

    // Expand one left-side part in place. It stays on the line, crossed out, with an arrow to its pieces.
    const expand = (i) => {
      const t = line[i];
      const pieces = PAIR_PIECES[t.text] || TRADE[t.text];
      t.st = 'done';
      t.focus = true;
      t.becomes = pieces;
      line.splice(i + 1, 0, ...pieces.split('').map((ch) => ({ text: ch, st: 'new', term: t.term, side: 'left' })));
      return pieces;
    };

    // Make sure n live parts of this letter are on the left, from parts of the other numbers.
    // If there are not enough, the smallest bigger part is expanded, one step at a time.
    const ensure = (ch, n, skipTerm) => {
      const count = () => live('left', (t) => t.text === ch && t.term !== skipTerm).length;
      while (count() < n) {
        const bigger = live('left', (t) => t.term !== skipTerm && lenientValue(t.text) > VALUE[ch]);
        if (!bigger.length) throw new Error(`Not enough to take away ${ch}`);
        const pick = bigger.reduce((a, b) => (lenientValue(b.t.text) < lenientValue(a.t.text) ? b : a));
        const text = pick.t.text;
        const pieces = expand(pick.i);
        snap(PAIR_PIECES[text]
          ? `Break ${text} into ${pieces.split('').join(' ')}.`
          : `No ${ch} to take away, so trade one ${text} for ${pieces.split('').join(' ')}.`);
      }
    };

    // Subtract the second number. Its parts are matched on the left and crossed out together.
    const subtract = (k) => {
      const isSecond = (t) => !t.op && !t.eq && t.term === k && t.side === 'left' && t.st === 'todo';
      line.forEach((t) => { if (t.term === k && !t.op) t.focus = true; });
      snap(`Second number ${terms[k]} = ${lenientValue(terms[k])}.`);
      for (;;) {
        const idx = line.findIndex(isSecond);
        if (idx < 0) break;
        const part = line[idx];
        if (PAIR_PIECES[part.text]) {
          const match = live('left', (t) => t.text === part.text && t.term !== k)[0];
          if (match) {
            part.st = 'done';
            part.focus = true;
            match.t.st = 'done';
            match.t.focus = true;
            snap(`Take away ${part.text}. The same is on both sides.`);
          } else {
            const pieces = expand(idx);
            snap(`Break ${part.text} into ${pieces.split('').join(' ')}.`);
          }
          continue;
        }
        // A run of the same letter from the second number is taken away in one step.
        const group = line.map((t, i) => ({ t, i })).filter(({ t }) => isSecond(t) && t.text === part.text);
        ensure(part.text, group.length, k);
        const takers = live('left', (t) => t.text === part.text && t.term !== k).slice(0, group.length);
        const second = line.map((t, i) => ({ t, i })).filter(({ t }) => isSecond(t) && t.text === part.text);
        takers.forEach(({ t }) => { t.st = 'done'; t.focus = true; });
        second.forEach(({ t }) => { t.st = 'done'; t.focus = true; });
        snap(second.length === 1 ? `Take away ${part.text}.` : `Take away ${second.length} ${part.text}'s.`);
      }
    };

    // Replace each left-side pair with its pieces, so every letter can be grouped.
    const breakLeftPairs = () => {
      for (;;) {
        const i = line.findIndex((t) => !t.op && !t.eq && t.side === 'left' && t.st === 'todo' && PAIR_PIECES[t.text]);
        if (i < 0) break;
        const text = line[i].text;
        const pieces = expand(i);
        snap(`Break ${text} into ${pieces.split('').join(' ')}.`);
      }
    };

    // Regroup the right side one letter-group at a time, then write it in order and in simplest form.
    const regroup = (value) => {
      let grew = true;
      while (grew) {
        grew = false;
        for (const [from, to, n] of MERGE) {
          const have = rightLive().filter(({ t }) => t.text === from);
          if (have.length >= n) {
            have.slice(0, n).forEach(({ t }) => { t.st = 'done'; t.focus = true; });
            line.push({ text: to, st: 'new', side: 'right' });
            snap(`Put ${n} ${from}'s together. They make one ${to}.`, value());
            grew = true;
            break;
          }
        }
      }
    };

    const rewrite = (texts, caption, value) => {
      rightLive().forEach(({ t }) => { t.st = 'done'; t.focus = true; });
      texts.forEach((text) => line.push({ text, st: 'new', side: 'right' }));
      snap(caption, value);
    };

    try {
      snap(`Full sum: ${terms.map((t, k) => (k ? `${ops[k - 1] === '+' ? '+' : '−'} ${t}` : t)).join(' ')}.`);

      for (let k = 1; k < terms.length; k++) {
        if (ops[k - 1] === '+') {
          line.forEach((t) => { if (t.term === k && !t.op) t.focus = true; });
          snap(`Add ${terms[k]} = ${lenientValue(terms[k])}.`);
        } else {
          subtract(k);
        }
      }

      breakLeftPairs();
      const leftovers = live('left');
      leftovers.forEach(({ t }) => { t.st = 'done'; t.focus = true; });
      line.push({ op: true, eq: true, text: '=' });
      leftovers.forEach(({ t }) => line.push({ text: t.text, st: 'new', side: 'right' }));
      const value = rightValue();
      if (value < 1 || value > MAX) {
        const error = value < 1 ? 'Zero has no Roman numeral.' : `That is more than ${MAX}, the biggest this tool writes.`;
        snap(error, value);
        return { steps, value, result: null, error };
      }
      snap('The rest of the sum is the answer. It is not in order yet.', value);

      regroup(rightValue);

      const result = toRoman(rightValue());
      const current = rightLive().map(({ t }) => t.text);
      if (current.join('') === result) {
        rightLive().forEach(({ t }) => { t.focus = true; });
        snap(`Simplest form: ${result}.`, rightValue());
      } else {
        const ordered = current.slice().sort((a, b) => lenientValue(b) - lenientValue(a));
        if (ordered.join('') !== current.join('')) {
          rewrite(ordered, `Put the pieces in order: ${ordered.join(' ')}.`, rightValue());
        }
        rewrite(chunks(result).map((c) => c.text), `Build it back up: ${result}.`, rightValue());
      }
      return { steps, value: rightValue(), result, error: null };
    } catch (err) {
      const error = 'Romans had no negative numbers. Try a bigger first number.';
      snap('Stop here. There is not enough to take away, and Romans had no negative numbers.');
      return { steps, value: null, result: null, error };
    }
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

  // True / False statements for the quiz. Each statement uses at most three different letters.
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
    { prompt: 'IL is right', answer: 'False', why: 'Not well written. Write it as XLIX.' },
    { prompt: 'IC is right', answer: 'False', why: 'Not well written. Write it as XCIX.' },
    { prompt: 'VIX is right', answer: 'False', why: 'Not well written. Write it as XIV.' },
  ];

  return {
    VALUE, PAIR_PIECES, TRADE, MAX, LETTER_LIMIT, QUIZ_MAX_TYPES, TRUE_FALSE, DISARRANGEABLE, RANDOM_NUMERALS,
    lenientValue, toRoman, chunks, check, calculate, repairPlan, firstRepair, parse, disarrange,
    randomNumeral, randomSum, randomDisarranged,
  };
});
