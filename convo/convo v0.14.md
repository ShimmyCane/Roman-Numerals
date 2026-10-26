# Convo v0.14 — Jimmy's tenth round

Jimmy's requests (the last one was cut off after "do some more research and", so the Long Ago part covers what was clear):

1. **Add & Subtract shows step one first.** The answer is not shown all at once. Step one appears, the user is invited to think, and Next step reveals the rest. A setting turns "show all at once" on.
2. **Random equation.** The Add & Subtract button is "Random equation". Two in three have two numerals (the easier ones). One in three has three numerals, with additions and subtractions mixed, so it takes several steps.
3. **Settings are grouped by their titles.** Less-used options sit under "Show more options".
4. **Regroup.** The random sum button is hidden. It can be shown again in settings. The pattern chain (five, then two) is removed, so the page is shorter. The ladder of trades and the short forms stay.
5. **Tab order:** Fix It, Add & Subtract, Quiz, Letters, Rules, Regroup, Long Ago. Fix It opens first.
6. **Long Ago: more trivia and cultures.**
   - *Multiplying with letters:* Romans probably multiplied on the counting board, and perhaps by doubling. No Roman paper method is known. Place value makes multiplying on paper possible.
   - *From the Roman way to our way:* a comparison table, plus where the Indian system and the lattice (grid) method came from. The lattice method came through Arab and Persian mathematicians. Fibonacci's 1202 book helped spread the Indian system but did not start the lattice method.
   - *Other ways to write numbers:* the Maya (base twenty, a shell for zero) and Chinese counting rods (a blank for zero).
   - Uncertain points are marked on the page: how Romans multiplied, and when the Maya zero was invented.

## Checked

- `node tests/roman.test.js`: 38 pass. A new test checks 1,000 random equations: each one works out to its value, and about a third have three numerals.
- Browser check at 1024 and 390 wide: the default tab is Fix It. Add & Subtract shows one step, then the prompt. Show all still works. The new setting turns on show-all. The Regroup random button is hidden and comes back from settings. No page errors, no digits outside Long Ago, and no sideways scroll.

## Open questions

- Should "Random equation" always show three numerals on the hardest setting, or keep the mix?
- Is the pattern chain (five, then two) worth keeping anywhere else, or is the ladder enough?
