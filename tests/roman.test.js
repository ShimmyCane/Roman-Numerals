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
  assert.equal(r.steps[0].text, 'Full sum: XXIX + XXII.');
  assert.deepEqual(r.steps[0].tokens.map((t) => t.text), ['X', 'X', 'IX', '+', 'X', 'X', 'I', 'I']);
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
  assert.ok(r.steps.some((s) => s.text === 'Ones: IX (9) + II (2) = 11. Write XI.'));
  assert.ok(r.steps.some((s) => s.text.startsWith('XI has one X in it') && s.text.includes('Move the X up to the tens')));
  assert.ok(r.steps.some((s) => s.text === 'Tens: XX (20) + XX (20) + X (10) = 50. Write L.'));
  assert.equal(r.steps[r.steps.length - 1].text, 'Put the places together: L + I = LI.');
});

test('calculate: each place step changes one place (two for a carry or a borrow), and shows what it was', () => {
  for (const [t, o] of [[['XXIX', 'XXII'], ['+']], [['XLI', 'IX'], ['-']], [['C', 'I'], ['-']], [['CXCV', 'XV'], ['+']]]) {
    const r = Roman.calculate(t, o);
    for (const s of r.steps.filter((x) => x.kind === 'places').slice(1)) {
      const changed = s.boxes.filter((b) => b.focus);
      assert.ok(changed.length >= 1, s.text);
      assert.ok(changed.every((b) => Array.isArray(b.was) || b.items.some((it) => it.fresh)), s.text);
      if (!/Borrow|Move/.test(s.text)) assert.equal(changed.length, 1, s.text);
    }
  }
});

test('calculate: XCVI - XCIII takes away place by place', () => {
  const r = Roman.calculate(['XCVI', 'XCIII'], ['-']);
  assert.equal(r.result, 'III');
  assert.ok(r.steps.some((s) => s.text === 'Ones: VI (6) − III (3) = 3. Write III.'));
  assert.ok(r.steps.some((s) => s.text === 'Tens: XC (90) − XC (90) = 0. Nothing is left in the tens.'));
});

test('calculate: XLI - IX borrows one X from the tens', () => {
  const r = Roman.calculate(['XLI', 'IX'], ['-']);
  assert.equal(r.result, 'XXXII');
  assert.ok(r.steps.some((s) => s.text === 'Ones: I is less than IX. Borrow one X from the tens: XL becomes XXX, and I becomes XI.'));
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
  assert.equal(p.steps[1].label, "4 I's in a row");
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

test('Build & Random: random numerals are in simplest form and within the letter limit', () => {
  for (let i = 0; i < 300; i++) assert.equal(Roman.check(Roman.randomNumeral()).ok, true);
  for (const s of Roman.RANDOM_NUMERALS) assert.ok(s.length <= Roman.LETTER_LIMIT, s);
  assert.ok(!Roman.RANDOM_NUMERALS.includes('CCCLXXXVIII'));
});

console.log(`\n${passed} tests passed`);
