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

test('calculate: XL - XX = XX, with the second number broken into its own step', () => {
  const r = Roman.calculate(['XL', 'XX'], ['-']);
  assert.equal(r.error, null);
  assert.equal(r.result, 'XX');
  assert.equal(r.value, 20);
  const i = r.steps.findIndex((s) => s.text.startsWith('Second number'));
  assert.ok(i > 0, 'second number has its own step');
  assert.equal(r.steps[r.steps.length - 1].text, 'Simplest form: XX.');
});

test('calculate: the first step is the full sum with every chunk on the line', () => {
  const r = Roman.calculate(['XLI', 'XIX'], ['+']);
  const first = r.steps[0];
  assert.equal(first.text, 'Full sum: XLI + XIX.');
  assert.deepEqual(first.line.map((t) => (t.op ? t.text : t.text)), ['XL', 'I', '+', 'X', 'IX']);
  assert.deepEqual(first.board, []);
});

test('calculate: XLI + XIX = LX, and IX is broken into V and IIII on the way', () => {
  const r = Roman.calculate(['XLI', 'XIX'], ['+']);
  assert.equal(r.result, 'LX');
  assert.equal(r.value, 60);
  const brk = r.steps.find((s) => s.text === 'Break IX into V I I I I.');
  assert.ok(brk, 'IX break step');
  const focus = brk.line.find((t) => t.focus);
  assert.equal(focus.text, 'IX');
  assert.equal(focus.becomes, 'VIIII');
});

test('calculate: a broken pair is shown on the line with its arrow, and the other chunks stay put', () => {
  const r = Roman.calculate(['XL', 'XX'], ['-']);
  const brk = r.steps.find((s) => s.text === 'Break XL into X X X X.');
  assert.equal(brk.line.filter((t) => t.focus).length, 1);
  assert.equal(brk.line.find((t) => t.focus).becomes, 'XXXX');
});

test('calculate: every take-away step crosses out as many pieces as its caption says', () => {
  const r = Roman.calculate(['XL', 'IX'], ['-']);
  const takes = r.steps.filter((s) => s.text.startsWith('Take away'));
  assert.ok(takes.length > 0);
  for (const s of takes) {
    const m = s.text.match(/^Take away (\d+) /);
    const n = m ? Number(m[1]) : 1;
    assert.equal(s.board.filter((t) => t.st === 'cross').length, n, s.text);
  }
  assert.equal(r.result, 'XXXI');
});

test("calculate: XCVI - XCIII matches the same XC on both sides, then trades one V for I's", () => {
  const r = Roman.calculate(['XCVI', 'XCIII'], ['-']);
  assert.equal(r.steps[1].text, 'Put XCVI on the board.');
  assert.deepEqual(r.steps[1].board.map((t) => t.ch), ['XC', 'V', 'I']);
  assert.equal(r.steps[3].text, 'Take away XC. The same is on both sides.');
  assert.ok(r.steps.some((s) => s.text === 'No I to take away, so trade one V for I I I I I.'));
  assert.equal(r.steps.find((s) => s.text === "Take away 3 I's.").board.filter((t) => t.st === 'cross').length, 3);
  assert.equal(r.result, 'III');
});

test("Fix It: LXXXXVII changes only LXL to XC, and keeps VII", () => {
  const p = Roman.repairPlan('LXXXXVII');
  const last = p.steps.filter((s) => s.kind === 'repair').pop();
  assert.equal(last.label, 'Write the simplest form');
  assert.equal(last.before.map((t) => t.ch).join(''), 'LXLVII');
  assert.deepEqual(last.before.map((t) => t.st), ['cross', 'cross', 'cross', 'normal', 'normal', 'normal']);
  assert.equal(last.after.map((t) => t.ch).join(''), 'XCVII');
  assert.equal(p.result, 'XCVII');
});

test('calculate: XL + XX - IX = LI (multi-step, needs a trade)', () => {
  const r = Roman.calculate(['XL', 'XX', 'IX'], ['+', '-']);
  assert.equal(r.result, 'LI');
  assert.equal(r.value, 51);
  assert.ok(r.steps.some((s) => s.text.includes('trade')));
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
