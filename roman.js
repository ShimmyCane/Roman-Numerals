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

  // Board tiles: { ch, st }. ch is one letter, or a subtractive pair (XL, IX, ...) until it is broken.
  // st is 'normal', 'new' (just appeared) or 'cross' (being taken away).
  const isPairTile = (t) => t.st !== 'cross' && PAIR_PIECES[t.ch] !== undefined;
  const tileValue = (t) => lenientValue(t.ch);
  const tableValue = (tiles) => tiles.reduce((sum, t) => (t.st === 'cross' ? sum : sum + tileValue(t)), 0);
  const byValueDesc = (a, b) => tileValue(b) - tileValue(a);

  // Walk through a sum (or one numeral). Each step does one thing (break one pair, take away one piece,
  // trade one letter, merge one group, or rebuild), and is recorded with a board snapshot.
  function calculate(terms, ops) {
    const steps = [];
    let table = [];
    const copy = (tiles) => tiles.map((t) => ({ ...t }));

    // Record the board (crossed tiles still showing), then clear the crosses so the next step starts clean.
    const snap = (text) => {
      steps.push({ text, tiles: copy(table), value: tableValue(table) });
      table = table.filter((t) => t.st !== 'cross').map((t) => ({ ch: t.ch, st: 'normal' }));
    };

    // A step that shows a number on its own, without changing the board. Used for the second number of a subtraction.
    const showOnly = (text, tiles) => steps.push({ text, tiles: copy(tiles), value: tableValue(tiles) });

    // Break one subtractive pair on the board (XL becomes XXXX), then record it.
    const breakPair = (i) => {
      const old = table[i].ch;
      const pieces = PAIR_PIECES[old].split('');
      table[i].st = 'cross';
      table.splice(i + 1, 0, ...pieces.map((ch) => ({ ch, st: 'new' })));
      snap(`Break ${old} into ${pieces.join(' ')}.`);
    };
    const breakAll = () => {
      for (let i = table.findIndex(isPairTile); i >= 0; i = table.findIndex(isPairTile)) breakPair(i);
    };

    // Put a term's pieces on the board. Its pairs are broken in a later step.
    const putOn = (term) => {
      table.push(...chunks(term).map((c) => ({ ch: c.text, st: 'new' })));
    };

    // Pieces that join into one bigger letter once there are enough of them.
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
      putOn(terms[0]);
      snap(`Start with ${terms[0]} = ${lenientValue(terms[0])}.`);
      breakAll();
      regroup();

      for (let k = 1; k < terms.length; k++) {
        const term = terms[k];
        if (ops[k - 1] === '+') {
          putOn(term);
          snap(`Add ${term} = ${lenientValue(term)}. Put it on the board.`);
          breakAll();
          regroup();
        } else {
          // The second number gets its own row. Its pairs are broken there, then each piece is taken away from the board.
          const second = chunks(term).map((c) => ({ ch: c.text, st: 'normal' }));
          showOnly(`Second number ${term} = ${lenientValue(term)}. Break it into parts.`, second);
          for (let i = second.findIndex(isPairTile); i >= 0; i = second.findIndex(isPairTile)) {
            const old = second[i].ch;
            const pieces = PAIR_PIECES[old].split('').map((ch) => ({ ch, st: 'normal' }));
            second.splice(i, 1, ...pieces);
            showOnly(`Break ${old} into ${pieces.map((p) => p.ch).join(' ')}.`, second);
          }
          second.flatMap((t) => t.ch.split('')).forEach(takeAway);
          regroup();
        }
      }
    } catch (err) {
      const error = 'Romans had no negative numbers. Try a bigger first number.';
      steps.push({ text: 'Stop here. There is not enough to take away, and Romans had no negative numbers.', tiles: copy(table), value: null });
      return { steps, value: null, result: null, error };
    }

    const value = tableValue(table);
    if (value < 1 || value > MAX) {
      const error = value < 1 ? 'Zero has no Roman numeral.' : `That is more than ${MAX}, the biggest this tool writes.`;
      steps.push({ text: error, tiles: copy(table), value });
      return { steps, value, result: null, error };
    }

    const result = toRoman(value);
    table = table.filter((t) => t.st !== 'cross').sort(byValueDesc);
    const loose = table.map((t) => t.ch).join('');
    if (loose !== result) {
      snap(`Put the pieces in order: ${loose} = ${value}.`);
      table = chunks(result).map((c) => ({ ch: c.text, st: 'new' }));
      snap(`Build it back up: ${result}.`);
    } else {
      snap(`Simplest form: ${result}.`);
    }
    return { steps, value, result, error: null };
  }

  // Fix It: the steps to repair a numeral. Each broken rule is named first, then the rebuild uses the same steps as Build & Break.
  function fixSteps(s) {
    const r = check(s);
    const calc = calculate([s], []);
    const first = calc.steps[0];
    const named = r.issues
      .filter((i) => i.rule !== null)
      .map((i) => ({ text: `Rule ${i.rule}: ${i.text}`, tiles: first.tiles, value: first.value }));
    return { ok: r.ok, check: r, steps: [...named, ...calc.steps], result: calc.result, error: calc.error };
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
    lenientValue, toRoman, chunks, check, calculate, fixSteps, parse, disarrange,
    randomNumeral, randomSum, randomDisarranged,
  };
});
