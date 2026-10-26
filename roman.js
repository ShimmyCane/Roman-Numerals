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
  // Quick check numerals use at most this many different letters (I, V, X and so on).
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

  // Tiles: { ch, st } where st is 'normal', 'new' (just appeared) or 'cross' (being taken away).
  const tableValue = (table) => table.reduce((sum, t) => (t.st === 'cross' ? sum : sum + VALUE[t.ch]), 0);
  const byValueDesc = (a, b) => VALUE[b] - VALUE[a];

  // Walk through a sum (or one numeral). Every change is recorded as a step with a board snapshot.
  function calculate(terms, ops) {
    const steps = [];
    let table = [];

    // Record the board, then clear the crossed-out tiles so the next step starts clean.
    const snap = (text) => {
      steps.push({ text, tiles: table.map((t) => ({ ...t })), value: tableValue(table) });
      table = table.filter((t) => t.st !== 'cross').map((t) => ({ ch: t.ch, st: 'normal' }));
    };

    const regroup = () => {
      let merged = true;
      while (merged) {
        merged = false;
        for (const [from, to, n] of MERGE) {
          const have = table.filter((t) => t.ch === from && t.st !== 'cross');
          if (have.length >= n) {
            have.slice(0, n).forEach((t) => { t.st = 'cross'; });
            table.push({ ch: to, st: 'new' });
            snap(`Put ${n} ${from}'s together. They make one ${to}.`);
            merged = true;
            break;
          }
        }
      }
    };

    const takeAway = (ch) => {
      while (!table.some((t) => t.ch === ch && t.st !== 'cross')) {
        let j = -1;
        table.forEach((t, i) => {
          if (t.st !== 'cross' && VALUE[t.ch] > VALUE[ch] && (j < 0 || VALUE[t.ch] < VALUE[table[j].ch])) j = i;
        });
        if (j < 0) throw new Error(`Not enough to take away ${ch}`);
        const big = table[j].ch;
        table[j].st = 'cross';
        table.splice(j + 1, 0, ...TRADE[big].split('').map((c) => ({ ch: c, st: 'new' })));
        snap(`No ${ch} to take away, so trade one ${big} for ${TRADE[big].split('').join(' ')}.`);
      }
      const i = table.findIndex((t) => t.ch === ch && t.st !== 'cross');
      table[i].st = 'cross';
      snap(`Take away ${ch}.`);
    };

    try {
      for (const c of chunks(terms[0])) table.push(...c.pieces.split('').map((ch) => ({ ch, st: 'new' })));
      snap(`${terms[0]} = ${lenientValue(terms[0])}. Break it into its parts.`);
      regroup();

      for (let k = 1; k < terms.length; k++) {
        const pieces = chunks(terms[k]).flatMap((c) => c.pieces.split(''));
        if (ops[k - 1] === '+') {
          table.push(...pieces.map((ch) => ({ ch, st: 'new' })));
          snap(`Add ${terms[k]} = ${lenientValue(terms[k])}. Put its parts on the table.`);
        } else {
          pieces.forEach(takeAway);
        }
        regroup();
      }
    } catch (err) {
      const error = 'Romans had no negative numbers. Try a bigger first number.';
      steps.push({ text: 'Stop here. There is not enough to take away, and Romans had no negative numbers.', tiles: table.map((t) => ({ ...t })), value: null });
      return { steps, value: null, result: null, error };
    }

    const value = tableValue(table);
    if (value < 1 || value > MAX) {
      const error = value < 1 ? 'Zero has no Roman numeral.' : `That is more than ${MAX}, the biggest this tool writes.`;
      steps.push({ text: error, tiles: table.map((t) => ({ ...t })), value });
      return { steps, value, result: null, error };
    }

    const letters = table.filter((t) => t.st !== 'cross').map((t) => t.ch).sort(byValueDesc).join('');
    const result = toRoman(value);
    table = table.filter((t) => t.st !== 'cross').sort((a, b) => byValueDesc(a.ch, b.ch));
    snap(letters === result ? `Simplest form: ${result}.` : `Simplest form: ${letters} becomes ${result}.`);
    return { steps, value, result, error: null };
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

  // True / False / Ambiguous statements for the quick check. "Ambiguous" marks numerals the rules leave open.
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

  // Disarranged numerals the student converts to the correct form. Each answer is checked in the tests.
  const CONVERT = [
    { prompt: 'IIII', answer: 'IV', wrong: 'VI' },
    { prompt: 'VIIII', answer: 'IX', wrong: 'XI' },
    { prompt: 'XXXX', answer: 'XL', wrong: 'LX' },
    { prompt: 'VV', answer: 'X', wrong: 'V' },
    { prompt: 'CCCC', answer: 'CD', wrong: 'DC' },
    { prompt: 'XIIII', answer: 'XIV', wrong: 'XVI' },
    { prompt: 'IXV', answer: 'XIV', wrong: 'XVI' },
  ];

  return { VALUE, PAIR_PIECES, TRADE, MAX, LETTER_LIMIT, QUIZ_MAX_TYPES, TRUE_FALSE, CONVERT, lenientValue, toRoman, chunks, check, calculate, parse };
});
