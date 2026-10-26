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

  // Number words (one, forty, nine hundred ...). The app writes values in words, never in Arabic numerals,
  // except on the Long Ago tab.
  const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function words(n) {
    if (n === 0) return 'zero';
    const out = [];
    if (n >= 1000) { out.push(`${ONES[Math.floor(n / 1000)]} thousand`); n %= 1000; }
    if (n >= 100) { out.push(`${ONES[Math.floor(n / 100)]} hundred`); n %= 100; }
    if (n >= 20) { out.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '')); n = 0; }
    if (n > 0) out.push(ONES[n]);
    return out.join(' ');
  }
  const Words = (n) => words(n).charAt(0).toUpperCase() + words(n).slice(1);

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
        issues.push({ rule: 1, text: `${Words(r.n)} ${r.ch}'s in a row. No more than three equal numerals in a row.` });
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
        issues.push({ rule: 2, text: `${Words(after.n)} smaller numerals after a bigger one. No more than three.` });
      }
    }

    if (s.length > LETTER_LIMIT) issues.push({ rule: 'length', text: `Use ${words(LETTER_LIMIT)} letters or fewer.` });

    const value = lenientValue(s);
    if (value < 1 || value > MAX) {
      issues.push({ rule: null, text: `This tool works from I to ${toRoman(MAX)}.` });
      return { ok: false, value, simplest: null, issues };
    }

    const simplest = toRoman(value);
    if (simplest !== s && !issues.some((i) => i.rule === 5)) {
      issues.push({ rule: 5, text: `Write it in the simplest form: ${simplest}.` });
    }
    return { ok: issues.length === 0 && simplest === s, value, simplest, issues };
  }

  // ---------- Add & Subtract ----------
  // Worked like a counting board. First the short way: if the letters only need to slide together (or come out),
  // that is one step. Otherwise the numbers are lined up by place (thousands, hundreds, tens, ones) and worked one
  // place at a time from the ones up. A place that reaches ten moves one letter up to the next place (carry).
  // A place that is short borrows one letter from the place above. Each step changes one place, so each row shows one change.
  //   step: { text, kind: 'line', tokens: [{ text, st: 'normal' | 'focus' | 'cross', op? }], value }
  //       | { text, kind: 'places', boxes: [{ label, items: [{ text, sign }], focus, was }], value }
  const PLACES = [
    { label: 'Thousands', unit: 1000, one: 'M' },
    { label: 'Hundreds', unit: 100, one: 'C' },
    { label: 'Tens', unit: 10, one: 'X' },
    { label: 'Ones', unit: 1, one: 'I' },
  ];

  // The part of a number that sits in one place: 29 has XX in the tens and IX in the ones.
  const placePart = (n, unit) => {
    const d = Math.floor(n / unit) % 10;
    return d ? toRoman(d * unit) : '';
  };
  const blocksOf = (s) => chunks(s).map((c) => c.text);
  const byValue = (a, b) => lenientValue(b) - lenientValue(a);
  const copyItems = (items) => items.map((it) => ({ ...it }));
  const signOf = (op) => (op === '+' ? '+' : '−');

  // An equation as numbers and signs. Each number is a row of tiles, one tile per part (XXIX is X, X, IX), so a
  // part can be crossed out when it is taken away. result, when set, is written after an = sign.
  function eqOf(terms, ops, result = null) {
    const items = [];
    terms.forEach((t, k) => {
      if (k) items.push({ kind: 'op', text: signOf(ops[k - 1]) });
      items.push({ kind: 'num', tiles: chunks(t).map((c) => ({ ch: c.text, st: 'normal' })) });
    });
    return { items, result };
  }
  const copyEq = (eq) => ({ ...eq, items: eq.items.map((it) => (it.tiles ? { ...it, tiles: it.tiles.map((t) => ({ ...t })) } : { ...it })) });

  function calculate(terms, ops) {
    const steps = [];
    // The whole equation still to work sits on top of every row. Parts already worked are replaced by their answer.
    let eqNow = eqOf(terms, ops);
    const line = (text, tokens, value = null) => steps.push({ text, kind: 'line', tokens, value, eq: eqNow });
    const plain = (s) => blocksOf(s).map((t) => ({ text: t, st: 'normal' }));
    const pairTokens = (a, op, b) => [...plain(a), { text: signOf(op), op: true }, ...plain(b)];

    // Work out one place at a time, from the ones up. dir is +1 to add, -1 to take away.
    const byPlace = (a, b, dir, result, total) => {
      const va = lenientValue(a);
      const vb = lenientValue(b);
      const boxes = PLACES.map((p) => ({
        ...p,
        items: [{ text: placePart(va, p.unit), sign: 1 }, { text: placePart(vb, p.unit), sign: dir }].filter((it) => it.text),
      }));
      const lower = (bx) => bx.label.toLowerCase();
      const posItem = (bx) => bx.items.find((it) => it.sign > 0);
      const posValue = (bx) => (posItem(bx) ? lenientValue(posItem(bx).text) : 0);
      // Set the first number's part of a place to a new value (0 empties it).
      const setPos = (bx, v) => {
        const it = posItem(bx);
        if (v > 0 && it) it.text = toRoman(v);
        else if (v > 0) bx.items.unshift({ text: toRoman(v), sign: 1 });
        else if (it) bx.items.splice(bx.items.indexOf(it), 1);
      };
      // Record the places. Changed places carry what they held before (was), so the row can show old → new.
      const snap = (text, changed = {}) => steps.push({
        text,
        kind: 'places',
        value: null,
        eq: eqNow,
        boxes: boxes
          .filter((bx) => bx.items.length || changed[bx.unit])
          .map((bx) => ({
            label: bx.label,
            items: copyItems(bx.items),
            focus: Boolean(changed[bx.unit]),
            was: Array.isArray(changed[bx.unit]) ? changed[bx.unit] : null,
          })),
      }) && boxes.forEach((bx) => bx.items.forEach((it) => { delete it.fresh; }));

      snap('Line up the columns. Start with the ones.');
      const order = boxes.slice().reverse();
      order.forEach((bx, idx) => {
        const up = order[idx + 1];
        if (dir > 0) {
          if (bx.items.length < 2) return;
          const was = copyItems(bx.items);
          const sum = was.reduce((t, it) => t + lenientValue(it.text), 0);
          const written = toRoman(sum);
          bx.items = [{ text: written, sign: 1 }];
          snap(`${bx.label}: ${was.map((it) => it.text).join(' + ')} = ${written}.`, { [bx.unit]: was });
          if (sum >= 10 * bx.unit) {
            const was2 = copyItems(bx.items);
            const rest = sum - 10 * bx.unit;
            bx.items = rest ? [{ text: toRoman(rest), sign: 1 }] : [];
            // The letter that moves up is marked as new in its place, instead of crossing out the whole place.
            up.items.push({ text: up.one, sign: 1, fresh: true });
            snap(rest
              ? `${written} has an ${up.one} in it. The ${up.one} belongs in the ${lower(up)}, so move it up. ${toRoman(rest)} stays in the ${lower(bx)}.`
              : `${written} belongs in the ${lower(up)}, so move it up. Nothing stays in the ${lower(bx)}.`,
            { [bx.unit]: was2, [up.unit]: 'added' });
          }
          return;
        }
        const neg = bx.items.find((it) => it.sign < 0);
        if (!neg) return;
        if (posValue(bx) < lenientValue(neg.text)) {
          // Borrow from the nearest place above that has something. Places in between get nine of their letter.
          let j = idx + 1;
          while (!posValue(order[j])) j++;
          const src = order[j];
          const changed = {};
          [src, ...order.slice(idx + 1, j), bx].forEach((b2) => { changed[b2.unit] = copyItems(b2.items); });
          const oldSrc = posItem(src).text;
          const oldCur = posItem(bx) ? posItem(bx).text : '';
          setPos(src, posValue(src) - src.unit);
          const middle = order.slice(idx + 1, j).map((m) => {
            setPos(m, 9 * m.unit);
            return `, the ${lower(m)} get ${toRoman(9 * m.unit)}`;
          }).join('');
          setPos(bx, posValue(bx) + 10 * bx.unit);
          const short = oldCur ? `${oldCur} is less than ${neg.text}` : `there is nothing here to take ${neg.text} from`;
          const fromSrc = posItem(src) ? `${oldSrc} becomes ${posItem(src).text}` : `${oldSrc} is used up`;
          const toCur = oldCur ? `${oldCur} becomes ${posItem(bx).text}` : `the ${lower(bx)} get ${posItem(bx).text}`;
          snap(`${bx.label}: ${short}. Get one ${src.one} from the ${lower(src)}: ${fromSrc}${middle}, and ${toCur}.`, changed);
        }
        const was = copyItems(bx.items);
        const top = posItem(bx).text;
        const d = posValue(bx) - lenientValue(neg.text);
        bx.items = d ? [{ text: toRoman(d), sign: 1 }] : [];
        snap(d ? `${bx.label}: ${top} − ${neg.text} = ${toRoman(d)}.` : `${bx.label}: ${top} − ${neg.text} leaves nothing in the ${lower(bx)}.`,
          { [bx.unit]: was });
      });

      const parts = boxes.filter((bx) => bx.items.length).map((bx) => bx.items[0].text);
      const joined = parts.join('');
      line(parts.length > 1 ? `Put the columns together: ${parts.join(' + ')} = ${joined}.` : `That gives ${joined}.`, plain(joined), total);
      if (joined !== result) line(`Write it in the simplest form: ${result}.`, plain(result), total);
      return { result };
    };

    const addPair = (a, b) => {
      const total = lenientValue(a) + lenientValue(b);
      if (total > MAX) {
        const error = `That is more than ${toRoman(MAX)}, the biggest this tool writes.`;
        line(error, pairTokens(a, '+', b));
        return { error, value: total };
      }
      const result = toRoman(total);
      // The short way: slide the smaller number's letters in among the bigger one's. If that is already simplest, stop.
      const small = blocksOf(a).length <= blocksOf(b).length ? a : b;
      const big = small === a ? b : a;
      const merged = [...blocksOf(big).map((t) => ({ text: t, st: 'normal' })), ...blocksOf(small).map((t) => ({ text: t, st: 'focus' }))]
        .sort((x, y) => byValue(x.text, y.text));
      if (merged.map((t) => t.text).join('') === result) {
        line(`Slide ${small} in among the letters of ${big}: ${result}. Nothing else needs to change.`, merged, total);
        return { result };
      }
      return byPlace(a, b, 1, result, total);
    };

    const subPair = (a, b) => {
      const diff = lenientValue(a) - lenientValue(b);
      if (diff < 0) {
        const error = 'You cannot take away more than you have. Romans had no negative numbers.';
        line(`${a} is less than ${b}. ${error}`, pairTokens(a, '-', b));
        return { error, value: null };
      }
      if (diff === 0) {
        const error = 'Nothing is left. Romans had no zero.';
        line(error, pairTokens(a, '-', b), 0);
        return { error, value: 0 };
      }
      const result = toRoman(diff);
      // The short way: every part of the second number is also a part of the first. Cross them out; if what is left
      // is already simplest, that is the answer.
      const left = plain(a);
      const fits = blocksOf(b).every((t) => {
        const hit = left.find((x) => x.st === 'normal' && x.text === t);
        if (hit) hit.st = 'cross';
        return Boolean(hit);
      });
      if (fits && left.filter((x) => x.st === 'normal').map((x) => x.text).join('') === result) {
        line(`Take ${b} out of ${a}: cross out ${blocksOf(b).join(', ')}.`, left);
        line(`${result} is left.`, plain(result), diff);
        return { result };
      }
      return byPlace(a, b, -1, result, diff);
    };

    // The equation sits on top of every row, so these rows need no working of their own.
    line(`The whole problem: ${terms.map((t, k) => (k ? `${signOf(ops[k - 1])} ${t}` : t)).join(' ')}.`, []);

    let current = terms[0];
    for (let k = 1; k < terms.length; k++) {
      const op = ops[k - 1];
      eqNow = eqOf([current, ...terms.slice(k)], ops.slice(k - 1));
      if (terms.length > 2) line(`Next: ${current} ${signOf(op)} ${terms[k]}.`, []);
      const out = op === '+' ? addPair(current, terms[k]) : subPair(current, terms[k]);
      if (out.error) return { steps, value: out.value === undefined ? null : out.value, result: null, error: out.error };
      current = out.result;
    }
    const last = steps[steps.length - 1];
    last.eq = { ...eqOf(terms, ops), result: current };
    if (terms.length === 1) line(`${current} is already a whole number. Nothing to add or take away.`, plain(current), lenientValue(current));
    return { steps, value: lenientValue(current), result: current, error: null };
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
      return { rule: 1, label: `${Words(run.n)} ${run.ch}'s in a row`, start: run.start, end: run.end, to: toRoman(lenientValue(run.ch.repeat(run.n))) };
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

  // ---------- Regroup ----------
  // The combine-and-regroup way to add, as most guides teach it: write all the letters together, open any short
  // forms (IV is IIII), put the letters in order, regroup (five I's make a V, two V's make an X ...), then write
  // the short forms again where there are too many in a row. Steps use the same shape as Fix It, so they show
  // before → after: start, repair, done.
  const REGROUP_WORDS = { 5: 'Five', 2: 'Two' };
  const SHORT_FORMS = [['DCCCC', 'CM'], ['CCCC', 'CD'], ['LXXXX', 'XC'], ['XXXX', 'XL'], ['VIIII', 'IX'], ['IIII', 'IV']];

  // Steps in the Fix It shape. Each change crosses out a part and puts the new letters in its place.
  // eqFn gives the equation as it stands, shown on top of each row.
  function regroupSteps(start, label, eqFn) {
    let cur = start;
    const steps = [{ kind: 'start', tiles: tilesOf(cur), label, eq: eqFn() }];
    const change = (from, to, text, label2) => {
      const next = cur.slice(0, from) + text + cur.slice(to);
      steps.push({ kind: 'repair', label: label2, before: tilesOf(cur, from, to, 'cross'), after: tilesOf(next, from, from + text.length, 'new'), eq: eqFn() });
      cur = next;
    };
    // Regroup one trade at a time, then write the short forms where there are too many in a row.
    const finish = () => {
      for (let grew = true; grew;) {
        grew = false;
        for (const [from, to, n] of MERGE) {
          const at = cur.indexOf(from.repeat(n));
          if (at >= 0) {
            change(at, at + n, to, `${REGROUP_WORDS[n]} ${from}'s make one ${to}.`);
            grew = true;
            break;
          }
        }
      }
      for (const [long, short] of SHORT_FORMS) {
        const at = cur.indexOf(long);
        if (at >= 0) change(at, at + long.length, short, `${long} is the long way. The short way is ${short}.`);
      }
    };
    return { steps, change, finish, get cur() { return cur; }, set cur(v) { cur = v; } };
  }

  function regroupPlan(terms) {
    const total = terms.reduce((sum, t) => sum + lenientValue(t), 0);
    const parts = terms.slice();
    const eq = eqOf(terms, terms.slice(1).map(() => '+'));
    const r = regroupSteps(parts.join(''), `Write the letters of ${terms.join(' and ')} side by side.`, () => copyEq(eq));

    // Open short forms, one number at a time, so a pair is never read across two numbers.
    parts.forEach((part, k) => {
      for (let m = /IV|IX|XL|XC|CD|CM/.exec(parts[k]); m; m = /IV|IX|XL|XC|CD|CM/.exec(parts[k])) {
        const offset = parts.slice(0, k).join('').length + m.index;
        const open = PAIR_PIECES[m[0]];
        parts[k] = parts[k].slice(0, m.index) + open + parts[k].slice(m.index + 2);
        r.change(offset, offset + 2, open, `${m[0]} is a short way to write ${open}. Write it the long way.`);
      }
    });
    const sorted = r.cur.split('').sort((x, y) => VALUE[y] - VALUE[x]).join('');
    if (sorted !== r.cur) r.change(0, r.cur.length, sorted, 'Put the biggest letters first.');
    r.finish();

    const ok = total >= 1 && total <= MAX && r.cur === toRoman(total);
    r.steps.push({ kind: 'done', tiles: tilesOf(r.cur), ok, result: r.cur, eq: { ...copyEq(eq), result: r.cur } });
    return { steps: r.steps, result: r.cur, ok, value: total };
  }

  // ---------- Add & Subtract on one line ----------
  // Everything happens in the equation itself: A − B = ?. Letters taken away are crossed out on both sides, a trade
  // fades the letter it replaces and puts its pieces in its place, and once the left side is done, what is left is
  // written after the = sign and regrouped there. Each step is { kind: 'eq', label, eq }, where eq has the left
  // side (items), the right side (right: 'ask' for ?, or tiles) and which side is in focus.
  // Tile states: normal, cross (taken away), gone (just replaced, faded), new (just put in).
  const tile = (ch, st = 'normal') => ({ ch, st });
  const copyTiles = (tiles) => tiles.map((t) => ({ ...t }));
  const isOpen = (t) => t.st === 'normal';

  // A list of letters in words: ['X', 'X', 'V'] is "two X's and V".
  function listOf(chs) {
    const counts = [];
    chs.forEach((ch) => {
      const last = counts[counts.length - 1];
      if (last && last.ch === ch) last.n++;
      else counts.push({ ch, n: 1 });
    });
    const parts = counts.map((c) => (c.n > 1 ? `${words(c.n)} ${c.ch}'s` : c.ch));
    return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0];
  }

  function equationSteps(sides, ops) {
    const steps = [];
    const state = { right: 'ask', focus: 'left' };
    const snap = (label) => {
      const items = [];
      sides.forEach((tiles, k) => {
        if (k) items.push({ kind: 'op', text: signOf(ops[k - 1]) });
        items.push({ kind: 'num', tiles: copyTiles(tiles) });
      });
      steps.push({ kind: 'eq', label, eq: { items, right: state.right === 'ask' ? 'ask' : copyTiles(state.right), focus: state.focus } });
      // After a step is shown, replaced letters leave and new letters become plain.
      [...sides, ...(Array.isArray(state.right) ? [state.right] : [])].forEach((list) => {
        for (let i = list.length - 1; i >= 0; i--) {
          if (list[i].st === 'gone') list.splice(i, 1);
          else if (list[i].st === 'new') list[i].st = 'normal';
        }
      });
    };
    // Fade tiles from..to and put new letters in their place.
    const replace = (list, from, to, texts) => {
      for (let i = from; i < to; i++) list[i].st = 'gone';
      list.splice(to, 0, ...texts.map((ch) => tile(ch, 'new')));
    };
    // Where a run of plain letters spells text (VIIII), as [from, to], or null.
    const findSeq = (list, text) => {
      for (let i = 0; i < list.length; i++) {
        let joined = '';
        for (let j = i; j < list.length && isOpen(list[j]) && joined.length < text.length; j++) {
          joined += list[j].ch;
          if (joined === text) return [i, j + 1];
        }
      }
      return null;
    };
    // Regroup the right side one trade at a time, then write the short forms. A short form left among other
    // letters (V and IV) is opened first, and the letters put in order, so the trades can be seen.
    const regroupRight = (total) => {
      const right = state.right;
      const joined = () => right.map((t) => t.ch).join('');
      if (joined() !== toRoman(total)) {
        for (let i = right.findIndex((t) => PAIR_PIECES[t.ch]); i >= 0; i = right.findIndex((t) => isOpen(t) && PAIR_PIECES[t.ch])) {
          const pair = right[i].ch;
          replace(right, i, i + 1, PAIR_PIECES[pair].split(''));
          snap(`${pair} is a short way to write ${PAIR_PIECES[pair]}. Write it the long way.`);
        }
        const sorted = right.map((t) => t.ch).sort((x, y) => VALUE[y] - VALUE[x]);
        if (sorted.join('') !== joined()) {
          replace(right, 0, right.length, sorted);
          snap('Put the biggest letters first.');
        }
      }
      for (let grew = true; grew;) {
        grew = false;
        for (const [from, to, n] of MERGE) {
          const at = findSeq(right, from.repeat(n));
          if (at) {
            replace(right, at[0], at[1], [to]);
            snap(`${REGROUP_WORDS[n]} ${from}'s make one ${to}.`);
            grew = true;
            break;
          }
        }
      }
      for (const [long, short] of SHORT_FORMS) {
        const at = findSeq(right, long);
        if (at) {
          replace(right, at[0], at[1], [short]);
          snap(`${long} is the long way. The short way is ${short}.`);
        }
      }
      return right.map((t) => t.ch).join('');
    };
    return { steps, state, snap, replace, regroupRight };
  }

  // Take away: cross out what both numbers have in one move. When a letter is missing, open a short form or
  // trade one bigger letter for smaller ones, one trade per step. Then write what is left after = and regroup.
  function takeAwayEquation(a, b) {
    const total = lenientValue(a) - lenientValue(b);
    if (total < 1) return { steps: [], result: null, ok: false, value: total };
    const A = chunks(a).map((c) => tile(c.text));
    const B = chunks(b).map((c) => tile(c.text));
    const w = equationSteps([A, B], ['-']);
    w.snap(`Start with ${a}. Take away ${b}.`);
    let first = true;
    for (let guard = 0; guard < 60; guard++) {
      const need = B.filter(isOpen);
      if (!need.length) break;
      // Every letter (or short form) that both sides have is crossed out together, in one move.
      const used = new Set();
      const pairs = [];
      need.forEach((bt) => {
        const at = A.find((x) => isOpen(x) && !used.has(x) && x.ch === bt.ch);
        if (at) {
          used.add(at);
          pairs.push([at, bt]);
        }
      });
      if (pairs.length) {
        pairs.forEach(([x, y]) => { x.st = 'cross'; y.st = 'cross'; });
        const list = listOf(pairs.map(([, y]) => y.ch));
        const them = pairs.length > 1 ? 'them' : 'it';
        w.snap(first ? `Both numbers have ${list}. Take ${them} away: cross ${them} out on both sides.` : `Now take away ${list}: cross ${them} out on both sides.`);
        first = false;
        continue;
      }
      const big = need.reduce((m, t) => (lenientValue(t.ch) > lenientValue(m.ch) ? t : m));
      if (PAIR_PIECES[big.ch]) {
        const i = B.indexOf(big);
        w.replace(B, i, i + 1, PAIR_PIECES[big.ch].split(''));
        w.snap(`${big.ch} is the same as ${PAIR_PIECES[big.ch]}. Write it the long way, so each letter can be taken away.`);
        continue;
      }
      const pairA = A.find((x) => isOpen(x) && PAIR_PIECES[x.ch] && PAIR_PIECES[x.ch].includes(big.ch));
      const bigger = A.filter((x) => isOpen(x) && x.ch.length === 1 && VALUE[x.ch] > VALUE[big.ch]);
      if (!pairA && bigger.length) {
        // Trade the last of the smallest letters that are bigger than the one we need.
        const from = bigger.reduce((m, t) => (VALUE[t.ch] <= VALUE[m.ch] ? t : m));
        const i = A.indexOf(from);
        w.replace(A, i, i + 1, TRADE[from.ch].split(''));
        w.snap(`Not enough ${big.ch}'s. Trade one ${from.ch} for ${TRADE[from.ch].split('').join(' + ')}.`);
        continue;
      }
      const opening = pairA || A.find((x) => isOpen(x) && PAIR_PIECES[x.ch]);
      if (!opening) break;
      const i = A.indexOf(opening);
      w.replace(A, i, i + 1, PAIR_PIECES[opening.ch].split(''));
      w.snap(`${opening.ch} is a short way to write ${PAIR_PIECES[opening.ch]}. Write it the long way.`);
    }
    // The left side is done. What is left goes after the = sign, in order, and is regrouped there.
    w.state.right = A.filter(isOpen).map((t) => tile(t.ch, 'new')).sort((x, y) => lenientValue(y.ch) - lenientValue(x.ch));
    w.state.focus = 'right';
    w.snap(`All of ${b} is taken away. Write what is left after the = sign.`);
    const result = w.regroupRight(total);
    const ok = result === toRoman(total);
    w.steps.push({ kind: 'eq', label: ok ? `Right form: ${result}.` : `Simplest form: ${result}.`, ok, result, eq: eqOf([a, b], ['-'], result) });
    return { steps: w.steps, result, ok, value: total };
  }

  // Add: if the parts of both numbers already slot together in order, that is the answer. Otherwise open the
  // short forms, put every letter after the = sign, biggest first, and regroup there.
  function addEquation(terms) {
    const total = terms.reduce((sum, t) => sum + lenientValue(t), 0);
    const sides = terms.map((t) => chunks(t).map((c) => tile(c.text)));
    const w = equationSteps(sides, terms.slice(1).map(() => '+'));
    w.snap(`Add ${terms.join(' and ')}.`);
    const byBig = (x, y) => lenientValue(y.ch) - lenientValue(x.ch);
    const slotted = sides.flat().slice().sort(byBig);
    if (slotted.map((t) => t.ch).join('') !== toRoman(total)) {
      sides.forEach((list) => {
        for (let i = list.findIndex((t) => PAIR_PIECES[t.ch]); i >= 0; i = list.findIndex((t) => isOpen(t) && PAIR_PIECES[t.ch])) {
          const pair = list[i].ch;
          w.replace(list, i, i + 1, PAIR_PIECES[pair].split(''));
          w.snap(`${pair} is a short way to write ${PAIR_PIECES[pair]}. Write it the long way.`);
        }
      });
    }
    w.state.right = sides.flat().map((t) => tile(t.ch, 'new')).sort(byBig);
    w.state.focus = 'right';
    w.snap('Put all the letters together after the = sign, biggest first.');
    const result = w.regroupRight(total);
    const ok = total <= MAX && result === toRoman(total);
    w.steps.push({ kind: 'eq', label: ok ? `Right form: ${result}.` : `Simplest form: ${result}.`, ok, result, eq: eqOf(terms, terms.slice(1).map(() => '+'), result) });
    return { steps: w.steps, result, ok, value: total };
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

  // Add & Subtract: a random equation. The easy one has two numerals. The harder one (the chili button) has three,
  // with additions and subtractions mixed, so it takes several steps. The sum never goes below one.
  function randomEquation(harder = false, rand = Math.random) {
    if (!harder) return randomSum(rand);
    for (;;) {
      const a = randomInt(10, 99, rand);
      const ops = [rand() < 0.5 ? '+' : '-', rand() < 0.5 ? '+' : '-'];
      const b = randomInt(1, 60, rand);
      const c = randomInt(1, 60, rand);
      let value = ops[0] === '+' ? a + b : a - b;
      if (value < 1) continue;
      value = ops[1] === '+' ? value + c : value - c;
      if (value < 1 || value > 150) continue;
      return { text: `${toRoman(a)} ${ops[0]} ${toRoman(b)} ${ops[1]} ${toRoman(c)}`, value };
    }
  }

  // Fix It: a bad numeral made by writing each subtractive pair as its pieces (XL becomes XXXX).
  // Only numbers with a pair are used, so the bad numeral is always wrong and the answer is always the simplest form.
  function disarrange(s) {
    return s.replace(/IV|IX|XL|XC|CD|CM/g, (pair) => PAIR_PIECES[pair]);
  }
  const DISARRANGEABLE = [];
  for (let n = 2; n <= 99; n++) if (disarrange(toRoman(n)) !== toRoman(n)) DISARRANGEABLE.push(n);

  // The chili makes harder ones: numerals that break two or more pairs, like MCMXCIV written as DCCCCLXXXXVIIII
  const HARDER_DISARRANGEABLE = [];
  for (let n = 2; n <= MAX; n++) if ((toRoman(n).match(/IV|IX|XL|XC|CD|CM/g) || []).length >= 2) HARDER_DISARRANGEABLE.push(n);

  function randomDisarranged(rand = Math.random, harder = false) {
    const pool = harder ? HARDER_DISARRANGEABLE : DISARRANGEABLE;
    const value = pool[randomInt(0, pool.length - 1, rand)];
    return { numeral: disarrange(toRoman(value)), answer: toRoman(value), value };
  }

  // True / False statements for the quiz. Each statement uses at most three different letters.
  const TRUE_FALSE = [
    { prompt: 'IV means four', answer: 'True' },
    { prompt: 'IX means nine', answer: 'True' },
    { prompt: 'XL means forty', answer: 'True' },
    { prompt: 'XC means ninety', answer: 'True' },
    { prompt: 'CM means nine hundred', answer: 'True' },
    { prompt: 'LX means sixty', answer: 'True' },
    { prompt: 'III means three', answer: 'True' },
    { prompt: 'XXX means thirty', answer: 'True' },
    { prompt: 'CD means four hundred', answer: 'True' },
    { prompt: 'DC means six hundred', answer: 'True' },
    { prompt: 'IIII is right', answer: 'False', why: 'Rule I: no more than three in a row. Use IV.' },
    { prompt: 'CCCC is right', answer: 'False', why: 'Rule I: no more than three in a row. Use CD.' },
    { prompt: 'LL is right', answer: 'False', why: 'Rule V: the simplest form is C.' },
    { prompt: 'VV is right', answer: 'False', why: 'Rule V: the simplest form is X.' },
    { prompt: 'VIIII is right', answer: 'False', why: 'Rule II: no more than three. Use IX.' },
    { prompt: 'IIV is right', answer: 'False', why: 'Rule III: only one letter before a bigger one.' },
    { prompt: 'XXXX is right', answer: 'False', why: 'Rule V: the simplest form is XL.' },
    { prompt: 'IV means six', answer: 'False', why: 'IV means four.' },
    { prompt: 'IL is right', answer: 'False', why: 'Not well written. Write it as XLIX.' },
    { prompt: 'IC is right', answer: 'False', why: 'Not well written. Write it as XCIX.' },
    { prompt: 'VIX is right', answer: 'False', why: 'Not well written. Write it as XIV.' },
  ];

  return {
    VALUE, PAIR_PIECES, TRADE, MAX, LETTER_LIMIT, QUIZ_MAX_TYPES, TRUE_FALSE, DISARRANGEABLE, RANDOM_NUMERALS,
    lenientValue, eqOf, toRoman, words, chunks, check, calculate, repairPlan, regroupPlan, addEquation, takeAwayEquation, firstRepair, parse, disarrange,
    randomNumeral, randomSum, randomEquation, randomDisarranged,
  };
});
