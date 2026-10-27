// Run with: node tests/roman.test.js
const assert = require('node:assert/strict');
const Roman = require('../roman.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

test('toRoman gives the simplest form', () => {
  assert.equal(Roman.toRoman(4), 'IV');
  assert.equal(Roman.toRoman(40), 'XL');
  assert.equal(Roman.toRoman(1994), 'MCMXCIV');
  assert.equal(Roman.toRoman(3000), 'MMM');
  assert.throws(() => Roman.toRoman(0));
  assert.throws(() => Roman.toRoman(4000));
});

test('every number 1 to 3999 round-trips; short numerals pass the checker', () => {
  assert.equal(Roman.MAX, 3999);
  assert.equal(Roman.toRoman(1500), 'MD');
  for (let n = 1; n <= Roman.MAX; n++) {
    const s = Roman.toRoman(n);
    assert.equal(Roman.lenientValue(s), n, s);
    const r = Roman.check(s);
    if (s.length <= Roman.LETTER_LIMIT) assert.equal(r.ok, true, s);
    else assert.deepEqual(r.issues.map((i) => i.rule), ['length'], s);
  }
});

test('typed numerals over 10 letters are flagged, but still read correctly', () => {
  const long = Roman.check('MDCCCLXXXVIII');
  assert.equal(long.ok, false);
  assert.equal(long.value, 1888);
  assert.ok(long.issues.some((i) => i.rule === 'length'));
  assert.equal(Roman.check('MDLX').ok, true);
});

test('quiz statements are True or False only, and none is Ambiguous', () => {
  for (const item of Roman.TRUE_FALSE) assert.ok(['True', 'False'].includes(item.answer), item.prompt);
  assert.equal(Roman.TRUE_FALSE.find((t) => t.prompt === 'IL is right').answer, 'False');
});

test('quiz numerals use at most three different letters', () => {
  for (const item of Roman.TRUE_FALSE) {
    const numeral = item.prompt.split(' ')[0];
    assert.ok(new Set(numeral).size <= Roman.QUIZ_MAX_TYPES, item.prompt);
  }
});

test('Rule checks: 1, 2, 3, 5 each name the right rule', () => {
  assert.ok(Roman.check('IIII').issues.some((i) => i.rule === 1));
  assert.ok(Roman.check('VIIII').issues.some((i) => i.rule === 2));
  assert.ok(Roman.check('IIX').issues.some((i) => i.rule === 3));
  assert.equal(Roman.check('VV').simplest, 'X');
  assert.equal(Roman.check('XXXX').simplest, 'XL');
  assert.equal(Roman.check('IL').simplest, 'XLIX');
});

test('numbers above 3999 are not accepted', () => {
  const r = Roman.check('MMMM');
  assert.equal(r.ok, false);
  assert.ok(r.issues.some((i) => i.rule === null));
  assert.ok(Roman.calculate(['MMM', 'MMM'], ['+']).error);
});

test('calculate: the first step is the whole sum', () => {
  const r = Roman.calculate(['XXIX', 'XXII'], ['+']);
  assert.equal(r.steps[0].text, 'The whole problem: XXIX + XXII.');
  const eq = r.steps[0].eq.items.map((it) => (it.kind === 'op' ? it.text : it.tiles.map((t) => t.ch)));
  assert.deepEqual(eq, [['X', 'X', 'IX'], '+', ['X', 'X', 'I', 'I']]);
});

test('calculate: X + LXXV is one slide-in step (the short way)', () => {
  const r = Roman.calculate(['X', 'LXXV'], ['+']);
  assert.equal(r.result, 'LXXXV');
  assert.equal(r.steps.length, 2);
  assert.equal(r.steps[1].text, 'Slide X in among the letters of LXXV: LXXXV. Nothing else needs to change.');
  assert.equal(r.steps[1].tokens.filter((t) => t.st === 'focus').map((t) => t.text).join(''), 'X');
});

test('calculate: XXIX + XXII works by place and never opens IX into VIIII', () => {
  const r = Roman.calculate(['XXIX', 'XXII'], ['+']);
  assert.equal(r.result, 'LI');
  assert.ok(!r.steps.some((s) => s.text.includes('VIIII') || s.text.includes('V + I + I')), 'no needless expansion');
  assert.ok(r.steps.some((s) => s.text === 'Ones: IX + II = XI.'));
  assert.ok(r.steps.some((s) => s.text.startsWith('XI has an X in it') && s.text.includes('so move it up')));
  assert.ok(r.steps.some((s) => s.text === 'Tens: XX + XX + X = L.'));
  assert.equal(r.steps[r.steps.length - 1].text, 'Put the columns together: L + I = LI.');
});

test('calculate: each place step changes one place (two for a carry or a borrow), and shows what it was', () => {
  for (const [t, o] of [[['XXIX', 'XXII'], ['+']], [['XLI', 'IX'], ['-']], [['C', 'I'], ['-']], [['CXCV', 'XV'], ['+']]]) {
    const r = Roman.calculate(t, o);
    for (const s of r.steps.filter((x) => x.kind === 'places').slice(1)) {
      const changed = s.boxes.filter((b) => b.focus);
      assert.ok(changed.length >= 1, s.text);
      assert.ok(changed.every((b) => Array.isArray(b.was) || b.items.some((it) => it.fresh)), s.text);
      if (!/borrow|get one|move/i.test(s.text)) assert.equal(changed.length, 1, s.text);
    }
  }
});

test('calculate: XCVI - XCIII takes away place by place', () => {
  const r = Roman.calculate(['XCVI', 'XCIII'], ['-']);
  assert.equal(r.result, 'III');
  assert.ok(r.steps.some((s) => s.text === 'Ones: VI − III = III.'));
  assert.ok(r.steps.some((s) => s.text === 'Tens: XC − XC leaves nothing in the tens.'));
});

test('calculate: XLI - IX borrows one X from the tens', () => {
  const r = Roman.calculate(['XLI', 'IX'], ['-']);
  assert.equal(r.result, 'XXXII');
  assert.ok(r.steps.some((s) => s.text === 'Ones: I is less than IX. Get one X from the tens: XL becomes XXX, and I becomes XI.'));
});

test('calculate: C - I borrows across an empty place (the tens get XC)', () => {
  const r = Roman.calculate(['C', 'I'], ['-']);
  assert.equal(r.result, 'XCIX');
  assert.ok(r.steps.some((s) => s.text.includes('the tens get XC')));
});

test('calculate: LXXV - XV is the short way (cross out, then what is left)', () => {
  const r = Roman.calculate(['LXXV', 'XV'], ['-']);
  assert.equal(r.result, 'LX');
  assert.equal(r.steps.length, 3);
  assert.equal(r.steps[1].tokens.filter((t) => t.st === 'cross').map((t) => t.text).join(''), 'XV');
});

test('calculate: XL + XX - IX = LI (two pairs, one after the other)', () => {
  const r = Roman.calculate(['XL', 'XX', 'IX'], ['+', '-']);
  assert.equal(r.result, 'LI');
  assert.equal(r.value, 51);
  assert.ok(r.steps.some((s) => s.text === 'Next: LX − IX.'));
});

test('calculate: nothing left is reported, not shown as a numeral', () => {
  const r = Roman.calculate(['XL', 'XL'], ['-']);
  assert.ok(r.error);
  assert.equal(r.result, null);
});

test('calculate: negative results are reported, not shown as numerals', () => {
  const r = Roman.calculate(['I', 'II'], ['-']);
  assert.ok(r.error);
  assert.equal(r.result, null);
});

test('calculate matches plain arithmetic for many pairs', () => {
  for (let a = 1; a <= 60; a++) {
    for (let b = 1; b <= 60; b++) {
      const sum = Roman.calculate([Roman.toRoman(a), Roman.toRoman(b)], ['+']);
      assert.equal(sum.result, Roman.toRoman(a + b), `${a}+${b}`);
      if (a > b) {
        const diff = Roman.calculate([Roman.toRoman(a), Roman.toRoman(b)], ['-']);
        assert.equal(diff.result, Roman.toRoman(a - b), `${a}-${b}`);
      }
    }
  }
});

test('random sums are readable, calculate to the stated value, and never go below 1', () => {
  for (let i = 0; i < 300; i++) {
    const s = Roman.randomSum();
    const p = Roman.parse(s.text);
    assert.ok(!p.error, s.text);
    const r = Roman.calculate(p.terms, p.ops);
    assert.equal(r.error, null, s.text);
    assert.equal(r.value, s.value, s.text);
    assert.ok(s.value >= 1, s.text);
  }
});

test('parse reads an expression and rejects bad input', () => {
  const p = Roman.parse('XL + XX − IX');
  assert.deepEqual(p.terms, ['XL', 'XX', 'IX']);
  assert.deepEqual(p.ops, ['+', '-']);
  assert.ok(Roman.parse('XL +').error);
  assert.ok(Roman.parse('XL + Q').error);
});

test('Fix It: XXIIII is repaired with one rule, then XXIV (the eyes example)', () => {
  const p = Roman.repairPlan('XXIIII');
  assert.deepEqual(p.steps.map((s) => s.kind), ['start', 'repair', 'done']);
  assert.equal(p.steps[1].label, "Four I's in a row");
  assert.equal(p.steps[1].rule, 1);
  assert.equal(p.result, 'XXIV');
  assert.equal(p.ok, true);
});

test('Fix It: the repair grays out the bad part and puts the fix beside it', () => {
  const p = Roman.repairPlan('XXIIII');
  const rep = p.steps[1];
  assert.deepEqual(rep.before.map((t) => t.st), ['normal', 'normal', 'cross', 'cross', 'cross', 'cross']);
  assert.deepEqual(rep.after.map((t) => t.ch).join(''), 'XXIV');
});

test('Fix It: LXXXXVII changes only LXL to XC, and keeps VII', () => {
  const p = Roman.repairPlan('LXXXXVII');
  const last = p.steps.filter((s) => s.kind === 'repair').pop();
  assert.equal(last.label, 'Write the simplest form');
  assert.equal(last.before.map((t) => t.ch).join(''), 'LXLVII');
  assert.deepEqual(last.before.map((t) => t.st).join(','), 'cross,cross,cross,normal,normal,normal'.replace(/normal/g, 'normal'));
  assert.equal(last.after.map((t) => t.ch).join(''), 'XCVII');
  assert.equal(p.result, 'XCVII');
});

test('Fix It: VIIII takes two repairs, then IX', () => {
  const p = Roman.repairPlan('VIIII');
  assert.equal(p.steps.filter((s) => s.kind === 'repair').length, 2);
  assert.equal(p.result, 'IX');
  assert.equal(p.ok, true);
});

test('Fix It: every repair ends at a numeral that checks as right', () => {
  for (const d of Array.from({ length: 200 }, () => Roman.randomDisarranged())) {
    const p = Roman.repairPlan(d.numeral);
    assert.equal(p.ok, true, d.numeral);
    assert.equal(p.result, d.answer, d.numeral);
    assert.equal(Roman.check(p.result).ok, true, p.result);
  }
});

test('Fix It: a good numeral has no repair steps', () => {
  const p = Roman.repairPlan('XLIX');
  assert.deepEqual(p.steps.map((s) => s.kind), ['start', 'done']);
  assert.equal(p.ok, true);
});

test('Regroup: XXVII + XVIII puts the letters in order, regroups, then writes XL', () => {
  const p = Roman.regroupPlan(['XXVII', 'XVIII']);
  assert.equal(p.result, 'XLV');
  const labels = p.steps.filter((s) => s.kind === 'repair').map((s) => s.label);
  assert.deepEqual(labels, [
    'Put the biggest letters first.',
    "Five I's make one V.",
    "Two V's make one X.",
    'XXXX is the long way. The short way is XL.',
  ]);
});

test('Regroup: a short form is opened inside its own number, never across two numbers', () => {
  // XXVII + XVIII joined is XXVIIXVIII, which contains IX across the join. It must not be opened.
  const p = Roman.regroupPlan(['XXVII', 'XVIII']);
  assert.ok(!p.steps.some((s) => s.label && s.label.startsWith('IX is a short way')));
});

test('Regroup: every sum up to 200 + 200 ends at the simplest form', () => {
  for (let a = 1; a <= 200; a += 3) {
    for (let b = 1; b <= 200; b += 7) {
      const p = Roman.regroupPlan([Roman.toRoman(a), Roman.toRoman(b)]);
      assert.equal(p.result, Roman.toRoman(a + b), `${a}+${b}`);
      assert.equal(p.ok, true);
    }
  }
});

test('Take away on one line: LXXXV − LXVI crosses L, X and V in one move, trades the last X down, then regroups after =', () => {
  const p = Roman.takeAwayEquation('LXXXV', 'LXVI');
  assert.equal(p.result, 'XIX');
  assert.deepEqual(p.steps.map((s) => s.label), [
    'Start with LXXXV. Take away LXVI.',
    'Both numbers have L, X and V. Take them away: cross them out on both sides.',
    "Not enough I's. Trade one X for V + V.",
    "Not enough I's. Trade one V for I + I + I + I + I.",
    'Now take away I: cross it out on both sides.',
    'All of LXVI is taken away. Write what is left after the = sign.',
    'VIIII is the long way. The short way is IX.',
    'Right form: XIX.',
  ]);
  // Every row is one equation line. The left side is in focus until the = side is written.
  assert.ok(p.steps.every((s) => s.kind === 'eq' && s.eq));
  assert.deepEqual(p.steps.slice(0, -1).map((s) => s.eq.focus), ['left', 'left', 'left', 'left', 'left', 'right', 'right']);
  assert.equal(p.steps[0].eq.right, 'ask');
  // The trade fades the last X and puts V V in its place.
  assert.deepEqual(p.steps[2].eq.items[0].tiles.map((t) => `${t.st[0]}${t.ch}`), ['cL', 'cX', 'nX', 'gX', 'nV', 'nV', 'cV']);
});

test('Take away on one line: every difference up to M ends at the simplest form, with all of the second number crossed out', () => {
  for (let a = 2; a <= 1000; a += 1) {
    for (let b = 1; b < a; b += (a > 300 ? 7 : 1)) {
      const p = Roman.takeAwayEquation(Roman.toRoman(a), Roman.toRoman(b));
      assert.equal(p.result, Roman.toRoman(a - b), `${a}-${b}`);
      assert.equal(p.ok, true);
      const written = p.steps.find((s) => s.eq.focus === 'right');
      assert.deepEqual(written.eq.items[2].tiles.filter((t) => t.st !== 'cross'), [], `${a}-${b}`);
    }
  }
});

test('Add on one line: X + LXXV slots straight in; every sum up to DC + DC ends at the simplest form', () => {
  assert.deepEqual(Roman.addEquation(['X', 'LXXV']).steps.map((s) => s.label), [
    'Add X and LXXV.',
    'Put all the letters together after the = sign, biggest first.',
    'Right form: LXXXV.',
  ]);
  for (let a = 1; a <= 600; a += 1) {
    for (let b = 1; b <= 600; b += (a > 200 ? 5 : 1)) {
      const p = Roman.addEquation([Roman.toRoman(a), Roman.toRoman(b)]);
      assert.equal(p.result, Roman.toRoman(a + b), `${a}+${b}`);
    }
  }
});

test('No Arabic numerals in any step caption (they belong only on the Long Ago tab)', () => {
  const texts = [];
  for (let a = 1; a <= 120; a += 7) {
    for (let b = 1; b <= 120; b += 11) {
      const A = Roman.toRoman(a);
      const B = Roman.toRoman(b);
      Roman.calculate([A, B], ['+']).steps.forEach((s) => texts.push(s.text));
      if (a > b) Roman.calculate([A, B], ['-']).steps.forEach((s) => texts.push(s.text));
      Roman.regroupPlan([A, B]).steps.forEach((s) => texts.push(s.label || ''));
      Roman.addEquation([A, B]).steps.forEach((s) => texts.push(s.label));
      if (a > b) Roman.takeAwayEquation(A, B).steps.forEach((s) => texts.push(s.label));
    }
  }
  ['XXIIII', 'VIIII', 'IIX', 'LXXXXVII', 'MMMM', 'MDCCCLXXXVIII'].forEach((n) => {
    Roman.repairPlan(n).steps.forEach((s) => texts.push(s.label || ''));
    Roman.check(n).issues.forEach((i) => texts.push(i.text));
  });
  Roman.TRUE_FALSE.forEach((t) => texts.push(t.prompt, t.why || ''));
  const withDigits = texts.filter((t) => /[0-9]/.test(t));
  assert.deepEqual(withDigits, []);
});

test('words writes values in words', () => {
  assert.equal(Roman.words(4), 'four');
  assert.equal(Roman.words(49), 'forty-nine');
  assert.equal(Roman.words(900), 'nine hundred');
  assert.equal(Roman.words(1994), 'one thousand nine hundred ninety-four');
});

test('Build & Random: random numerals are in simplest form and within the letter limit', () => {
  for (let i = 0; i < 300; i++) assert.equal(Roman.check(Roman.randomNumeral()).ok, true);
  for (const s of Roman.RANDOM_NUMERALS) assert.ok(s.length <= Roman.LETTER_LIMIT, s);
  assert.ok(!Roman.RANDOM_NUMERALS.includes('CCCLXXXVIII'));
});

test('Counting board: every row carries the whole equation, and the last row has the answer', () => {
  const text = (eq) => eq.items.map((it) => (it.kind === 'op' ? it.text : it.tiles.map((t) => t.ch).join(''))).join(' ');
  const board = Roman.calculate(['XL', 'XX', 'IX'], ['+', '-']);
  assert.equal(text(board.steps[0].eq), 'XL + XX − IX');
  assert.equal(board.steps[board.steps.length - 1].eq.result, 'LI');
});

test('Random equation: the easy one has two numerals, the harder one has three with mixed + and −; every one works out', () => {
  for (let i = 0; i < 1000; i++) {
    for (const harder of [false, true]) {
      const r = Roman.randomEquation(harder);
      const p = Roman.parse(r.text);
      assert.equal(p.error, undefined, r.text);
      assert.equal(p.terms.length, harder ? 3 : 2, r.text);
      let cur = p.terms[0];
      for (let k = 1; k < p.terms.length; k++) {
        const v = p.ops[k - 1] === '+' ? Roman.lenientValue(cur) + Roman.lenientValue(p.terms[k]) : Roman.lenientValue(cur) - Roman.lenientValue(p.terms[k]);
        assert.ok(v >= 1, r.text);
        cur = Roman.toRoman(v);
      }
      assert.equal(Roman.lenientValue(cur), r.value, r.text);
    }
  }
  const harder = Array.from({ length: 300 }, () => Roman.parse(Roman.randomEquation(true).text).ops);
  assert.ok(harder.some((ops) => ops.includes('+')) && harder.some((ops) => ops.includes('-')), 'additions and subtractions are mixed');
});

test('Chili on Fix It: harder numerals break two or more pairs, and still fix to the simplest form', () => {
  for (let i = 0; i < 200; i++) {
    const { numeral, answer, value } = Roman.randomDisarranged(Math.random, true);
    assert.equal(Roman.toRoman(value), answer);
    assert.ok((answer.match(/IV|IX|XL|XC|CD|CM/g) || []).length >= 2, answer);
    assert.equal(Roman.lenientValue(numeral), value, numeral);
  }
});

test('Add many at once: three or more numerals are put together and regrouped once, to the simplest form', () => {
  const plan = Roman.addEquation(['XL', 'XX', 'IX']);
  assert.equal(plan.result, 'LXIX');
  assert.equal(plan.ok, true);
  assert.equal(plan.steps.filter((s) => s.label.startsWith('Put all the letters together')).length, 1);
  for (let i = 0; i < 1000; i += 1) {
    const terms = [Roman.toRoman(1 + (i % 150)), Roman.toRoman(1 + ((i * 7) % 150)), Roman.toRoman(1 + ((i * 13) % 150))];
    const sum = terms.reduce((s, t) => s + Roman.lenientValue(t), 0);
    if (sum > 388) continue;
    assert.equal(Roman.addEquation(terms).result, Roman.toRoman(sum), terms.join(' + '));
  }
});

console.log(`\n${passed} tests passed`);
