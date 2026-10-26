// Run with: node "03 Projects/Roman Numerals/tests/roman.test.js"
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
  assert.equal(Roman.LETTER_LIMIT, 10);
  const long = Roman.check('MDCCCLXXXVIII');
  assert.equal(long.ok, false);
  assert.equal(long.value, 1888);
  assert.ok(long.issues.some((i) => i.rule === 'length'));
  assert.equal(Roman.check('MDLX').ok, true);
  assert.equal(Roman.check('MMMDCCCLXXXVIII').ok, false);
});

test('quiz numerals use at most three different letters', () => {
  assert.equal(Roman.QUIZ_MAX_TYPES, 3);
  for (const item of Roman.TRUE_FALSE) {
    const numeral = item.prompt.split(' ')[0];
    const types = new Set(numeral);
    assert.ok(types.size <= Roman.QUIZ_MAX_TYPES, `${item.prompt} uses ${types.size} letter types`);
  }
});

test('Fix It: a disarranged numeral is wrong, its answer is the simplest form, and both have the same value', () => {
  for (let i = 0; i < 300; i++) {
    const d = Roman.randomDisarranged();
    assert.equal(Roman.check(d.numeral).ok, false, d.numeral);
    assert.equal(Roman.check(d.answer).ok, true, d.answer);
    assert.equal(Roman.lenientValue(d.numeral), d.value, d.numeral);
    assert.equal(Roman.toRoman(d.value), d.answer);
  }
});

test('Fix It: a fixed sequence gives a known disarranged numeral (XIV becomes XIIII)', () => {
  assert.equal(Roman.disarrange('XIV'), 'XIIII');
  assert.equal(Roman.disarrange('XLIX'), 'XXXXVIIII');
  assert.equal(Roman.randomDisarranged(() => 0).numeral, Roman.disarrange(Roman.toRoman(Roman.DISARRANGEABLE[0])));
});

test('Build & Break: random numerals are in simplest form and within the letter limit', () => {
  for (let i = 0; i < 300; i++) {
    const s = Roman.randomNumeral();
    assert.equal(Roman.check(s).ok, true, s);
  }
  for (const s of Roman.RANDOM_NUMERALS) assert.ok(s.length <= Roman.LETTER_LIMIT, s);
  assert.ok(!Roman.RANDOM_NUMERALS.includes('CCCLXXXVIII'));
});

test('Add & Subtract: random sums are readable, calculate to the stated value, and never go below 1', () => {
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

test('numbers above 3999 are not accepted', () => {
  const r = Roman.check('MMMM');
  assert.equal(r.ok, false);
  assert.ok(r.issues.some((i) => i.rule === null));
  assert.ok(Roman.calculate(['MMM', 'MMM'], ['+']).error);
});

test('Rule 1: more than three in a row is wrong, with the simplest form', () => {
  const r = Roman.check('IIII');
  assert.equal(r.ok, false);
  assert.ok(r.issues.some((i) => i.rule === 1));
  assert.ok(r.issues.some((i) => i.rule === 5));
  assert.equal(r.simplest, 'IV');
});

test('Rule 2: more than three smaller numerals after a bigger one', () => {
  const r = Roman.check('VIIII');
  assert.ok(r.issues.some((i) => i.rule === 2));
  assert.equal(r.simplest, 'IX');
});

test('Rule 3: only one smaller numeral may go before a bigger one', () => {
  const r = Roman.check('IIX');
  assert.ok(r.issues.some((i) => i.rule === 3));
});

test('IL is not a named rule: it is shown as its simplest form (XLIX)', () => {
  const r = Roman.check('IL');
  assert.equal(r.ok, false);
  assert.equal(r.simplest, 'XLIX');
  assert.ok(r.issues.some((i) => i.rule === 5));
});

test('Rule 5: VV and XXXX are not the simplest form', () => {
  assert.equal(Roman.check('VV').simplest, 'X');
  assert.equal(Roman.check('XXXX').simplest, 'XL');
  assert.ok(Roman.check('XXXX').issues.some((i) => i.rule === 5));
});

test('a correct numeral has no issues', () => {
  for (const s of ['IV', 'XIX', 'XLI', 'MCD']) assert.equal(Roman.check(s).ok, true, s);
});

test('calculate: XL - XX = XX (the worked example)', () => {
  const r = Roman.calculate(['XL', 'XX'], ['-']);
  assert.equal(r.error, null);
  assert.equal(r.result, 'XX');
  assert.equal(r.value, 20);
});

test('calculate: XL + XX - IX = LI (multi-step, needs a trade)', () => {
  const r = Roman.calculate(['XL', 'XX', 'IX'], ['+', '-']);
  assert.equal(r.result, 'LI');
  assert.equal(r.value, 51);
  assert.ok(r.steps.some((s) => s.text.includes('trade')));
});

test('calculate: XL - IX = XXXI', () => {
  assert.equal(Roman.calculate(['XL', 'IX'], ['-']).result, 'XXXI');
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

test('parse reads an expression and rejects bad input', () => {
  const p = Roman.parse('XL + XX − IX');
  assert.deepEqual(p.terms, ['XL', 'XX', 'IX']);
  assert.deepEqual(p.ops, ['+', '-']);
  assert.ok(Roman.parse('XL +').error);
  assert.ok(Roman.parse('XL + Q').error);
});

test('Build & Break: the first step is the numeral as typed, and each later step changes one pair or one group', () => {
  const r = Roman.calculate(['XLIX'], []);
  assert.equal(r.steps[0].text, 'Start with XLIX = 49.');
  assert.deepEqual(r.steps[0].tiles.map((t) => t.ch), ['XL', 'IX']);
  assert.equal(r.steps[1].text, 'Break XL into X X X X.');
  assert.equal(r.steps[2].text, 'Break IX into V I I I I.');
  assert.equal(r.steps[r.steps.length - 1].text, 'Build it back up: XLIX.');
  for (const s of r.steps) assert.equal(s.value, 49, s.text);
});

test('Add & Subtract: the second number gets its own step before anything is taken away', () => {
  const r = Roman.calculate(['XL', 'XX'], ['-']);
  const i = r.steps.findIndex((s) => s.text.startsWith('Second number XX'));
  assert.ok(i > 0);
  assert.deepEqual(r.steps[i].tiles.map((t) => t.ch), ['X', 'X']);
  assert.equal(r.steps[i + 1].text, 'Take away X.');
  assert.equal(r.steps[i + 2].text, 'Take away X.');
  assert.equal(r.result, 'XX');
});

test('Add & Subtract: every take-away step removes exactly one piece', () => {
  const r = Roman.calculate(['XL', 'IX'], ['-']);
  const takes = r.steps.filter((s) => s.text.startsWith('Take away'));
  assert.ok(takes.length > 0);
  for (const s of takes) assert.equal(s.tiles.filter((t) => t.st === 'cross').length, 1, s.text);
  assert.equal(r.result, 'XXXI');
});

test('Fix It: IIII names Rule 1 and Rule 5, and ends with the simplest form IV', () => {
  const f = Roman.fixSteps('IIII');
  assert.equal(f.ok, false);
  assert.ok(f.steps[0].text.startsWith('Rule 1:'));
  assert.ok(f.steps.some((s) => s.text.startsWith('Rule 5:')));
  assert.equal(f.result, 'IV');
  assert.equal(f.steps[f.steps.length - 1].text, 'Build it back up: IV.');
});

test('Fix It: a good numeral has no rule steps, and its steps still rebuild it', () => {
  const f = Roman.fixSteps('XLIX');
  assert.equal(f.ok, true);
  assert.ok(!f.steps.some((s) => s.text.startsWith('Rule')));
  assert.equal(f.result, 'XLIX');
});

console.log(`\n${passed} tests passed`);
